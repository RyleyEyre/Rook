using Microsoft.EntityFrameworkCore;
using Rook.Domain.Exceptions.Common;
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
            var field = nameof(request.Id);
            var error = new FieldError(field, ErrorCode.RECORD_NOT_FOUND.ToString(), ErrorMessages.For(ErrorCode.RECORD_NOT_FOUND, "id"));
            throw new NotFoundException("The requested record was not found.", [error]);
        }

        var employeeCount = await dbContext.Employees.CountAsync(e => e.DepartmentId == request.Id);

        // Prevents the attempt of a delete if employees are part of the department before it reaches the DB, 
        // The db is also restricted so it would fail as well.
        if (employeeCount > 0)
        {
            var field = nameof(request.Id);
            var error = new FieldError(field, ErrorCode.RECORD_IN_USE.ToString(), $"This department is in use by {employeeCount} employee(s).");
            throw new ConflictException("This department cannot be deleted.", [error]);
        }

        dbContext.Departments.Remove(department);
        await dbContext.SaveChangesAsync();
    }
}