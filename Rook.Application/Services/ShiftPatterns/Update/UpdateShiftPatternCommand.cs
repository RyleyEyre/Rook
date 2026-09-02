namespace Rook.Application.Services.ShiftPatterns.Update;

public record UpdateShiftPatternCommand(int Id, string Name, List<ShiftPatternDayInput> Days);
public record ShiftPatternDayInput(DayOfWeek DayOfWeek, TimeOnly StartTime, TimeOnly EndTime);