namespace Rook.Domain.Exceptions.Departments;

public sealed class DepartmentNotFoundException : Exception
{
    public DepartmentNotFoundException(string message)
        : base(message) {}
}