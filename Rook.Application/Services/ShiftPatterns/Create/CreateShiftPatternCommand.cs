namespace Rook.Application.Services.ShiftPatterns.Create;

public record CreateShiftPatternCommand(string Name, List<ShiftPatternDayInput> Days);
public record ShiftPatternDayInput(DayOfWeek DayOfWeek, TimeOnly StartTime, TimeOnly EndTime);