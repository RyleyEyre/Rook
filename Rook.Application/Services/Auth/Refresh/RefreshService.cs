using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Rook.Infrastructure.Data;
using Rook.Infrastructure.Identity;
using Rook.Infrastructure.Authentication;
using Rook.Domain.Entities;
using Rook.Domain.Exceptions.Auth;
using FluentValidation;
using Microsoft.EntityFrameworkCore;


namespace Rook.Application.Services.Auth.Refresh;

public class RefreshService(
    ApplicationDbContext dbContext,
    IConfiguration configuration,
    UserManager<ApplicationUser> userManager
)
{
    public async Task<RefreshResponse> Refresh(RefreshCommand request)
    {
        var storedToken = await dbContext.RefreshTokens
            .FirstOrDefaultAsync(refreshToken => refreshToken.Token == request.RefreshToken);

        if (storedToken is null || !storedToken.IsActive)
        {
            throw new ExpiredRefreshTokenException("Invalid or expired refresh token");
        }

        var user = await userManager.FindByIdAsync(storedToken.UserId);
        if (user is null)
        {
            throw new ExpiredRefreshTokenException("Invalid or expired refresh token");
        }

        // Rotate: the old refresh token is single-use — revoke it now that
        // it's being exchanged for a new one, so it can't be replayed later.
        storedToken.IsRevoked = true;

        var newAccessToken = await TokenGenerator.GenerateJwtToken(user, userManager, configuration);
        
        var newRefreshToken = TokenGenerator.GenerateRefreshToken(user);

        var userProfile = new UserProfile();
        userProfile.Theme = user.Theme;

        dbContext.RefreshTokens.Add(newRefreshToken);
        await dbContext.SaveChangesAsync();

        return new RefreshResponse(newAccessToken, newRefreshToken.Token, userProfile);
    }

}