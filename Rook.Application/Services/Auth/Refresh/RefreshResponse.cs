using Rook.Domain.Entities;

namespace Rook.Application.Services.Auth.Refresh;

public record RefreshResponse(string AccessToken, string RefreshToken, UserProfile UserProfile); 