using Microsoft.AspNetCore.Mvc;
using Rook.Application.Services.Employees.Create;
using Microsoft.AspNetCore.Authorization;

namespace Rook.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmployeeController(
    CreateEmployeeService createEmployeeService
    ) : ControllerBase
{

    [Authorize(Roles = "Admin")]
    [HttpPost("create")]
    public async Task<IActionResult> Register([FromBody] CreateEmployeeCommand command)
    {
        var result = await createEmployeeService.Create(command);
        return Ok(
            new
            {
                success = true,
                message = "Registration Successful",
                data = result,
            }
        );
    }
}