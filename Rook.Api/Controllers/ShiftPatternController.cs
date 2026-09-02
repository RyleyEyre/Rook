using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Rook.Application.Services.ShiftPatterns.Create;
using Rook.Application.Services.ShiftPatterns.Delete;
using Rook.Application.Services.ShiftPatterns.Update;
using Rook.Application.Services.ShiftPatterns.List;

namespace Rook.Api.Controllers;

[ApiController]
[Route("api/shift-patterns")]
public class ShiftPatternController(
    CreateShiftPatternService createShiftPatternService,
    DeleteShiftPatternService deleteShiftPatternService,
    UpdateShiftPatternService updateShiftPatternService,
    ListShiftPatternsService listShiftPatternsService
    ) : ControllerBase
{
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateShiftPatternCommand request)
    {
        var result = await createShiftPatternService.Create(request);
        return Ok(
            new
            {
                success = true,
                message = "Shift Pattern Creation Successful",
                data = result
            }
        );
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var command = new DeleteShiftPatternCommand(id);
        await deleteShiftPatternService.Delete(command);
        return Ok(
            new
            {
                success = true,
                message = "Shift Pattern Deletion Successful",
            }
        );
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateShiftPatternRequest request)
    {
        var command = new UpdateShiftPatternCommand(
            Id: id,
            Name: request.Name,
            Days: request.Days
        );

        var result = await updateShiftPatternService.Update(command);
        return Ok(
            new
            {
                success = true,
                message = "Shift Pattern Update Successful",
                data = result,
            }
        );
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var result = await listShiftPatternsService.List();
        return Ok(
            new
            {
                success = true,
                message = "Departments List Retrieved",
                data = result,
            }
        );
    }
}