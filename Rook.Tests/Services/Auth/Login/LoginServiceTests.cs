using Microsoft.EntityFrameworkCore;
using Moq;
using Rook.Application.Services.Auth.Login;
using Rook.Domain.Exceptions.Auth;
using Rook.Infrastructure.Identity;
using Rook.Tests.Helpers;

namespace Rook.Tests.Services.Auth.Login;

public class LoginServiceTests
{
    [Fact]
    public async Task Login_WhenUserDoesNotExist_ThrowsInvalidLoginException()
    {
        // Arrange
        var validatorMock = ValidatorTestHelpers.CreateValidValidatorMock<LoginCommand>();
        var userManagerMock = UserManagerTestHelpers.CreateUserManagerMock();

        userManagerMock
            .Setup(u => u.FindByNameAsync("nonexistent"))
            .ReturnsAsync((ApplicationUser?)null);

        var command = new LoginCommand("nonexistent", "somePassword");
        var loginService = new LoginService(null!, null!, userManagerMock.Object, validatorMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidLoginException>(() => loginService.Login(command));
    }

    [Fact]
    public async Task Login_WhenUserExistsWithWrongPassword_ThrowsInvalidLoginException()
    {
        // Arrange
        var validatorMock = ValidatorTestHelpers.CreateValidValidatorMock<LoginCommand>();
        var userManagerMock = UserManagerTestHelpers.CreateUserManagerMock();

        // This is the fake "user" that exists in our fake database, for this test only
        var existingUser = new ApplicationUser { UserName = "TestUser" };

        // Script: "when asked to find a user named TestUser, hand back existingUser"
        userManagerMock
            .Setup(u => u.FindByNameAsync("TestUser"))
            .ReturnsAsync(existingUser);

        // Script: "when asked if WrongPassword matches existingUser, say no"
        userManagerMock
            .Setup(u => u.CheckPasswordAsync(existingUser, "WrongPassword"))
            .ReturnsAsync(false);

        var command = new LoginCommand("TestUser", "WrongPassword");
        var loginService = new LoginService(null!, null!, userManagerMock.Object, validatorMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidLoginException>(() => loginService.Login(command));
    }

    [Fact]
    public async Task Login_WhenUserExistsWithCorrectPassword_ReturnsLoginResponse()
    {
        // Arrange
        var dbContext = DbContextTestHelpers.CreateInMemoryDbContext();
        var validatorMock = ValidatorTestHelpers.CreateValidValidatorMock<LoginCommand>();
        var userManagerMock = UserManagerTestHelpers.CreateUserManagerMock();
        var configurationMock = JwtConfigurationTestHelpers.CreateJwtConfigurationMock();

        // This is the fake "user" that exists in our fake database, for this test only
        var existingUser = new ApplicationUser { UserName = "TestUser", Email = "Test@example.com" };

        // Script: "when asked to find a user named TestUser, hand back existingUser"
        userManagerMock
            .Setup(u => u.FindByNameAsync("TestUser"))
            .ReturnsAsync(existingUser);

        // Script: "when asked if CorrectPassword matches existingUser, say yes"
        userManagerMock
            .Setup(u => u.CheckPasswordAsync(existingUser, "CorrectPassword"))
            .ReturnsAsync(true);

        // Script: "when asked for existingUser's roles, say they have the User role"
        userManagerMock
            .Setup(u => u.GetRolesAsync(existingUser))
            .ReturnsAsync(new List<string> { "User" });

        var command = new LoginCommand("TestUser", "CorrectPassword");
        var loginService = new LoginService(dbContext, configurationMock.Object, userManagerMock.Object, validatorMock.Object);

        // Act
        var result = await loginService.Login(command);
        var storedToken = await dbContext.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == result.RefreshToken);

        // Assert
        Assert.NotNull(result.AccessToken);
        Assert.NotNull(result.RefreshToken);
        Assert.Equal(1, dbContext.RefreshTokens.Count());
        Assert.NotNull(storedToken);
        Assert.Equal(existingUser.Id, storedToken.UserId);
        Assert.True(storedToken.ExpiresAt > DateTime.UtcNow);
    }
}
