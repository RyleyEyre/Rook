using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Rook.Infrastructure.Data;
using Rook.Infrastructure.Identity;
using Rook.Infrastructure.Authentication;
using Rook.Domain.Entities;
using Rook.Domain.Exceptions.Auth;
using FluentValidation;

namespace Rook.Application.Services.Auth.Login;

public class LoginService(
    ApplicationDbContext dbContext,
    IConfiguration configuration,
    UserManager<ApplicationUser> userManager,
    IValidator<LoginCommand> validator
)
{
    public async Task<LoginResponse> Login(LoginCommand request)
    {

        await validator.ValidateAndThrowAsync(request);

        var user = await userManager.FindByNameAsync(request.Username);
        if (user is null)
        {
            throw new InvalidLoginException("Invalid username or password");
        }

        var isPasswordValid = await userManager.CheckPasswordAsync(user, request.Password);
        if (!isPasswordValid)
        {
            throw new InvalidLoginException("Invalid username or password");
        }

        var accessToken = await TokenGenerator.GenerateJwtToken(user, userManager, configuration);

        var refreshToken = TokenGenerator.GenerateRefreshToken(user);

        var userProfile = new UserProfile();
        userProfile.Theme = user.Theme;


    // DbContext.Add/Update/Remove only stage changes in memory — nothing hits
    // the database until SaveChangesAsync() is called to commit them.

    // TODO: no cleanup/limit on refresh tokens yet — a user logging in repeatedly
    // accumulates unbounded rows here, and expired/revoked tokens are never deleted.
    // Fine at current scale; revisit with a cleanup job or a per-user token cap later.
        dbContext.RefreshTokens.Add(refreshToken);
        await dbContext.SaveChangesAsync();

        return new LoginResponse(accessToken, refreshToken.Token, userProfile);
    }
}