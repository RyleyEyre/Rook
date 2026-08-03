namespace Rook.Application.Services.SharedMessage.Update;

public record UpdateSharedMessageResponse(Guid Id, string Content, DateTime UpdatedAt);
