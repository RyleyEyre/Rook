namespace Rook.Domain.Exceptions.SharedMessage;

public sealed class InvalidSharedMessageException : Exception
{
    public InvalidSharedMessageException(string message)
        : base(message) {}
}