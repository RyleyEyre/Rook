using Rook.Domain.Entities;

namespace Rook.Application.Services.Auth.Register;

public record RegisterResponse(string Id, string Username, string Email);