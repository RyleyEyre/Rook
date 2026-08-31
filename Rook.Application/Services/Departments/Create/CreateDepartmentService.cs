using Microsoft.EntityFrameworkCore;
using Rook.Domain.Entities.Tables.Employees;
using Rook.Domain.Exceptions.Departments;
using Rook.Infrastructure.Data;

namespace Rook.Application.Services.Departments.Create;

public class CreateDepartmentService(
    ApplicationDbContext dbContext
)
{
    public async Task<CreateDepartmentResponse> Create(CreateDepartmentCommand request)
    {
        var existingDepartment = await dbContext.Departments.FirstOrDefaultAsync(d => d.Name == request.Name);

        if (existingDepartment is not null)
        {
            throw new DepartmentAlreadyExsistsException("A department with this name already exists.");
        }

        var department = new Department
        {
            Name = request.Name
        };

        dbContext.Departments.Add(department);
        await dbContext.SaveChangesAsync();

        return new CreateDepartmentResponse(department.Id, department.Name);
    }
}