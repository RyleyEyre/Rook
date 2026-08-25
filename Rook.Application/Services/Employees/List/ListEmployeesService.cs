using Microsoft.EntityFrameworkCore;
using Rook.Infrastructure.Data;

namespace Rook.Application.Services.Employees.List;

public class ListEmployeesService(ApplicationDbContext dbContext)
{
    public async Task<List<EmployeeSummary>> List()
    {
        var employees = await dbContext.Employees
            .Include(e => e.Department)
            .Include(e => e.ShiftPattern)
            .ToListAsync();

        return employees.Select(e => new EmployeeSummary(
            UserId: e.UserId,
            FirstName: e.FirstName,
            LastName: e.LastName,
            DepartmentName: e.Department?.Name,
            ShiftPatternName: e.ShiftPattern?.Name,
            StartDate: e.StartDate,
            TerminationDate: e.TerminationDate,
            IsProfileComplete: e.IsProfileComplete
        )).ToList();
    }
}