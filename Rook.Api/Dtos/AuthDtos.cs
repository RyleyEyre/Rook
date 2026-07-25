using System.ComponentModel.DataAnnotations;
using Rook.Infrastructure.Identity;

namespace Rook.Api.Dtos;

public record RegisterRequest(string Username, string Email, string Password);

public record LoginRequest(string Username, string Password);

public record AuthResponse(string AccessToken, string RefreshToken, UserProfile UserProfile);

public record RefreshRequest(string RefreshToken);

public record LogoutRequest(string RefreshToken);

public record UserProfile(string Theme);
