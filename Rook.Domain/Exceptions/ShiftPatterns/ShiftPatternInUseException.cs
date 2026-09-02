namespace Rook.Domain.Exceptions.ShiftPatterns;

public sealed class ShiftPatternInUseException : Exception
{
    public ShiftPatternInUseException(string message)
        : base(message) {}
}