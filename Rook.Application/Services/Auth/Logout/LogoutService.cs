using Rook.Infrastructure.Data;
using Rook.Domain.Exceptions.Auth;
using Microsoft.EntityFrameworkCore;

namespace Rook.Application.Services.Auth.Logout;

public class LogoutService(
    ApplicationDbContext dbContext
)
{
    // Nothing needs to be returned for a logout and it doesnt matter if it fails internally
    // as react will throw away the tokens effectively logging the user out regardless.
    public async Task Logout(LogoutCommand request)
    {
        var storedToken = await dbContext.RefreshTokens
            .FirstOrDefaultAsync(refreshToken => refreshToken.Token == request.RefreshToken);
        
        if (storedToken is not null && storedToken.IsActive)
        {
           storedToken.IsRevoked = true; 
           await dbContext.SaveChangesAsync();
        }
    } 
}