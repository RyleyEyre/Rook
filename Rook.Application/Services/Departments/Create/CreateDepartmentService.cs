using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Rook.Domain.Entities.Tables.Departments;
using Rook.Domain.Exceptions.Common;
using Rook.Infrastructure.Data;
using Rook.Infrastructure.Hubs;

namespace Rook.Application.Services.Departments.Create;

public class CreateDepartmentService(
    ApplicationDbContext dbContext,
    IHubContext<LiveHub> hubContext
)
{
    public async Task<CreateDepartmentResponse> Create(CreateDepartmentCommand request, string? connectionId)
    {
        var existingDepartment = await dbContext.Departments.FirstOrDefaultAsync(d => d.NormalizedName == request.Name.ToUpperInvariant());

        if (existingDepartment is not null)
        {
            var field = nameof(request.Name);
            var error = new FieldError(field, ErrorCode.DUPLICATE_VALUE.ToString(), ErrorMessages.For(ErrorCode.DUPLICATE_VALUE, "name"));
            throw new ConflictException("A conflict occurred.",[error]);
        }
 
        var department = new Department
        {
            Name = request.Name,
            NormalizedName = request.Name.ToUpperInvariant()
        };

        dbContext.Departments.Add(department);
        await dbContext.SaveChangesAsync();

        var excludedConnections = connectionId is not null ? new[] { connectionId } : Array.Empty<string>();
        await hubContext.Clients.GroupExcept("DepartmentList", excludedConnections).SendAsync("DepartmentListChanged");
        
        return new CreateDepartmentResponse(department.Id, department.Name);
    }
}