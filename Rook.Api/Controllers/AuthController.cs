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

namespace Rook.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _dbContext;

    public AuthController(UserManager<ApplicationUser> userManager, IConfiguration configuration, ApplicationDbContext dbContext)
    {
        _userManager = userManager;
        _configuration = configuration;
        _dbContext = dbContext;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var existingUserByUsername = await _userManager.FindByNameAsync(request.Username);

        if (existingUserByUsername is not null)
        {
            return Conflict("A user with this username already exists.");
        }

        var existingUserByEmail = await _userManager.FindByEmailAsync(request.Email);

        if (existingUserByEmail is not null)
        {
            return Conflict("A user with this email already exists.");
        }

        var user = new ApplicationUser
        {
            UserName = request.Username,
            Email = request.Email
        };
        
        // Checked explicitly so we can return a clear 409 rather than a generic
        // CreateAsync failure buried in result.Errors.
        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }
        await _userManager.AddToRoleAsync(user, "User");

        return Ok("User registered successfully.");
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        // Identical message for both cases (deliberately) — prevents an attacker from
        // telling which emails are registered by comparing error responses (enumeration attack).
        var user = await _userManager.FindByNameAsync(request.Username);
        if (user is null)
        {
            return Unauthorized("Invalid username or password");
        }

        var isPasswordValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!isPasswordValid)
        {
            return Unauthorized("Invalid username or password");
        }

        var accessToken = await GenerateJwtToken(user);

        var refreshToken = new RefreshToken
        {
            Token = GenerateRefreshTokenString(),
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddHours(1)
        };

        var userProfile = new UserProfile(user.Theme);


    // DbContext.Add/Update/Remove only stage changes in memory — nothing hits
    // the database until SaveChangesAsync() is called to commit them.

    // TODO: no cleanup/limit on refresh tokens yet — a user logging in repeatedly
    // accumulates unbounded rows here, and expired/revoked tokens are never deleted.
    // Fine at current scale; revisit with a cleanup job or a per-user token cap later.
        _dbContext.RefreshTokens.Add(refreshToken);
        await _dbContext.SaveChangesAsync();

        return Ok(new AuthResponse(accessToken, refreshToken.Token, userProfile));

    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(LogoutRequest request)
    {
        var storedToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(refreshToken => refreshToken.Token == request.RefreshToken);
        
        if (storedToken is null || !storedToken.IsActive)
        {
            return Unauthorized("Invalid or expired refresh token");
        }

        storedToken.IsRevoked = true;

        await _dbContext.SaveChangesAsync();

        return Ok("Successfully logged out");
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(RefreshRequest request)
    {
        var storedToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(RefreshToken => RefreshToken.Token == request.RefreshToken);

        if (storedToken is null || !storedToken.IsActive)
        {
            return Unauthorized("Invalid or expired refresh token");
        }

        var user = await _userManager.FindByIdAsync(storedToken.UserId);
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

        _dbContext.RefreshTokens.Add(newRefreshToken);
        await _dbContext.SaveChangesAsync();

        return Ok(new AuthResponse(newAccessToken, newRefreshToken.Token, userProfile));
    }

    private async Task<string> GenerateJwtToken(ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email!),
            new("username", user.UserName!),
        };

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        // HMAC-SHA256 signing key derived from our secret — anyone without this
        // key cannot produce a valid signature, which is what ValidateIssuerSigningKey checks.
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // JWT tokens are stateless and after a logout they will still be valid for use until their expiration.
        // To counter this the expiry time is set to 1 hour but can be set much lower to decrease the window.
        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
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