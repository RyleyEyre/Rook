using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Rook.Application.Services.SharedMessage.Update;
using Rook.Application.Services.SharedMessage.Get;

namespace Rook.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SharedMessageController(
    GetSharedMessageService getSharedMessageService,
    UpdateSharedMessageService updateSharedMessageService
    ) : ControllerBase
{
    public record UpdateSharedMessageContentRequest(string Content);

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSharedMessage(Guid id, [FromBody] UpdateSharedMessageContentRequest request)
    {
        var userId = User.FindFirst("sub")?.Value;
        var command = new UpdateSharedMessageCommand(id, request.Content);
        var result = await updateSharedMessageService.Update(command, userId!);
        return Ok(
            new
            {
                success = true,
                message = "Update Successful",
                data = result,
            }
        );
    }

    [Authorize]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetSharedMessage(Guid id)
    {
        var command = new GetSharedMessageCommand(id);
        var result = await getSharedMessageService.Get(command);
        return Ok(
            new
            {
                success = true,
                message = "Get Successful",
                data = result
            }
        );
    }
}