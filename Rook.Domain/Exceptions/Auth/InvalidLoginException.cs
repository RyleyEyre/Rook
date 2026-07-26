namespace Rook.Domain.Exceptions.Auth;

public sealed class InvalidLoginException : Exception
{
    public InvalidLoginException(string message)
        : base(message) {}
}