namespace Rook.Application.Services.Employees.Update;

public record UpdateEmployeeRequest(
    string Username,
    string Email,
    string FirstName,
    string LastName,
    string? MiddleName,
    string Role,
    int? DepartmentId,
    int? ShiftPatternId,
    DateTime StartDate,
    string? ManagerId,
    string? FusionId,
    string? WCSId,
    string? VoiceConsoleId,
    DateTime? TerminationDate
);