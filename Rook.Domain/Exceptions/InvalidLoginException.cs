namespace Rook.Domain.Exceptions;

public sealed class InvalidLoginException : Exception
{
    public InvalidLoginException(string message)
        : base(message) {}
}