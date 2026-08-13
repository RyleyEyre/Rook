using Microsoft.AspNetCore.Identity;
using Rook.Infrastructure.Data;
using Rook.Infrastructure.Identity;
using Rook.Domain.Exceptions.Auth;
using Rook.Domain.Exceptions.Common;
using FluentValidation;
using Rook.Domain.Entities.Tables.Employee;
using Microsoft.EntityFrameworkCore;

namespace Rook.Application.Services.Auth.Register;

public class RegisterService(
    UserManager<ApplicationUser> userManager,
    IValidator<RegisterCommand> validator,
    ApplicationDbContext dbContext
)
{
    private static readonly Dictionary<string, string> IdentityErrorPropertyMap = new()
    {
        ["DuplicateUserName"] = "username",
        ["InvalidUserName"] = "username",
        ["DuplicateEmail"] = "email",
        ["InvalidEmail"] = "email",
        ["PasswordTooShort"] = "password",
        ["PasswordRequiresNonAlphanumeric"] = "password",
        ["PasswordRequiresDigit"] = "password",
        ["PasswordRequiresLower"] = "password",
        ["PasswordRequiresUpper"] = "password",
        ["PasswordRequiresUniqueChars"] = "password",
    };

    public async Task<RegisterResponse> Register(RegisterCommand request)
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
            throw new UserAlreadyExistsException(conflictErrors);
        }

        // Verify referenced lookup data actually exists before creating anything,
        // so a bad DepartmentId/ShiftPatternId fails cleanly instead of as a
        // raw foreign key constraint violation at save time.
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

        var user = new ApplicationUser
        {
            UserName = request.Username,
            Email = request.Email
        };

        var result = await userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => new FieldError(
                IdentityErrorPropertyMap.GetValueOrDefault(e.Code),
                e.Description
            ));

            throw new RegistrationFailedException(errors);
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

        return new RegisterResponse(user.Id, user.UserName!, user.Email!);
    }
}