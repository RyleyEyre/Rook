namespace Rook.Domain.Exceptions.Common;

// Using a generic error code model rather than n specific exception for every service type helps maintain
// consistency across exceptions, it also reduces size of the global exception handler. It also provides consistent 
// responses to the front end avoiding potential typos
public enum ErrorCode
{
    DUPLICATE_VALUE,
    RECORD_NOT_FOUND,
    RECORD_IN_USE,
    INVALID_REFERENCE,
    INVALID_STATE,
    UNAUTHORIZED,
    VALIDATION_FAILED,
}