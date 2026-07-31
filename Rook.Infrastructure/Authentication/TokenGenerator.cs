using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Rook.Infrastructure.Identity;
using System.Security.Cryptography;

namespace Rook.Infrastructure.Authentication;

public static class TokenGenerator
{
    public static async Task<string> GenerateJwtToken(
        ApplicationUser user,
        UserManager<ApplicationUser> userManager,
        IConfiguration configuration)
    {
        var roles = await userManager.GetRolesAsync(user);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email!),
            new("username", user.UserName!),
        };

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        // HMAC-SHA256 signing key derived from our secret — anyone without this
        // key cannot produce a valid signature, which is what ValidateIssuerSigningKey checks.
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // JWT tokens are stateless and after a logout they will still be valid for use until their expiration.
        // To counter this the expiry time is set to 1 hour but can be set much lower to decrease the window.
        var token = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"],
            audience: configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddSeconds(10),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);

    }

    public static RefreshToken GenerateRefreshToken(
        ApplicationUser user)
    {
        return new RefreshToken
        {
            Token = GenerateRefreshTokenString(),
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddSeconds(30)
        };
    }

    private static string GenerateRefreshTokenString()
    {
        var randomBytes = new byte[64];

        // Uses .NETs cryptography random number generator which has enough entropy at 64 bytes to make 
        // brute force attacks unfeaseable.
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }
}