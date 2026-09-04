namespace Rook.Domain.Exceptions.Common;

public static class ErrorMessages
{
    public static string For(ErrorCode code, string field) => code switch
    {
        ErrorCode.DUPLICATE_VALUE => $"A record with this {field} already exists.",
        ErrorCode.RECORD_NOT_FOUND => $"No record exists with this {field}.",
        ErrorCode.RECORD_IN_USE => $"This {field} is currently in use and cannot be removed.",
        ErrorCode.INVALID_REFERENCE => $"The specified {field} does not exist.",
        ErrorCode.INVALID_STATE => $"This {field} is in a state that does not allow this action.",
        ErrorCode.UNAUTHORIZED => $"You are not authorized to perform this action on {field}.",
        ErrorCode.VALIDATION_FAILED => $"The {field} field is invalid.",
        _ => "An error occurred.",
    };
}