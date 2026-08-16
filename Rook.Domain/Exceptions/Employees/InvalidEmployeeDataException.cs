namespace Rook.Domain.Exceptions.Employees;

using Rook.Domain.Exceptions.Common;

public sealed class InvalidEmployeeDataException : Exception
{
    public IReadOnlyCollection<FieldError> Errors { get; }

    public InvalidEmployeeDataException(IEnumerable<FieldError> errors)
        : base("Registration failed.")
    {
        Errors = errors.ToList();
    }
}

