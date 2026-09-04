using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using FluentValidation;
using Rook.Infrastructure.Data;
using Rook.Infrastructure.Identity;
using Rook.Domain.Exceptions.Common;

namespace Rook.Application.Services.Employees.Update;

public class UpdateEmployeeService(
    UserManager<ApplicationUser> userManager,
    IValidator<UpdateEmployeeCommand> validator,
    ApplicationDbContext dbContext
)
{
    public async Task<UpdateEmployeeResponse> Update(UpdateEmployeeCommand request)
    {
        await validator.ValidateAndThrowAsync(request);

        var user = await userManager.FindByIdAsync(request.UserId);
        if (user is null)
        {
            var field = nameof(request.UserId);
            var error = new FieldError(field, ErrorCode.RECORD_NOT_FOUND.ToString(), ErrorMessages.For(ErrorCode.RECORD_NOT_FOUND, "user id"));
            throw new NotFoundException("The requested record was not found.", [error]);
        }

        var employee = await dbContext.Employees.FirstOrDefaultAsync(e => e.UserId == request.UserId);
        if (employee is null)
        {
            var field = nameof(request.UserId);
            var error = new FieldError(field, ErrorCode.RECORD_NOT_FOUND.ToString(), ErrorMessages.For(ErrorCode.RECORD_NOT_FOUND, "user id"));
            throw new NotFoundException("The requested record was not found.", [error]);
        }

        if (employee.TerminationDate is not null)
        {
            var field = nameof(employee.TerminationDate);
            var error = new FieldError(field, ErrorCode.INVALID_STATE.ToString(), ErrorMessages.For(ErrorCode.INVALID_STATE, "termination date"));
            throw new ConflictException("The employee is already terminated.", [error]);
        }

        var conflictErrors = new List<FieldError>();

        var existingUserByUsername = await userManager.FindByNameAsync(request.Username);
        if (existingUserByUsername is not null && existingUserByUsername.Id != request.UserId)
        {
            var field = nameof(request.Username);
            conflictErrors.Add(new FieldError(field, ErrorCode.DUPLICATE_VALUE.ToString(), ErrorMessages.For(ErrorCode.DUPLICATE_VALUE, "username")));
        }

        var existingUserByEmail = await userManager.FindByEmailAsync(request.Email);
        if (existingUserByEmail is not null && existingUserByEmail.Id != request.UserId)
        {
            var field = nameof(request.Email);
            conflictErrors.Add(new FieldError(field, ErrorCode.DUPLICATE_VALUE.ToString(), ErrorMessages.For(ErrorCode.DUPLICATE_VALUE, "email")));
        }

        if (conflictErrors.Count > 0)
        {
            throw new ConflictException("One or more conflicts occurred.", conflictErrors);
        }

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

        var currentRoles = await userManager.GetRolesAsync(user);

        if (!currentRoles.Contains(request.Role))
        {
            if (currentRoles.Count > 0)
            {
                await userManager.RemoveFromRolesAsync(user, currentRoles);
            }

            await userManager.AddToRoleAsync(user, request.Role);
        }

        await userManager.SetUserNameAsync(user, request.Username);
        await userManager.SetEmailAsync(user, request.Email);

        employee.FirstName = request.FirstName;
        employee.LastName = request.LastName;
        employee.MiddleName = request.MiddleName;
        employee.DepartmentId = request.DepartmentId;
        employee.ShiftPatternId = request.ShiftPatternId;
        employee.ManagerId = request.ManagerId;
        employee.FusionId = request.FusionId;
        employee.WCSId = request.WCSId;
        employee.VoiceConsoleId = request.VoiceConsoleId;
        employee.TerminationDate = request.TerminationDate;
        employee.StartDate = request.StartDate;

        await dbContext.SaveChangesAsync();

        return new UpdateEmployeeResponse(request.UserId, request.Username, request.Email);
    }
}