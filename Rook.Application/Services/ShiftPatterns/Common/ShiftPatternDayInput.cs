namespace Rook.Application.Services.ShiftPatterns.Common;

public record ShiftPatternDayInput(DayOfWeek DayOfWeek, TimeOnly StartTime, TimeOnly EndTime);