namespace Rook.Domain.Exceptions.Auth;

using Rook.Domain.Exceptions.Common;

public sealed class RegistrationFailedException : Exception
{
    public IReadOnlyCollection<FieldError> Errors { get; }

    public RegistrationFailedException(IEnumerable<FieldError> errors)
        : base("Registration failed.")
    {
        Errors = errors.ToList();
    }
}