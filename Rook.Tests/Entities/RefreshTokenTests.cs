using Rook.Infrastructure.Identity;

namespace Rook.Tests;

public class RefreshTokenTests
{
    [Fact]
    public void IsActive_WhenNotRevokedAndNotExpired_ReturnsTrue()
    {
        // Arrange
        var refreshToken = new RefreshToken
        {
            IsRevoked = false,
            ExpiresAt = DateTime.UtcNow.AddDays(1),
        };

        // Act
        var result = refreshToken.IsActive;

        // Assert
        Assert.True(result);
    }

        [Fact]
    public void IsActive_WhenRevokedAndNotExpired_ReturnsFalse()
    {
        // Arrange
        var refreshToken = new RefreshToken
        {
            IsRevoked = true,
            ExpiresAt = DateTime.UtcNow.AddDays(1),
        };

        // Act
        var result = refreshToken.IsActive;

        // Assert
        Assert.False(result);
    }

        [Fact]
    public void IsActive_WhenNotRevokedAndExpired_ReturnsFalse()
    {
        // Arrange
        var refreshToken = new RefreshToken
        {
            IsRevoked = false,
            ExpiresAt = DateTime.UtcNow.AddDays(-1),
        };

        // Act
        var result = refreshToken.IsActive;

        // Assert
        Assert.False(result);
    }
    [Fact]
    public void IsActive_WhenRevokedAndExpired_ReturnsFalse()
    {
        // Arrange
        var refreshToken = new RefreshToken
        {
            IsRevoked = true,
            ExpiresAt = DateTime.UtcNow.AddDays(-1),
        };

        // Act
        var result = refreshToken.IsActive;

        // Assert
        Assert.False(result);
    }
}