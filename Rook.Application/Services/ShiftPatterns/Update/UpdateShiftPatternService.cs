using Microsoft.EntityFrameworkCore;
using Rook.Domain.Entities.Tables.Employees;
using Rook.Domain.Exceptions.ShiftPatterns;
using Rook.Infrastructure.Data;
namespace Rook.Application.Services.ShiftPatterns.Update;

public class UpdateShiftPatternService(
    ApplicationDbContext dbContext
)
{
    public async Task<UpdateShiftPatternResponse> Update(UpdateShiftPatternCommand request)
    {
        var shiftPattern = await dbContext.ShiftPatterns
            .Include(sp => sp.Days)
            .FirstOrDefaultAsync(sp => sp.Id == request.Id);

        if (shiftPattern is null)
        {
            throw new ShiftPatternNotFoundException("No shift pattern with this id exists.");
        }

        var conflictingShiftPattern = await dbContext.ShiftPatterns
            .FirstOrDefaultAsync(csp => csp.NormalizedName == request.Name.ToUpperInvariant() && csp.Id != request.Id);

        if (conflictingShiftPattern is not null)
        {
            throw new ShiftPatternAlreadyExistsException("A shift pattern with this name already exists.");
        }

        var duplicateDays = request.Days
            .GroupBy(d => d.DayOfWeek)
            .Any(g => g.Count() > 1);

        if (duplicateDays)
        {
            throw new DuplicateShiftPatternDayException("Duplicate days are not allowed in a shift pattern.");
        }

        shiftPattern.Name = request.Name;
        shiftPattern.NormalizedName = request.Name.ToUpperInvariant();

        dbContext.ShiftPatternDays.RemoveRange(shiftPattern.Days);


        foreach (var day in request.Days)
        {
            shiftPattern.Days.Add(new ShiftPatternDay
            {
                DayOfWeek = day.DayOfWeek,
                StartTime = day.StartTime,
                EndTime = day.EndTime
            });
        }

        await dbContext.SaveChangesAsync();

        return new UpdateShiftPatternResponse(
            Id: shiftPattern.Id,
            Name: shiftPattern.Name,
            Days: shiftPattern.Days.Select(d => new ShiftPatternDayResponse(
                DayOfWeek: d.DayOfWeek,
                StartTime: d.StartTime,
                EndTime: d.EndTime
                )
            ).ToList());
    }


}