using Microsoft.EntityFrameworkCore;
using Rook.Domain.Entities.Tables.ShiftPatterns;
using Rook.Domain.Exceptions.Common;
using Rook.Infrastructure.Data;
using Rook.Application.Services.ShiftPatterns.Common;

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
            var field = nameof(request.Id);
            var error = new FieldError(field, ErrorCode.RECORD_NOT_FOUND.ToString(), ErrorMessages.For(ErrorCode.RECORD_NOT_FOUND, "id"));
            throw new NotFoundException("The requested record was not found.", [error]);
        }

        var conflictingShiftPattern = await dbContext.ShiftPatterns
            .FirstOrDefaultAsync(csp => csp.NormalizedName == request.Name.ToUpperInvariant() && csp.Id != request.Id);

        if (conflictingShiftPattern is not null)
        {
            var field = nameof(request.Name);
            var error = new FieldError(field, ErrorCode.DUPLICATE_VALUE.ToString(), ErrorMessages.For(ErrorCode.DUPLICATE_VALUE, "name"));
            throw new ConflictException("A conflict occurred.", [error]);
        }

        var duplicateDays = request.Days
            .GroupBy(d => d.DayOfWeek)
            .Any(g => g.Count() > 1);

        if (duplicateDays)
        {
            var field = nameof(request.Days);
            var error = new FieldError(field, ErrorCode.DUPLICATE_VALUE.ToString(), ErrorMessages.For(ErrorCode.DUPLICATE_VALUE, "day"));
            throw new ConflictException("A conflict occurred.", [error]);
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