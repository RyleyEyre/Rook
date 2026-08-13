using Rook.Application.Services.SharedMessage.Get;
using Rook.Domain.Exceptions.SharedMessage;
using Rook.Tests.Helpers;

namespace Rook.Tests.Services.SharedMessage.Get;

public class GetSharedMessageServiceTests
{
    [Fact]
    public async Task Get_WhenMessageDoesNotExist_ThrowsInvalidSharedMessageException()
    {
        // Arrange
        var dbContext = DbContextTestHelpers.CreateInMemoryDbContext();
        var command = new GetSharedMessageCommand(999);
        var service = new GetSharedMessageService(dbContext);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidSharedMessageException>(() => service.Get(command));
    }

    [Fact]
    public async Task Get_WhenMessageExists_ReturnsGetSharedMessageResponse()
    {
        // Arrange
        var dbContext = DbContextTestHelpers.CreateInMemoryDbContext();

        var existingMessage = new Rook.Domain.Entities.Tables.SharedMessage.SharedMessage
        {
            Content = "Hello world",
            UpdatedAt = DateTime.UtcNow,
        };
        dbContext.SharedMessages.Add(existingMessage);
        await dbContext.SaveChangesAsync();

        var command = new GetSharedMessageCommand(existingMessage.Id);
        var service = new GetSharedMessageService(dbContext);

        // Act
        var result = await service.Get(command);

        // Assert
        Assert.Equal(existingMessage.Id, result.Id);
        Assert.Equal("Hello world", result.Content);
    }
}
