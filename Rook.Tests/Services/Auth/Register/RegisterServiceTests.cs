using Moq;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Identity;
using Rook.Application.Services.Auth.Register;
using Rook.Domain.Exceptions.Auth;
using Rook.Infrastructure.Identity;

namespace Rook.Tests.Services.Auth.Register;

public class RegisterServiceTests
{
[Fact]
public async Task Register_WhenUsernameAlreadyExists_ThrowsWithUsernameFieldError()
    {
        // Arrange
        var validatorMock = new Mock<IValidator<RegisterCommand>>();
        validatorMock
            .Setup(v => v.ValidateAsync(It.IsAny<RegisterCommand>(), default))
            .ReturnsAsync(new ValidationResult());

        var userManagerMock = new Mock<UserManager<ApplicationUser>>(
            Mock.Of<IUserStore<ApplicationUser>>(), null!, null!, null!, null!, null!, null!, null!, null!);

        var existingUser = new ApplicationUser { UserName = "TestUser", Email = "TestUser@example.com" };

        // Username is taken...
        userManagerMock
            .Setup(u => u.FindByNameAsync("TestUser"))
            .ReturnsAsync(existingUser);

        // ...but the email is free
        userManagerMock
            .Setup(u => u.FindByEmailAsync("new@example.com"))
            .ReturnsAsync((ApplicationUser?)null);

        var command = new RegisterCommand("TestUser", "somePassword", "new@example.com");
        var registerService = new RegisterService(userManagerMock.Object, validatorMock.Object);

        // Act
        var exception = await Assert.ThrowsAsync<UserAlreadyExistsException>(() => registerService.Register(command));

        // Assert
        Assert.Single(exception.Errors);
        Assert.Equal("username", exception.Errors.First().Property);
    }

[Fact]
public async Task Register_WhenEmailAlreadyExists_ThrowsWithEmailFieldError()
    {
        // Arrange
        var validatorMock = new Mock<IValidator<RegisterCommand>>();
        validatorMock
            .Setup(v => v.ValidateAsync(It.IsAny<RegisterCommand>(), default))
            .ReturnsAsync(new ValidationResult());

        var userManagerMock = new Mock<UserManager<ApplicationUser>>(
            Mock.Of<IUserStore<ApplicationUser>>(), null!, null!, null!, null!, null!, null!, null!, null!);

        var existingUser = new ApplicationUser { UserName = "TestUser", Email = "TestUser@example.com" };

        // username is free
        userManagerMock
            .Setup(u => u.FindByNameAsync("NewUsername"))
            .ReturnsAsync((ApplicationUser?)null);

        // email is taken
        userManagerMock
            .Setup(u => u.FindByEmailAsync("TestUser@example.com"))
            .ReturnsAsync(existingUser);

        var command = new RegisterCommand("NewUsername", "somePassword", "TestUser@example.com");
        var registerService = new RegisterService(userManagerMock.Object, validatorMock.Object);

        // Act
        var exception = await Assert.ThrowsAsync<UserAlreadyExistsException>(() => registerService.Register(command));

        // Assert
        Assert.Single(exception.Errors);
        Assert.Equal("email", exception.Errors.First().Property);
    }

[Fact]
public async Task Register_WhenPasswordTooShort_ThrowsWithPasswordFieldError()
    {
        // Arrange
        var validatorMock = new Mock<IValidator<RegisterCommand>>();
        validatorMock
            .Setup(v => v.ValidateAsync(It.IsAny<RegisterCommand>(), default))
            .ReturnsAsync(new ValidationResult());

        var userManagerMock = new Mock<UserManager<ApplicationUser>>(
            Mock.Of<IUserStore<ApplicationUser>>(), null!, null!, null!, null!, null!, null!, null!, null!);

        var identityErrors = new[] { new IdentityError { Code = "PasswordTooShort", Description = "Password is too short." } };

        // password too weak
        userManagerMock
            .Setup(u => u.CreateAsync(It.IsAny<ApplicationUser>(), "weak"))
            .ReturnsAsync(IdentityResult.Failed(identityErrors));

        // username is free
        userManagerMock
            .Setup(u => u.FindByNameAsync("NewUsername"))
            .ReturnsAsync((ApplicationUser?)null);

        // email is free
        userManagerMock
            .Setup(u => u.FindByEmailAsync("NewUsername@example.com"))
            .ReturnsAsync((ApplicationUser?)null);

        var command = new RegisterCommand("NewUsername", "weak", "NewUsername@example.com");
        var registerService = new RegisterService(userManagerMock.Object, validatorMock.Object);

        // Act
        var exception = await Assert.ThrowsAsync<RegistrationFailedException>(() => registerService.Register(command));

        // Assert
        Assert.Single(exception.Errors);
        Assert.Equal("password", exception.Errors.First().Property);
    }

[Fact]
public async Task Register_WithUnmappedIdentityErrorCode_FallsBackToNullFieldError()
    {
        // Arrange
        var validatorMock = new Mock<IValidator<RegisterCommand>>();
        validatorMock
            .Setup(v => v.ValidateAsync(It.IsAny<RegisterCommand>(), default))
            .ReturnsAsync(new ValidationResult());

        var userManagerMock = new Mock<UserManager<ApplicationUser>>(
            Mock.Of<IUserStore<ApplicationUser>>(), null!, null!, null!, null!, null!, null!, null!, null!);

        var identityErrors = new[] { new IdentityError { Code = "SomeUnknownErrorCode", Description = "Something went wrong." } };

        // weak password with unknown error
        userManagerMock
            .Setup(u => u.CreateAsync(It.IsAny<ApplicationUser>(), "weak"))
            .ReturnsAsync(IdentityResult.Failed(identityErrors));

        // username is free
        userManagerMock
            .Setup(u => u.FindByNameAsync("NewUsername"))
            .ReturnsAsync((ApplicationUser?)null);

        // email is free
        userManagerMock
            .Setup(u => u.FindByEmailAsync("NewUsername@example.com"))
            .ReturnsAsync((ApplicationUser?)null);

        var command = new RegisterCommand("NewUsername", "weak", "NewUsername@example.com");
        var registerService = new RegisterService(userManagerMock.Object, validatorMock.Object);

        // Act
        var exception = await Assert.ThrowsAsync<RegistrationFailedException>(() => registerService.Register(command));

        // Assert
        Assert.Single(exception.Errors);
        Assert.Null(exception.Errors.First().Property);
    }

[Fact]
public async Task Register_WhenUsernameAndEmailAreFree_ReturnsRegisterResponse()
    {
        // Arrange
        var validatorMock = new Mock<IValidator<RegisterCommand>>();
        validatorMock
            .Setup(v => v.ValidateAsync(It.IsAny<RegisterCommand>(), default))
            .ReturnsAsync(new ValidationResult());

        var userManagerMock = new Mock<UserManager<ApplicationUser>>(
            Mock.Of<IUserStore<ApplicationUser>>(), null!, null!, null!, null!, null!, null!, null!, null!);

        // username is free
        userManagerMock
            .Setup(u => u.FindByNameAsync("NewUsername"))
            .ReturnsAsync((ApplicationUser?)null);

        // email is free
        userManagerMock
            .Setup(u => u.FindByEmailAsync("NewUsername@example.com"))
            .ReturnsAsync((ApplicationUser?)null);

        // password is good
        userManagerMock
            .Setup(u => u.CreateAsync(It.IsAny<ApplicationUser>(), "StrongPassword"))
            .ReturnsAsync(IdentityResult.Success);
        // role was added
        userManagerMock
            .Setup(u => u.AddToRoleAsync(It.IsAny<ApplicationUser>(), "User"))
            .ReturnsAsync(IdentityResult.Success);

        var command = new RegisterCommand("NewUsername", "StrongPassword", "NewUsername@example.com");
        var registerService = new RegisterService(userManagerMock.Object, validatorMock.Object);

        // Act
        var result = await registerService.Register(command);

        // Assert
        Assert.Equal(command.Username, result.Username);
        Assert.Equal(command.Email, result.Email);

        // how many times did AddToRoleAsync trigger
        userManagerMock.Verify(
            u => u.AddToRoleAsync(It.IsAny<ApplicationUser>(), "User"),
            Times.Once);
    }
}