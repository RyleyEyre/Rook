namespace Rook.Infrastructure.Identity;

public class RefreshToken
{
    public int Id { get; set; }
    public string Token { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsRevoked { get; set; }

    // IsActive has no backing field - it's computed from IsRevoked/ExpiresAt each time
    // it's accessed by c# not the DB, so EF Core won't create a column for it.
    public bool IsActive => !IsRevoked && DateTime.UtcNow < ExpiresAt;
}