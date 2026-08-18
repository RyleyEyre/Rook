namespace Rook.Domain.Exceptions.Employees;

public sealed class EmployeeTerminatedException : Exception
{
    public EmployeeTerminatedException(string message)
        : base(message) {}
}