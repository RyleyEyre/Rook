namespace Rook.Application.Services.Employees.Delete;
public record DeleteEmployeeCommand(DateTime TerminationDate, string UserId);