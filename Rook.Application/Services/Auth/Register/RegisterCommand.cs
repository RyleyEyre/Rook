public record RegisterCommand(
    string Username,
    string Password,
    string Email,
    string FirstName,
    string LastName,
    string? MiddleName,
    string Role,
    int DepartmentId,
    int ShiftPatternId,
    DateTime StartDate,
    string? ManagerId,
    string? FusionId,
    string? WCSId,
    string? VoiceConsoleId
);