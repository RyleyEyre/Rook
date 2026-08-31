namespace Rook.Domain.Exceptions.Departments;

public sealed class DepartmentAlreadyExsistsException : Exception
{
    public DepartmentAlreadyExsistsException(string message)
        : base(message) {}
}