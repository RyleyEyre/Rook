using Microsoft.AspNetCore.Mvc;
using Rook.Application.Services.Auth.Login;
using Rook.Application.Services.Auth.Logout;
using Rook.Application.Services.Auth.Refresh;

namespace Rook.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(
    LoginService loginService,
    LogoutService logoutService,
    RefreshService refreshService
    ) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginCommand command)
    {
        var result = await loginService.Login(command);
        return Ok(
            new
            {
                success = true,
                message = "Login Successful",
                data = result,
            }
        );

    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(LogoutCommand command)
    {
        await logoutService.Logout(command);
        return NoContent();
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshCommand command)
    {
        var result = await refreshService.Refresh(command);
        return Ok(
            new
            {
                success = true,
                message = "Refresh successful",
                data = result,
            }
        );
    }
}