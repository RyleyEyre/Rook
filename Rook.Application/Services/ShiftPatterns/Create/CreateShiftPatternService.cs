using Rook.Application.Services.ShiftPatterns.Common;
using Microsoft.EntityFrameworkCore;
using Rook.Domain.Entities.Tables.ShiftPatterns;
using Rook.Domain.Exceptions.Common;
using Rook.Infrastructure.Data;

namespace Rook.Application.Services.ShiftPatterns.Create;

public class CreateShiftPatternService(
    ApplicationDbContext dbContext
)
{
    public async Task<CreateShiftPatternResponse> Create(CreateShiftPatternCommand request)
    {

        var duplicateDays = request.Days
            .GroupBy(d => d.DayOfWeek)
            .Any(g => g.Count() > 1);

        if (duplicateDays)
        {
            var field = nameof(request.Days);
            var error = new FieldError(field, ErrorCode.DUPLICATE_VALUE.ToString(), ErrorMessages.For(ErrorCode.DUPLICATE_VALUE, "day"));
            throw new ConflictException("A conflict occurred.", [error]);
        }

        var shiftPatternExists = await dbContext.ShiftPatterns
            .FirstOrDefaultAsync(sp => sp.NormalizedName == request.Name.ToUpperInvariant());

        if (shiftPatternExists is not null)
        {
            var field = nameof(request.Name);
            var error = new FieldError(field, ErrorCode.DUPLICATE_VALUE.ToString(), ErrorMessages.For(ErrorCode.DUPLICATE_VALUE, "name"));
            throw new ConflictException("A conflict occurred.", [error]);
        }

        var shiftPattern = new ShiftPattern
        {
            Name = request.Name,
            NormalizedName = request.Name.ToUpperInvariant(),
        };

        foreach (var day in request.Days)
        {
            shiftPattern.Days.Add(new ShiftPatternDay
            {
                DayOfWeek = day.DayOfWeek,
                StartTime = day.StartTime,
                EndTime = day.EndTime,
            });
        }

        dbContext.ShiftPatterns.Add(shiftPattern);
        await dbContext.SaveChangesAsync();

        return new CreateShiftPatternResponse(
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