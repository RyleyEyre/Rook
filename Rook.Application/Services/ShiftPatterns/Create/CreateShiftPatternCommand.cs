using Rook.Application.Services.ShiftPatterns.Common;

namespace Rook.Application.Services.ShiftPatterns.Create;

public record CreateShiftPatternCommand(string Name, List<ShiftPatternDayInput> Days);