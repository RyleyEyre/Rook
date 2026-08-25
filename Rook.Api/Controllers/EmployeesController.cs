using Microsoft.AspNetCore.Mvc;
using Rook.Application.Services.Employees.Create;
using Rook.Application.Services.Employees.Update;
using Rook.Application.Services.Employees.Delete;
using Rook.Application.Services.Employees.List;
using Rook.Application.Services.Employees.GetById;

using Microsoft.AspNetCore.Authorization;

namespace Rook.Api.Controllers;

[ApiController]
[Route("api/employees")]
public class EmployeeController(
    CreateEmployeeService createEmployeeService,
    UpdateEmployeeService updateEmployeeService,
    DeleteEmployeeService deleteEmployeeService,
    ListEmployeesService listEmployeesService,
    GetByIdEmployeeService getByIdEmployeeService
    ) : ControllerBase
{

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeCommand request)
    {
        var result = await createEmployeeService.Create(request);
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
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateEmployeeRequest request)
    {
        var command = new UpdateEmployeeCommand(
            UserId: id,
            Username: request.Username, 
            Email: request.Email, 
            FirstName: request.FirstName, 
            LastName: request.LastName,
            MiddleName: request.MiddleName,
            Role: request.Role, 
            DepartmentId: request.DepartmentId, 
            ShiftPatternId: request.ShiftPatternId,
            StartDate: request.StartDate, 
            ManagerId: request.ManagerId, 
            FusionId: request.FusionId, 
            WCSId: request.WCSId,
            VoiceConsoleId: request.VoiceConsoleId, 
            TerminationDate: request.TerminationDate
        );

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

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, [FromBody] DeleteEmployeeRequest request)
    {
        var command = new DeleteEmployeeCommand(
            TerminationDate: request.TerminationDate, 
            UserId: id    
        );

        await deleteEmployeeService.Delete(command);
        return Ok(
            new
            {
                success = true,
                message = "Employee Delete Successful",
            }
        );
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var result = await listEmployeesService.List();
        return Ok(
            new
            {
                success = true,
                message = "Employee List Retrieved",
                data = result,
            }
        );
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var command = new GetByIdEmployeeCommand(id);
        var result = await getByIdEmployeeService.Get(command);
        return Ok(
            new
            {
                success = true,
                message = "Employee details retrieved",
                data = result,
            }
        );
    }
}