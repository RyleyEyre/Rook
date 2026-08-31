using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using FluentValidation;
using Rook.Infrastructure.Data;
using Rook.Infrastructure.Identity;
using Rook.Domain.Exceptions.Employees;
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
            conflictErrors.Add(new FieldError("username", "A user with this username already exists."));
        }

        var existingUserByEmail = await userManager.FindByEmailAsync(request.Email);
        if (existingUserByEmail is not null)
        {
            conflictErrors.Add(new FieldError("email", "A user with this email already exists."));
        }

        if (conflictErrors.Count > 0)
        {
            throw new EmployeeAlreadyExistsException(conflictErrors);
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
                employeeDataErrors.Add(new FieldError("departmentId", "The specified department does not exist."));
            }
        }

        if (request.ShiftPatternId is not null)
        {
            var shiftPatternExists = await dbContext.ShiftPatterns.AnyAsync(sp => sp.Id == request.ShiftPatternId);
            if (!shiftPatternExists)
            {
                employeeDataErrors.Add(new FieldError("shiftPatternId", "The specified shift pattern does not exist."));
            }
        }

        if (employeeDataErrors.Count > 0)
        {
            throw new InvalidEmployeeDataException(employeeDataErrors);
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
                IdentityErrorMapper.MapCode(e.Code),
                e.Description
            )).ToList();

            throw new InvalidEmployeeDataException(errors);
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