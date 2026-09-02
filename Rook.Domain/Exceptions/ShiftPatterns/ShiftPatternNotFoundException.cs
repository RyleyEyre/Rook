namespace Rook.Domain.Exceptions.ShiftPatterns;

public sealed class ShiftPatternNotFoundException : Exception
{
    public ShiftPatternNotFoundException(string message)
        : base(message) {}
}