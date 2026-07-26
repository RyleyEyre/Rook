using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Rook.Api.Dtos;
using Rook.Infrastructure.Data;
using Rook.Infrastructure.Identity;
using Rook.Application.Services.Auth.Login;
using Rook.Application.Services.Auth.Register;
using Rook.Application.Services.Auth.Logout;

namespace Rook.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(
    LoginService loginService,
    LogoutService logoutService,
    RegisterService registerService,
    
    UserManager<ApplicationUser> userManager,
    IConfiguration configuration, 
    ApplicationDbContext dbContext
    ) : ControllerBase
{

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterCommand command)
    {
        var result = await registerService.Register(command);
        return Ok(
            new
            {
                success = true,
                message = "Registration Successful",
                data = result,
            }
        );
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginCommand command)
    {
        var result = await loginService.Login(command);
        return Ok(
            new
            {
                success = true,
                message = "Login Successful",
                data = result,
            }
        );

    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(LogoutCommand command)
    {
        await logoutService.Logout(command);
        return NoContent(); // 204
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(RefreshRequest request)
    {
        var storedToken = await dbContext.RefreshTokens
            .FirstOrDefaultAsync(RefreshToken => RefreshToken.Token == request.RefreshToken);

        if (storedToken is null || !storedToken.IsActive)
        {
            return Unauthorized("Invalid or expired refresh token");
        }

        var user = await userManager.FindByIdAsync(storedToken.UserId);
        if (user is null)
        {
            return Unauthorized("Invalid or expired refresh token");
        }

        // Rotate: the old refresh token is single-use — revoke it now that
        // it's being exchanged for a new one, so it can't be replayed later.
        storedToken.IsRevoked = true;

        var newAccessToken = await GenerateJwtToken(user);
        var newRefreshToken = new RefreshToken
        {
            Token = GenerateRefreshTokenString(),
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddSeconds(30)
        };

        var userProfile = new UserProfile(user.Theme);

        dbContext.RefreshTokens.Add(newRefreshToken);
        await dbContext.SaveChangesAsync();

        return Ok(new AuthResponse(newAccessToken, newRefreshToken.Token, userProfile));
    }

    private async Task<string> GenerateJwtToken(ApplicationUser user)
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
            expires: DateTime.UtcNow.AddMinutes(10),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);

    }

    private string GenerateRefreshTokenString()
    {
        var randomBytes = new byte[64];

        // Uses .NETs cryptography random number generator which has enough entropy at 64 bytes to make 
        // brute force attacks unfeaseable.
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }
}