namespace Rook.Application.Services.Departments.List;

public record DepartmentSummary(
    int Id,
    string Name,
    DateTime CreatedAt,
    DateTime? LastEditedAt,
    int EmployeeCount
);