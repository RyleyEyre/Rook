using Rook.Application.Services.ShiftPatterns.Common;

namespace Rook.Application.Services.ShiftPatterns.Create;

public record CreateShiftPatternResponse(int Id, string Name, List<ShiftPatternDayResponse> Days);