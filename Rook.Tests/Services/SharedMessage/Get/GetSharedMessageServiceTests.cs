using Microsoft.EntityFrameworkCore;
using Rook.Application.Services.SharedMessage.Get;
using Rook.Domain.Exceptions.SharedMessage;
using Rook.Infrastructure.Data;

namespace Rook.Tests.Services.SharedMessage.Get;

public class GetSharedMessageServiceTests
{
    [Fact]
    public async Task Get_WhenMessageDoesNotExist_ThrowsInvalidSharedMessageException()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var dbContext = new ApplicationDbContext(options);

        var command = new GetSharedMessageCommand(999);
        var service = new GetSharedMessageService(dbContext);

        await Assert.ThrowsAsync<InvalidSharedMessageException>(() => service.Get(command));
    }

    [Fact]
    public async Task Get_WhenMessageExists_ReturnsGetSharedMessageResponse()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var dbContext = new ApplicationDbContext(options);

        var existingMessage = new Rook.Domain.Entities.SharedMessage
        {
            Content = "Hello world",
            UpdatedAt = DateTime.UtcNow,
        };
        dbContext.SharedMessages.Add(existingMessage);
        await dbContext.SaveChangesAsync();

        var command = new GetSharedMessageCommand(existingMessage.Id);
        var service = new GetSharedMessageService(dbContext);

        var result = await service.Get(command);

        Assert.Equal(existingMessage.Id, result.Id);
        Assert.Equal("Hello world", result.Content);
    }
}