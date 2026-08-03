using Microsoft.EntityFrameworkCore;
using Rook.Application.Services.SharedMessage.Get;
using Rook.Domain.Exceptions.SharedMessage;
using Rook.Infrastructure.Data;

public class GetSharedMessageService(
    ApplicationDbContext dbContext
)
{
    public async Task<GetSharedMessageResponse> Get(GetSharedMessageCommand request)
    {
        var sharedMessage = await dbContext.SharedMessages.FirstOrDefaultAsync(sm => sm.Id == request.Id);

        if (sharedMessage is null)
        {
            throw new InvalidSharedMessageException("Invalid Message ID");
        }

        return new GetSharedMessageResponse(sharedMessage.Id, sharedMessage.Content, sharedMessage.UpdatedAt);
    }
}