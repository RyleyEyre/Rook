using FluentValidation;
using FluentValidation.Results;
using Moq;

namespace Rook.Tests.Helpers;

public static class ValidatorTestHelpers
{
    // Default "everything's fine" validator, for tests that aren't about validation
    public static Mock<IValidator<T>> CreateValidValidatorMock<T>()
    {
        var validatorMock = new Mock<IValidator<T>>();
        validatorMock
            .Setup(v => v.ValidateAsync(It.IsAny<T>(), default))
            .ReturnsAsync(new ValidationResult());

        return validatorMock;
    }
}
