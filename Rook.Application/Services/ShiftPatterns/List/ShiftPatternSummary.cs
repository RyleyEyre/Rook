using Rook.Application.Services.ShiftPatterns.Common;

namespace Rook.Application.Services.ShiftPatterns.List;

public record ShiftPatternSummary(int Id, string Name, List<ShiftPatternDayResponse> Days);