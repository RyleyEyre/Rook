namespace Rook.Domain.Exceptions.Common;

public sealed class ConflictException(string message, IReadOnlyCollection<FieldError>? errors = null) : Exception(message)
{
    public IReadOnlyCollection<FieldError>? Errors { get; } = errors;
}