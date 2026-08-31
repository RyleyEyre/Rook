using Rook.Application.Services.Departments.Create;
using Rook.Application.Services.Departments.Delete;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Rook.Api.Controllers;

[ApiController]
[Route("api/departments")]
public class DepartmentController(
    CreateDepartmentService createDepartmentService,
    DeleteDepartmentService deleteDepartmentService
) : ControllerBase
{

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDepartmentCommand request)
    {
        var result = await createDepartmentService.Create(request);
        return Ok(
            new
            {
                success = true,
                message = "Department Creation Successful",
                data = result,
            }
        );
    } 


    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var command = new DeleteDepartmentCommand(id);
        await deleteDepartmentService.Delete(command);
        return Ok(
            new
            {
                success = true,
                message = "Department Deletion Successful",
            }
        );
    }   
}