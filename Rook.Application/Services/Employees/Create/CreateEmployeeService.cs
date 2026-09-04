using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using FluentValidation;
using Rook.Infrastructure.Data;
using Rook.Infrastructure.Identity;
using Rook.Domain.Exceptions.Common;
using Rook.Domain.Entities.Tables.Employees;
using Rook.Infrastructure.Authentication;

namespace Rook.Application.Services.Employees.Create;

public class CreateEmployeeService(
    UserManager<ApplicationUser> userManager,
    IValidator<CreateEmployeeCommand> validator,
    ApplicationDbContext dbContext
)
{
    public async Task<CreateEmployeeResponse> Create(CreateEmployeeCommand request)
    {
        await validator.ValidateAndThrowAsync(request);

        var conflictErrors = new List<FieldError>();

        var existingUserByUsername = await userManager.FindByNameAsync(request.Username);
        if (existingUserByUsername is not null)
        {
            var field = nameof(request.Username);
            conflictErrors.Add(new FieldError(field, ErrorCode.DUPLICATE_VALUE.ToString(), ErrorMessages.For(ErrorCode.DUPLICATE_VALUE, "username")));
        }

        var existingUserByEmail = await userManager.FindByEmailAsync(request.Email);
        if (existingUserByEmail is not null)
        {
            var field = nameof(request.Email);
            conflictErrors.Add(new FieldError(field, ErrorCode.DUPLICATE_VALUE.ToString(), ErrorMessages.For(ErrorCode.DUPLICATE_VALUE, "email")));
        }

        if (conflictErrors.Count > 0)
        {
            throw new ConflictException("One or more conflicts occurred.", conflictErrors);
        }

        // Verify referenced lookup data actually exists before creating anything,
        // so a bad DepartmentId/ShiftPatternId fails cleanly instead of as a
        // raw foreign key constraint violation at save time.
        var employeeDataErrors = new List<FieldError>();

        if (request.DepartmentId is not null)
        {
            var departmentExists = await dbContext.Departments.AnyAsync(d => d.Id == request.DepartmentId);
            if (!departmentExists)
            {
                var field = nameof(request.DepartmentId);
                employeeDataErrors.Add(new FieldError(field, ErrorCode.INVALID_REFERENCE.ToString(), ErrorMessages.For(ErrorCode.INVALID_REFERENCE, "department")));
            }
        }

        if (request.ShiftPatternId is not null)
        {
            var shiftPatternExists = await dbContext.ShiftPatterns.AnyAsync(sp => sp.Id == request.ShiftPatternId);
            if (!shiftPatternExists)
            {
                var field = nameof(request.ShiftPatternId);
                employeeDataErrors.Add(new FieldError(field, ErrorCode.INVALID_REFERENCE.ToString(), ErrorMessages.For(ErrorCode.INVALID_REFERENCE, "shift pattern")));
            }
        }

        if (employeeDataErrors.Count > 0)
        {
            throw new BadRequestException("One or more fields are invalid.", employeeDataErrors);
        }

        var user = new ApplicationUser
        {
            UserName = request.Username,
            Email = request.Email
        };

        var result = await userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => new FieldError(
                IdentityErrorMapper.MapCode(e.Code) ?? "password",
                ErrorCode.VALIDATION_FAILED.ToString(),
                e.Description
            )).ToList();

            throw new BadRequestException("One or more fields are invalid.", errors);
        }

        await userManager.AddToRoleAsync(user, request.Role);

        var employee = new Employee
        {
            UserId = user.Id,
            FirstName = request.FirstName,
            LastName = request.LastName,
            MiddleName = request.MiddleName,
            DepartmentId = request.DepartmentId,
            ShiftPatternId = request.ShiftPatternId,
            ManagerId = request.ManagerId,
            FusionId = request.FusionId,
            WCSId = request.WCSId,
            VoiceConsoleId = request.VoiceConsoleId,
            StartDate = request.StartDate,
        };

        dbContext.Employees.Add(employee);
        await dbContext.SaveChangesAsync();

        return new CreateEmployeeResponse(user.Id, user.UserName!, user.Email!);
    }
}