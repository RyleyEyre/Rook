namespace Rook.Domain.Exceptions.ShiftPatterns;

public sealed class DuplicateShiftPatternDayException : Exception
{
    public DuplicateShiftPatternDayException(string message)
        : base(message) {}
}