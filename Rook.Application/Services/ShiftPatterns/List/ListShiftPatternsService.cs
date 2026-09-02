using Microsoft.EntityFrameworkCore;
using Rook.Infrastructure.Data;

namespace Rook.Application.Services.ShiftPatterns.List;

public class ListShiftPatternsService(
    ApplicationDbContext dbContext
)
{
    public async Task<List<ShiftPatternSummary>> List()
    {
        var shiftPatterns = await dbContext.ShiftPatterns
            .Include(sp => sp.Days)
            .ToListAsync();

        return shiftPatterns.Select(sp => new ShiftPatternSummary(
            Id: sp.Id,
            Name: sp.Name,
            Days: sp.Days.Select(d => new ShiftPatternDayResponse(
                DayOfWeek: d.DayOfWeek,
                StartTime: d.StartTime,
                EndTime: d.EndTime
            )).ToList()
        )).ToList();
    }
}