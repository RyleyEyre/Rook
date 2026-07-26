namespace Rook.Domain.Exceptions.Auth;

using Rook.Domain.Exceptions.Common;

public sealed class UserAlreadyExistsException : Exception
{
    public IReadOnlyCollection<FieldError> Errors { get; }

    public UserAlreadyExistsException(IEnumerable<FieldError> errors)
        : base("A user with this username or email already exists.")
    {
        Errors = errors.ToList();
    }
}