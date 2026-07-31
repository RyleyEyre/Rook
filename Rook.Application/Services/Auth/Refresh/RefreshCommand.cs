using Rook.Infrastructure.Identity;

namespace Rook.Application.Services.Auth.Refresh;

public record RefreshCommand(string RefreshToken);