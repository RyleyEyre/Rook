namespace Rook.Application.Services.ShiftPatterns.List;

public record ShiftPatternSummary(int Id, string Name, List<ShiftPatternDayResponse> Days);
public record ShiftPatternDayResponse(DayOfWeek DayOfWeek, TimeOnly StartTime, TimeOnly EndTime);