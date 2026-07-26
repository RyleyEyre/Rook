using Rook.Domain.Entities;

namespace Rook.Application.Handlers.Auth.Login;


public record LoginResponse(string AccessToken, string RefreshToken, UserProfile UserProfile);