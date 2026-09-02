using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rook.Domain.Entities.Tables.Employees;
using Rook.Domain.Exceptions.ShiftPatterns;
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
            throw new DuplicateShiftPatternDayException("Duplicate days are not allowed in a shift pattern.");
        }

        var shiftPatternExists = await dbContext.ShiftPatterns
            .FirstOrDefaultAsync(sp => sp.NormalizedName == request.Name.ToUpperInvariant());

        if (shiftPatternExists is not null)
        {
            throw new ShiftPatternAlreadyExistsException("A shift pattern with this name already exists");
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