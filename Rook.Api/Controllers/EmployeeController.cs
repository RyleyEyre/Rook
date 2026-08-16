using Microsoft.AspNetCore.Mvc;
using Rook.Application.Services.Employees.Create;
using Rook.Application.Services.Employees.Update;
using Microsoft.AspNetCore.Authorization;

namespace Rook.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmployeeController(
    CreateEmployeeService createEmployeeService,
    UpdateEmployeeService updateEmployeeService
    ) : ControllerBase
{

    [Authorize(Roles = "Admin")]
    [HttpPost("create")]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeCommand command)
    {
        var result = await createEmployeeService.Create(command);
        return Ok(
            new
            {
                success = true,
                message = "Employee Creation Successful",
                data = result,
            }
        );
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("update")]
    public async Task<IActionResult> Update([FromBody] UpdateEmployeeCommand command)
    {
        var result = await updateEmployeeService.Update(command);
        return Ok(
            new
            {
                success = true,
                message = "Employee Update Successful",
                data = result,
            }
        );
    }
}