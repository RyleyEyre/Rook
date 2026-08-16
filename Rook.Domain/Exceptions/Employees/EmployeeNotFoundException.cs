namespace Rook.Domain.Exceptions.Employees;

public sealed class EmployeeNotFoundException : Exception
{
    public EmployeeNotFoundException(string message)
        : base(message) {}
}