using Microsoft.EntityFrameworkCore;
using Rook.Domain.Exceptions.Departments;
using Rook.Infrastructure.Data;

namespace Rook.Application.Services.Departments.Update;


public class UpdateDepartmentService(
    ApplicationDbContext dbContext
)
{
    public async Task<UpdateDepartmentResponse> Update(UpdateDepartmentCommand request)
    {
        var department = await dbContext.Departments.FindAsync(request.Id);

        if (department is null)
        {
            throw new DepartmentNotFoundException("No department with this id exists.");
        }

        var conflictingDepartment = await dbContext.Departments
            .FirstOrDefaultAsync(d => d.NormalizedName == request.Name.ToUpperInvariant() && d.Id != request.Id);

        if (conflictingDepartment is not null)
        {
            throw new DepartmentAlreadyExsistsException("A department with this name already exists.");
        }

        if (department.Name == request.Name)
        {
            throw new DepartmentAlreadyExsistsException("A department with this name already exists.");
        }

        department.Name = request.Name;
        department.NormalizedName = request.Name.ToUpperInvariant();

        await dbContext.SaveChangesAsync();

        return new UpdateDepartmentResponse(department.Id, department.Name);
    }


}