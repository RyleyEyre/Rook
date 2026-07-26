namespace Rook.Domain.Exceptions.Auth;

public sealed class ExpiredRefreshTokenException : Exception
{
    public ExpiredRefreshTokenException(string message)
        : base(message) {}
}