using Microsoft.EntityFrameworkCore;
using Rook.Infrastructure.Data;

namespace Rook.Application.Services.Departments.List;

public class ListDepartmentsService(
    ApplicationDbContext dbContext
)
{
    public async Task<List<DepartmentSummary>> List()
    {
        var departments = await dbContext.Departments
            .Select(d => new DepartmentSummary(
                d.Id,
                d.Name,
                d.CreatedAt,
                d.LastEditedAt,
                d.Employees.Count
            ))
            .ToListAsync();

        return departments;
    }
}