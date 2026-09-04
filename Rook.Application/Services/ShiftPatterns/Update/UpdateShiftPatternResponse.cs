using Rook.Application.Services.ShiftPatterns.Common;

namespace Rook.Application.Services.ShiftPatterns.Update;

public record UpdateShiftPatternResponse(int Id, string Name, List<ShiftPatternDayResponse> Days);