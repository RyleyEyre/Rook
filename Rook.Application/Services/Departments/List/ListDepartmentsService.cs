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
            .OrderBy(d => d.Name)
            .Select(d => new DepartmentSummary(
                Id: d.Id,
                Name: d.Name,
                CreatedAt: d.CreatedAt,
                LastEditedAt: d.LastEditedAt,
                EmployeeCount: d.Employees.Count
            ))
            .ToListAsync();

        return departments;
    }
}