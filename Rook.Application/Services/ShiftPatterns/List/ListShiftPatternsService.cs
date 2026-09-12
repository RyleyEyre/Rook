using Microsoft.EntityFrameworkCore;
using Rook.Infrastructure.Data;
using Rook.Application.Services.ShiftPatterns.Common;

namespace Rook.Application.Services.ShiftPatterns.List;

public class ListShiftPatternsService(
    ApplicationDbContext dbContext
)
{
    public async Task<List<ShiftPatternSummary>> List()
    {
        return await dbContext.ShiftPatterns
            .OrderBy(sp => sp.Name)
            .Select(sp => new ShiftPatternSummary(
                Id: sp.Id,
                Name: sp.Name,
                Days: sp.Days.Select(d => new ShiftPatternDayResponse(
                    d.DayOfWeek,
                    d.StartTime,
                    d.EndTime
                )).ToList(),
                EmployeeCount: sp.Employees.Count,
                CreatedAt: sp.CreatedAt
            ))
            .ToListAsync();
    }
}