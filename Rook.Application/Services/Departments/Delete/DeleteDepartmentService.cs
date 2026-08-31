using Microsoft.EntityFrameworkCore;
using Rook.Domain.Exceptions.Departments;
using Rook.Infrastructure.Data;

namespace Rook.Application.Services.Departments.Delete;

public class DeleteDepartmentService(
    ApplicationDbContext dbContext
)
{
    public async Task Delete(DeleteDepartmentCommand request)
    {
        var department = await dbContext.Departments.FindAsync(request.Id);

        if (department is null)
        {
            throw new DepartmentNotFoundException("No department exists with this id.");
        }
        
        var employeeCount = await dbContext.Employees.CountAsync(e => e.DepartmentId == request.Id);

        if (employeeCount > 0)
        {
            throw new DepartmentInUseException($"This department is in use by {employeeCount} employee(s).");
        }

        dbContext.Departments.Remove(department);
        await dbContext.SaveChangesAsync();
    }
}