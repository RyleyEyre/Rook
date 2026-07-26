namespace Rook.Domain.Exceptions.Common;
public sealed record FieldError(string? Property, string Error);