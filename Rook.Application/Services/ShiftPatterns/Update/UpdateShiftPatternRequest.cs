namespace Rook.Application.Services.ShiftPatterns.Update;

public record UpdateShiftPatternRequest(string Name, List<ShiftPatternDayInput> Days);