using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using FluentValidation;
using Rook.Infrastructure.Data;
using Rook.Infrastructure.Identity;
using Rook.Domain.Exceptions.Employees;
using Rook.Domain.Exceptions.Common;
using Rook.Domain.Entities.Tables.Employees;

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
            throw new EmployeeNotFoundException("No employee exists with this id.");
        }

        var employee = await dbContext.Employees.FirstOrDefaultAsync(e => e.UserId == request.UserId);
        if (employee is null)
        {
            throw new EmployeeNotFoundException("No employee exists with this id.");
        }

        if (employee.TerminationDate is not null)
        {
            throw new EmployeeTerminatedException("This employee is terminated");
        }

        var conflictErrors = new List<FieldError>();

        var existingUserByUsername = await userManager.FindByNameAsync(request.Username);
        if (existingUserByUsername is not null && existingUserByUsername.Id != request.UserId)
        {
            conflictErrors.Add(new FieldError("username", "A user with this username already exists."));
        }

        var existingUserByEmail = await userManager.FindByEmailAsync(request.Email);
        if (existingUserByEmail is not null && existingUserByEmail.Id != request.UserId)
        {
            conflictErrors.Add(new FieldError("email", "A user with this email already exists."));
        }

        if (conflictErrors.Count > 0)
        {
            throw new EmployeeAlreadyExsistsException(conflictErrors);
        }

        var employeeDataErrors = new List<FieldError>();

        var departmentExists = await dbContext.Departments.AnyAsync(d => d.Id == request.DepartmentId);
        if (!departmentExists)
        {
            employeeDataErrors.Add(new FieldError("departmentId", "The specified department does not exist."));
        }

        var shiftPatternExists = await dbContext.ShiftPatterns.AnyAsync(sp => sp.Id == request.ShiftPatternId);
        if (!shiftPatternExists)
        {
            employeeDataErrors.Add(new FieldError("shiftPatternId", "The specified shift pattern does not exist."));
        }

        if (employeeDataErrors.Count > 0)
        {
            throw new InvalidEmployeeDataException(employeeDataErrors);
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