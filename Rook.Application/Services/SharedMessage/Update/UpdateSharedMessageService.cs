using Microsoft.EntityFrameworkCore;
using Rook.Application.Services.SharedMessage.Update;
using Rook.Domain.Entities.Tables.SharedMessage;
using Rook.Infrastructure.Data;
using Rook.Infrastructure.Hubs;
using Microsoft.AspNetCore.SignalR;
using Rook.Domain.Exceptions.Common;

public class UpdateSharedMessageService(
    ApplicationDbContext dbContext,
    IHubContext<LiveHub> hubContext
)
{
    public async Task<UpdateSharedMessageResponse> Update(UpdateSharedMessageCommand request, string userId)
    {
        var sharedMessage = await dbContext.SharedMessages.FirstOrDefaultAsync(sm => sm.Id == request.Id);

        if (sharedMessage is null)
        {
            var field = nameof(request.Id);
            var error = new FieldError(field, ErrorCode.RECORD_NOT_FOUND.ToString(), ErrorMessages.For(ErrorCode.RECORD_NOT_FOUND, "id"));
            throw new NotFoundException("The requested record was not found.", [error]);
        }

        sharedMessage.Content = request.Content;
        sharedMessage.UpdatedAt = DateTime.UtcNow;

        var sharedMessageEdit = new SharedMessageEdit
        {
            SharedMessageId = request.Id,
            EditedByUserId = userId,
            Content = request.Content,
            EditedAt = DateTime.UtcNow,
        };

        dbContext.SharedMessageEdits.Add(sharedMessageEdit);
        await dbContext.SaveChangesAsync();

        await hubContext.Clients.Group($"SharedMessage:{request.Id}")
            .SendAsync("MessageUpdated", sharedMessage.Content, sharedMessage.UpdatedAt);

        return new UpdateSharedMessageResponse(sharedMessage.Id, sharedMessage.Content, sharedMessage.UpdatedAt);
    }
}