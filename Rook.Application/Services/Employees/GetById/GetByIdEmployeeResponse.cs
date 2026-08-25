namespace Rook.Application.Services.Employees.GetById;

public record GetByIdEmployeeResponse(
    string UserId,
    string Username,
    string Email,
    string FirstName,
    string LastName,
    string? MiddleName,
    string Role,
    int? DepartmentId,
    string? DepartmentName,
    int? ShiftPatternId,
    string? ShiftPatternName,
    DateTime StartDate,
    string? ManagerId,
    string? FusionId,
    string? WCSId,
    string? VoiceConsoleId,
    DateTime? TerminationDate
);