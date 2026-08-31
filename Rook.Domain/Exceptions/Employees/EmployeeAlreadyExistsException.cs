namespace Rook.Domain.Exceptions.Employees;

using Rook.Domain.Exceptions.Common;

public sealed class EmployeeAlreadyExistsException : Exception
{
    public IReadOnlyCollection<FieldError> Errors { get; }

    public EmployeeAlreadyExistsException(IEnumerable<FieldError> errors)
        : base("A user with this username or email already exists.")
    {
        Errors = errors.ToList();
    }
}