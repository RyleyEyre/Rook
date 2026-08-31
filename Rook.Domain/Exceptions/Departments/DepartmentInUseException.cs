namespace Rook.Domain.Exceptions.Departments;

public sealed class DepartmentInUseException : Exception
{
    public DepartmentInUseException(string message)
        : base(message) {}
}