using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Rook.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    [HttpGet("secure")]
    [Authorize]
    public IActionResult Secure()
    {
        var userId = User.FindFirst("sub")?.Value;
        return Ok($"Hello, authenticated user {userId}!");
    }

    [HttpGet("admin-only")]
    [Authorize(Roles = "Admin")]

        public IActionResult AdminOnly()
    {
        var userId = User.FindFirst("sub")?.Value;
        return Ok($"Hello Admin!");
    }

}