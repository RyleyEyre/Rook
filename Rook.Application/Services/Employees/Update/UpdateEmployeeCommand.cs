namespace Rook.Application.Services.Employees.Update;

public record UpdateEmployeeCommand(
    string UserId,
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