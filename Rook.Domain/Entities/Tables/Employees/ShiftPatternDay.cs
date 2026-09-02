namespace Rook.Domain.Entities.Tables.Employees;

// A shift's DayOfWeek reflects the day it STARTS, not necessarily every day
// it spans. Overnight shifts (EndTime < StartTime) run into the next
// calendar day — reporting/production logic must split hours across the
// actual calendar dates worked (e.g. a Mon 10pm-6am shift contributes
// 2 hours to Monday's totals and 6 hours to Tuesday's), not attribute
// the whole shift to the start day. This entity only stores the shift's
// definition; per-day splitting is a reporting-time concern.
public class ShiftPatternDay
{
    public int Id { get; set; }

    public int ShiftPatternId { get; set; }
    public ShiftPattern ShiftPattern { get; set; } = null!;

    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
}