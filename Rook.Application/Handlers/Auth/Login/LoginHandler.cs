using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Rook.Infrastructure.Data;
using Rook.Infrastructure.Identity;
using Rook.Infrastructure.Authentication;
using Rook.Domain.Entities;

namespace Rook.Application.Handlers.Auth.Login;

public class LoginHandler(
    ApplicationDbContext dbContext,
    IConfiguration configuration,
    UserManager<ApplicationUser> userManager
) : IRequestHandler<LoginCommand, LoginResponse>
{
    public async Task<LoginResponse> Handle(
        LoginCommand request,
        CancellationToken cancellationToken
    )
    {
        var user = await userManager.FindByNameAsync(request.Username);
        if (user is null)
        {
            throw new Exception("Invalid username or password");
        }

        var isPasswordValid = await userManager.CheckPasswordAsync(user, request.Password);
        if (!isPasswordValid)
        {
            throw new Exception("Invalid username or password");
        }

        var accessToken = await JwtTokenGenerator.GenerateJwtToken(user, userManager, configuration);

        var refreshToken = new RefreshToken
        {
            Token =JwtTokenGenerator.GenerateRefreshTokenString(),
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddHours(1)
        };

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