using Moq;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using Rook.Application.Services.Auth.Refresh;
using Rook.Domain.Exceptions.Auth;
using Rook.Infrastructure.Data;
using Rook.Infrastructure.Identity;

namespace Rook.Tests.Services.Auth.Refresh;

public class RefreshServiceTests
{
    [Fact]
    public async Task Refresh_WhenTokenDoesNotExist_ThrowsExpiredRefreshTokenException()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var dbContext = new ApplicationDbContext(options);

        var configurationMock = new Mock<IConfiguration>();
        var userManagerMock = new Mock<UserManager<ApplicationUser>>(
            Mock.Of<IUserStore<ApplicationUser>>(), null!, null!, null!, null!, null!, null!, null!, null!);

        var command = new RefreshCommand("nonexistent-token");
        var refreshService = new RefreshService(dbContext, configurationMock.Object, userManagerMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<ExpiredRefreshTokenException>(() => refreshService.Refresh(command));
    }

    [Fact]
    public async Task Refresh_WhenTokenIsRevoked_ThrowsExpiredRefreshTokenException()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var dbContext = new ApplicationDbContext(options);

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

        var configurationMock = new Mock<IConfiguration>();
        var userManagerMock = new Mock<UserManager<ApplicationUser>>(
            Mock.Of<IUserStore<ApplicationUser>>(), null!, null!, null!, null!, null!, null!, null!, null!);

        var command = new RefreshCommand("revoked-token");
        var refreshService = new RefreshService(dbContext, configurationMock.Object, userManagerMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<ExpiredRefreshTokenException>(() => refreshService.Refresh(command));
    }

    [Fact]
    public async Task Refresh_WhenUserNoLongerExists_ThrowsExpiredRefreshTokenException()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var dbContext = new ApplicationDbContext(options);

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

        var configurationMock = new Mock<IConfiguration>();
        var userManagerMock = new Mock<UserManager<ApplicationUser>>(
            Mock.Of<IUserStore<ApplicationUser>>(), null!, null!, null!, null!, null!, null!, null!, null!);

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
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var dbContext = new ApplicationDbContext(options);

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

        var configurationMock = new Mock<IConfiguration>();
        configurationMock.Setup(c => c["Jwt:Key"]).Returns("this-is-a-test-key-at-least-32-characters-long");
        configurationMock.Setup(c => c["Jwt:Issuer"]).Returns("TestIssuer");
        configurationMock.Setup(c => c["Jwt:Audience"]).Returns("TestAudience");

        var userManagerMock = new Mock<UserManager<ApplicationUser>>(
            Mock.Of<IUserStore<ApplicationUser>>(), null!, null!, null!, null!, null!, null!, null!, null!);

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