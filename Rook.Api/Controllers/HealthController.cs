using Microsoft.AspNetCore.Mvc;

namespace Rook.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok("Health Ok");
    }
}