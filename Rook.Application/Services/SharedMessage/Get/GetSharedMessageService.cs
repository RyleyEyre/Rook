using Microsoft.EntityFrameworkCore;
using Rook.Application.Services.SharedMessage.Get;
using Rook.Domain.Exceptions.Common;
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
            var field = nameof(request.Id);
            var error = new FieldError(field, ErrorCode.RECORD_NOT_FOUND.ToString(), ErrorMessages.For(ErrorCode.RECORD_NOT_FOUND, "id"));
            throw new NotFoundException("The requested record was not found.", [error]);
        }

        return new GetSharedMessageResponse(sharedMessage.Id, sharedMessage.Content, sharedMessage.UpdatedAt);
    }
}