using Microsoft.EntityFrameworkCore;
using Rook.Domain.Exceptions.Common;
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
            var field = nameof(request.Id);
            var error = new FieldError(field, ErrorCode.RECORD_NOT_FOUND.ToString(), ErrorMessages.For(ErrorCode.RECORD_NOT_FOUND, "id"));
            throw new NotFoundException("The requested record was not found.", [error]);
        }

        var conflictingDepartment = await dbContext.Departments
            .FirstOrDefaultAsync(d => d.NormalizedName == request.Name.ToUpperInvariant() && d.Id != request.Id);

        if (conflictingDepartment is not null)
        {
            var field = nameof(request.Name);
            var error = new FieldError(field, ErrorCode.DUPLICATE_VALUE.ToString(), ErrorMessages.For(ErrorCode.DUPLICATE_VALUE,"name"));
            throw new ConflictException("A conflict occurred.", [error]);
        }

        department.Name = request.Name;
        department.NormalizedName = request.Name.ToUpperInvariant();

        await dbContext.SaveChangesAsync();

        return new UpdateDepartmentResponse(department.Id, department.Name);
    }


}