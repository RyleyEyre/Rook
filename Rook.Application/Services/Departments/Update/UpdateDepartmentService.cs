using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Rook.Domain.Exceptions.Common;
using Rook.Infrastructure.Data;
using Rook.Infrastructure.Hubs;

namespace Rook.Application.Services.Departments.Update;

public class UpdateDepartmentService(
    ApplicationDbContext dbContext,
    IHubContext<LiveHub> hubContext
)
{
    public async Task<UpdateDepartmentResponse> Update(UpdateDepartmentCommand request, string? connectionId)
    {
        var department = await dbContext.Departments.FindAsync(request.Id);

        if (department is null)
        {
            var field = nameof(request.Id);
            var error = new FieldError(field, ErrorCode.RECORD_NOT_FOUND.ToString(), ErrorMessages.For(ErrorCode.RECORD_NOT_FOUND, "id"));
            throw new NotFoundException("The requested record was not found.", [error]);
        }

        // Checks to see if the new department normalized name already belongs to an exsisting department, if so reject the request.
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

        var excludedConnections = connectionId is not null ? new[] { connectionId } : Array.Empty<string>();
        await hubContext.Clients.GroupExcept("DepartmentList", excludedConnections).SendAsync("DepartmentListChanged");

        return new UpdateDepartmentResponse(department.Id, department.Name);
    }


}