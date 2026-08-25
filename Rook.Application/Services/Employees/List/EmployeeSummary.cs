namespace Rook.Application.Services.Employees.List;

public record EmployeeSummary(
    string UserId,
    string FirstName,
    string LastName,
    string? DepartmentName,
    string? ShiftPatternName,
    DateTime StartDate,
    DateTime? TerminationDate,
    bool IsProfileComplete
);