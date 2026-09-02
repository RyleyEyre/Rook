namespace Rook.Domain.Exceptions.ShiftPatterns;

public sealed class ShiftPatternAlreadyExistsException : Exception
{
    public ShiftPatternAlreadyExistsException(string message)
        : base(message) {}
}