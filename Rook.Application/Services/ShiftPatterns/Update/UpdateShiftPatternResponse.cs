namespace Rook.Application.Services.ShiftPatterns.Update;

public record UpdateShiftPatternResponse(int Id, string Name, List<ShiftPatternDayResponse> Days);
public record ShiftPatternDayResponse(DayOfWeek DayOfWeek, TimeOnly StartTime, TimeOnly EndTime);