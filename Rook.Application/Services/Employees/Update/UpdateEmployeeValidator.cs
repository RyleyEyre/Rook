using FluentValidation;

namespace Rook.Application.Services.Employees.Update;

public class UpdateEmployeeValidator : AbstractValidator<UpdateEmployeeCommand>
{
    public UpdateEmployeeValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty()
            .WithMessage("Username is required")
            .MinimumLength(3)
            .WithMessage("Minimum length of 3 is required")
            .MaximumLength(40)
            .WithMessage("Maximum length of 40 is exceeded");

        RuleFor(x => x.Email)
            .NotEmpty()
            .WithMessage("Email is required")
            .EmailAddress()
            .WithMessage("Invalid email address") 
            .MinimumLength(3)
            .WithMessage("Minimum length of 3 is required")
            .MaximumLength(128)
            .WithMessage("Maximum length of 128 is exceeded");
        RuleFor(x => x.Role)
            .Must(r => r == "User" || r == "Admin");   
    }
}