using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Rook.Infrastructure.Data;
using Rook.Infrastructure.Identity;
using Rook.Infrastructure.Authentication;
using Rook.Domain.Entities;
using Rook.Domain.Exceptions.Auth;
using Rook.Domain.Exceptions.Common;
using FluentValidation;

namespace Rook.Application.Services.Auth.Register;

public class RegisterService(
    UserManager<ApplicationUser> userManager,
    IValidator<RegisterCommand> validator
)
{
    // Maps IdentityError.Code values to the request field they relate to,
    // so the frontend can highlight the right input. Codes not listed here
    // (e.g. PasswordRequiresDigit) fall back to a generic "password" grouping.
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

        await userManager.AddToRoleAsync(user, "User");

        return new RegisterResponse(user.Id, user.UserName!, user.Email!);
    }
}