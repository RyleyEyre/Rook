using Microsoft.EntityFrameworkCore;
using Rook.Domain.Exceptions.ShiftPatterns;
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
            throw new ShiftPatternNotFoundException("No shift pattern exists with this id.");
        }
        
        var employeeCount = await dbContext.Employees.CountAsync(e => e.ShiftPatternId == request.Id);

        if (employeeCount > 0)
        {
            throw new ShiftPatternInUseException($"This shift pattern is in use by {employeeCount} employee(s).");
        }

        dbContext.ShiftPatterns.Remove(shiftPattern);
        await dbContext.SaveChangesAsync();
    }
}