using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Moq;
using Rook.Application.Services.SharedMessage.Update;
using Rook.Domain.Exceptions.SharedMessage;
using Rook.Infrastructure.Data;
using Rook.Infrastructure.Hubs;

namespace Rook.Tests.Services.SharedMessage.Update;

public class UpdateSharedMessageServiceTests
{
    private static Mock<IHubContext<LiveHub>> CreateHubContextMock()
    {
        var clientProxyMock = new Mock<IClientProxy>();
        clientProxyMock
            .Setup(p => p.SendCoreAsync(It.IsAny<string>(), It.IsAny<object[]>(), default))
            .Returns(Task.CompletedTask);

        var hubClientsMock = new Mock<IHubClients>();
        hubClientsMock
            .Setup(c => c.Group(It.IsAny<string>()))
            .Returns(clientProxyMock.Object);

        var hubContextMock = new Mock<IHubContext<LiveHub>>();
        hubContextMock
            .Setup(h => h.Clients)
            .Returns(hubClientsMock.Object);

        return hubContextMock;
    }

    [Fact]
    public async Task Update_WhenMessageDoesNotExist_ThrowsInvalidSharedMessageException()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var dbContext = new ApplicationDbContext(options);

        var hubContextMock = CreateHubContextMock();

        var command = new UpdateSharedMessageCommand(999, "New content");
        var service = new UpdateSharedMessageService(dbContext, hubContextMock.Object);

        await Assert.ThrowsAsync<InvalidSharedMessageException>(() => service.Update(command, "some-user-id"));
    }

    [Fact]
    public async Task Update_WhenMessageExists_SavesEditCreatesAuditRowAndBroadcasts()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var dbContext = new ApplicationDbContext(options);

        var existingMessage = new Rook.Domain.Entities.SharedMessage
        {
            Content = "Old content",
            UpdatedAt = DateTime.UtcNow.AddDays(-1),
        };
        dbContext.SharedMessages.Add(existingMessage);
        await dbContext.SaveChangesAsync();

        var hubContextMock = CreateHubContextMock();

        var command = new UpdateSharedMessageCommand(existingMessage.Id, "New content");
        var service = new UpdateSharedMessageService(dbContext, hubContextMock.Object);

        var result = await service.Update(command, "editor-user-id");

        Assert.Equal("New content", result.Content);

        var updatedMessage = await dbContext.SharedMessages.FindAsync(existingMessage.Id);
        Assert.NotNull(updatedMessage);
        Assert.Equal("New content", updatedMessage.Content);

        var editRow = await dbContext.SharedMessageEdits.FirstOrDefaultAsync(e => e.SharedMessageId == existingMessage.Id);
        Assert.NotNull(editRow);
        Assert.Equal("editor-user-id", editRow.EditedByUserId);
        Assert.Equal("New content", editRow.Content);
    }
}