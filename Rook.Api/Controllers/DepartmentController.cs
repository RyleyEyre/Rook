using Rook.Application.Services.Departments.Create;
using Rook.Application.Services.Departments.Delete;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Rook.Application.Services.Departments.Update;
using Rook.Application.Services.Departments.List;

namespace Rook.Api.Controllers;

[ApiController]
[Route("api/departments")]
public class DepartmentController(
    CreateDepartmentService createDepartmentService,
    DeleteDepartmentService deleteDepartmentService,
    UpdateDepartmentService updateDepartmentService,
    ListDepartmentsService listDepartmentsService
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

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDepartmentRequest request)
    {
        var command = new UpdateDepartmentCommand(
            Id: id,
            Name: request.Name
        );

        var result = await updateDepartmentService.Update(command);
        return Ok(
            new
            {
                success = true,
                message = "Department Update Successful",
                data = result
            }
        );
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var result = await listDepartmentsService.List();
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