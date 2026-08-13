using Microsoft.EntityFrameworkCore;
using Rook.Application.Services.Auth.Refresh;
using Rook.Domain.Exceptions.Auth;
using Rook.Infrastructure.Identity;
using Rook.Tests.Helpers;
using Moq;

namespace Rook.Tests.Services.Auth.Refresh;

public class RefreshServiceTests
{
    [Fact]
    public async Task Refresh_WhenTokenDoesNotExist_ThrowsExpiredRefreshTokenException()
    {
        // Arrange
        var dbContext = DbContextTestHelpers.CreateInMemoryDbContext();
        var configurationMock = JwtConfigurationTestHelpers.CreateJwtConfigurationMock();
        var userManagerMock = UserManagerTestHelpers.CreateUserManagerMock();

        var command = new RefreshCommand("nonexistent-token");
        var refreshService = new RefreshService(dbContext, configurationMock.Object, userManagerMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<ExpiredRefreshTokenException>(() => refreshService.Refresh(command));
    }

    [Fact]
    public async Task Refresh_WhenTokenIsRevoked_ThrowsExpiredRefreshTokenException()
    {
        // Arrange
        var dbContext = DbContextTestHelpers.CreateInMemoryDbContext();
        var configurationMock = JwtConfigurationTestHelpers.CreateJwtConfigurationMock();
        var userManagerMock = UserManagerTestHelpers.CreateUserManagerMock();

        // Seed a token that's already been revoked
        var revokedToken = new RefreshToken
        {
            Token = "revoked-token",
            UserId = "some-user-id",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsRevoked = true,
        };
        dbContext.RefreshTokens.Add(revokedToken);
        await dbContext.SaveChangesAsync();

        var command = new RefreshCommand("revoked-token");
        var refreshService = new RefreshService(dbContext, configurationMock.Object, userManagerMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<ExpiredRefreshTokenException>(() => refreshService.Refresh(command));
    }

    [Fact]
    public async Task Refresh_WhenUserNoLongerExists_ThrowsExpiredRefreshTokenException()
    {
        // Arrange
        var dbContext = DbContextTestHelpers.CreateInMemoryDbContext();
        var configurationMock = JwtConfigurationTestHelpers.CreateJwtConfigurationMock();
        var userManagerMock = UserManagerTestHelpers.CreateUserManagerMock();

        // Token is valid, but its owning user has vanished (e.g. deleted)
        var orphanedToken = new RefreshToken
        {
            Token = "orphaned-token",
            UserId = "deleted-user-id",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsRevoked = false,
        };
        dbContext.RefreshTokens.Add(orphanedToken);
        await dbContext.SaveChangesAsync();

        userManagerMock
            .Setup(u => u.FindByIdAsync("deleted-user-id"))
            .ReturnsAsync((ApplicationUser?)null);

        var command = new RefreshCommand("orphaned-token");
        var refreshService = new RefreshService(dbContext, configurationMock.Object, userManagerMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<ExpiredRefreshTokenException>(() => refreshService.Refresh(command));
    }

    [Fact]
    public async Task Refresh_WhenTokenAndUserAreValid_RotatesTokenAndReturnsRefreshResponse()
    {
        // Arrange
        var dbContext = DbContextTestHelpers.CreateInMemoryDbContext();
        var configurationMock = JwtConfigurationTestHelpers.CreateJwtConfigurationMock();
        var userManagerMock = UserManagerTestHelpers.CreateUserManagerMock();

        var existingToken = new RefreshToken
        {
            Token = "valid-token",
            UserId = "existing-user-id",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsRevoked = false,
        };
        dbContext.RefreshTokens.Add(existingToken);
        await dbContext.SaveChangesAsync();

        var existingUser = new ApplicationUser
        {
            Id = "existing-user-id",
            UserName = "TestUser",
            Email = "TestUser@example.com",
            Theme = "emerald",
        };

        userManagerMock
            .Setup(u => u.FindByIdAsync("existing-user-id"))
            .ReturnsAsync(existingUser);

        userManagerMock
            .Setup(u => u.GetRolesAsync(existingUser))
            .ReturnsAsync(new List<string> { "User" });

        var command = new RefreshCommand("valid-token");
        var refreshService = new RefreshService(dbContext, configurationMock.Object, userManagerMock.Object);

        // Act
        var result = await refreshService.Refresh(command);

        // Assert
        Assert.NotNull(result.AccessToken);
        Assert.NotNull(result.RefreshToken);
        Assert.Equal("emerald", result.UserProfile.Theme);

        // The old token should now be revoked...
        var oldToken = await dbContext.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == "valid-token");
        Assert.NotNull(oldToken);
        Assert.True(oldToken.IsRevoked);

        // ...and exactly one new, active token should exist for this user
        var newToken = await dbContext.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == result.RefreshToken);
        Assert.NotNull(newToken);
        Assert.False(newToken.IsRevoked);
        Assert.Equal("existing-user-id", newToken.UserId);
    }
}
