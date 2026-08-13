using Microsoft.Extensions.Configuration;
using Moq;

namespace Rook.Tests.Helpers;

public static class JwtConfigurationTestHelpers
{
    // Fake JWT settings so token-issuing services have something to read
    public static Mock<IConfiguration> CreateJwtConfigurationMock()
    {
        var configurationMock = new Mock<IConfiguration>();
        configurationMock.Setup(c => c["Jwt:Key"]).Returns("this-is-a-test-key-at-least-32-characters-long");
        configurationMock.Setup(c => c["Jwt:Issuer"]).Returns("TestIssuer");
        configurationMock.Setup(c => c["Jwt:Audience"]).Returns("TestAudience");

        return configurationMock;
    }
}
