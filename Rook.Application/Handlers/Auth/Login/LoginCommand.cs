using MediatR;

namespace Rook.Application.Handlers.Auth.Login;
public record LoginCommand(string Username, string Password) : IRequest<LoginResponse>;

