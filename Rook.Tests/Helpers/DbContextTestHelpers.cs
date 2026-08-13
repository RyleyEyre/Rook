using Microsoft.EntityFrameworkCore;
using Rook.Infrastructure.Data;

namespace Rook.Tests.Helpers;

public static class DbContextTestHelpers
{
    // Fresh in-memory db per call, so tests never see each other's data
    public static ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }
}
