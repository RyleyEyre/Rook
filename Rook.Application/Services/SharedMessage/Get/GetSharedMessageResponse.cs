namespace Rook.Application.Services.SharedMessage.Get;

public record GetSharedMessageResponse(Guid Id, string Content, DateTime UpdatedAt);
