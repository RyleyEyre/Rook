using Microsoft.EntityFrameworkCore;
using Rook.Domain.Exceptions.Common;
using Rook.Infrastructure.Data;

namespace Rook.Application.Services.ShiftPatterns.Delete;

public class DeleteShiftPatternService(
    ApplicationDbContext dbContext
)
{
    public async Task Delete(DeleteShiftPatternCommand request)
    {
        var shiftPattern = await dbContext.ShiftPatterns.FindAsync(request.Id);

        if (shiftPattern is null)
        {
            var field = nameof(request.Id);
            var error = new FieldError(field, ErrorCode.RECORD_NOT_FOUND.ToString(), ErrorMessages.For(ErrorCode.RECORD_NOT_FOUND, "id"));
            throw new NotFoundException("The requested record was not found.", [error]);
        }
        
        var employeeCount = await dbContext.Employees.CountAsync(e => e.ShiftPatternId == request.Id);

        // Prevents the attempt of a delete if employees are part of the shift pattern before it reaches the DB, 
        // The db is also restricted so it would fail as well.
        if (employeeCount > 0)
        {
            var field = nameof(request.Id);
            var error = new FieldError(field, ErrorCode.RECORD_IN_USE.ToString(), $"This shift pattern is in use by {employeeCount} employee(s).");
            throw new ConflictException("This shift pattern cannot be deleted.", [error]);
        }

        dbContext.ShiftPatterns.Remove(shiftPattern);
        await dbContext.SaveChangesAsync();
    }
}