namespace Rook.Domain.Exceptions.Common;

public sealed class NotFoundException(string message, IReadOnlyCollection<FieldError>? errors = null) : Exception(message)
{
    public IReadOnlyCollection<FieldError>? Errors { get; } = errors;
}