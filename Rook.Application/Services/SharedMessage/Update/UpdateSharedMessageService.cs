using Microsoft.EntityFrameworkCore;
using Rook.Application.Services.SharedMessage.Update;
using Rook.Domain.Entities;
using Rook.Domain.Exceptions.SharedMessage;
using Rook.Infrastructure.Data;

public class UpdateSharedMessageService(
    ApplicationDbContext dbContext
)
{
    public async Task<UpdateSharedMessageResponse> Update(UpdateSharedMessageCommand request, string userId)
    {
        var sharedMessage = await dbContext.SharedMessages.FirstOrDefaultAsync(sm => sm.Id == request.Id);

        if (sharedMessage is null)
        {
            throw new InvalidSharedMessageException("Invalid Message ID");
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


        return new UpdateSharedMessageResponse(sharedMessage.Id, sharedMessage.Content, sharedMessage.UpdatedAt);
    }
}