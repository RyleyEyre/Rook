using Rook.Infrastructure.Data;
using Rook.Domain.Exceptions.Auth;
using Microsoft.EntityFrameworkCore;

namespace Rook.Application.Services.Auth.Logout;

public class LogoutService(
    ApplicationDbContext dbContext
)
{
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