namespace Rook.Infrastructure.Authentication;

public static class IdentityErrorMapper
{
    private static readonly Dictionary<string, string> PropertyMap = new()
    {
        ["DuplicateUserName"] = "username",
        ["InvalidUserName"] = "username",
        ["DuplicateEmail"] = "email",
        ["InvalidEmail"] = "email",
        ["PasswordTooShort"] = "password",
        ["PasswordRequiresNonAlphanumeric"] = "password",
        ["PasswordRequiresDigit"] = "password",
        ["PasswordRequiresLower"] = "password",
        ["PasswordRequiresUpper"] = "password",
        ["PasswordRequiresUniqueChars"] = "password",
    };

    public static string? MapCode(string code) => PropertyMap.GetValueOrDefault(code);
}