using Rook.Application.Services.Auth.Logout;
using Rook.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Rook.Infrastructure.Data;

namespace Rook.Tests.Services.Auth.Logout;

public class LogoutServiceTests
{
    [Fact]
    public async Task Logout_WhenRefreshTokenExsists()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var dbContext = new ApplicationDbContext(options);

        // Generate a fake refresh token and add it to the database
        var existingToken = new RefreshToken
        {
            Token = "some-refresh-token-value",
            UserId = "some-user-id",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsRevoked = false,
        };

        dbContext.RefreshTokens.Add(existingToken);
        await dbContext.SaveChangesAsync();

        var command = new LogoutCommand(existingToken.Token);
        var logoutService = new LogoutService(dbContext);

        // Act
        await logoutService.Logout(command);
        
        var storedToken = await dbContext.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == existingToken.Token);

        // Assert
        Assert.NotNull(storedToken);
        Assert.True(storedToken.IsRevoked);
    }

    [Fact]
    public async Task Logout_WhenRefreshTokenDoesNotExist_DoesNotThrow()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var dbContext = new ApplicationDbContext(options);

        var command = new LogoutCommand("nonexistent-token");
        var logoutService = new LogoutService(dbContext);

        // Act & Assert — the real assertion here is just "this doesn't throw"
        await logoutService.Logout(command);
    }
}