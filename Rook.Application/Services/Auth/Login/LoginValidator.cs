using FluentValidation;

namespace Rook.Application.Services.Auth.Login;

public class LoginValidator : AbstractValidator<LoginCommand>
{
    public LoginValidator()
    {
        RuleFor(x => x.Username)
            .MinimumLength(1)
            .NotEmpty()
            .WithMessage("Username is required");
        
        RuleFor(x => x.Password)
            .NotEmpty()
            .WithMessage("Password is required") ;       
    }
}