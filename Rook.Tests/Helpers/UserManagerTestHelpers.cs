using Microsoft.AspNetCore.Identity;
using Moq;
using Rook.Infrastructure.Identity;

namespace Rook.Tests.Helpers;

public static class UserManagerTestHelpers
{
    // UserManager has no parameterless constructor, so we fake the store
    // and pass null for the other dependencies tests don't touch
    public static Mock<UserManager<ApplicationUser>> CreateUserManagerMock()
    {
        return new Mock<UserManager<ApplicationUser>>(
            Mock.Of<IUserStore<ApplicationUser>>(), null!, null!, null!, null!, null!, null!, null!, null!);
    }
}
