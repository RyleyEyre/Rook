namespace Rook.Application.Services.ShiftPatterns.Common;
public record ShiftPatternDayResponse(DayOfWeek DayOfWeek, TimeOnly StartTime, TimeOnly EndTime);