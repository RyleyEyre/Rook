namespace Rook.Application.Services.SharedMessage.Update;

public record UpdateSharedMessageCommand(Guid Id, string Content);