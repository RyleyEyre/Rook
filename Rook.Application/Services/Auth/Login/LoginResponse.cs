using Rook.Domain.Entities;

namespace Rook.Application.Services.Auth.Login;


public record LoginResponse(string AccessToken, string RefreshToken, UserProfile UserProfile);