using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Rook.Domain.Exceptions.Employees;
using Rook.Infrastructure.Data;
using Rook.Infrastructure.Identity;

namespace Rook.Application.Services.Employees.GetById;

public class GetByIdEmployeeService(
    ApplicationDbContext dbContext,
    UserManager<ApplicationUser> userManager
)
{
    public async Task<GetByIdEmployeeResponse> Get(GetByIdEmployeeCommand request)
    {
        var employee = await dbContext.Employees
            .Include(e => e.Department)
            .Include(e => e.ShiftPattern)
            .FirstOrDefaultAsync(e => e.UserId == request.UserId);

        if (employee is null)
        {
            throw new EmployeeNotFoundException("No employee exists with this id.");
        }

        var user = await userManager.FindByIdAsync(request.UserId);
        if (user is null)
        {
            throw new EmployeeNotFoundException("No employee exists with this id.");
        }

        var roles = await userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? string.Empty;

        return new GetByIdEmployeeResponse(
            UserId: employee.UserId,
            Username: user.UserName!,
            Email: user.Email!,
            FirstName: employee.FirstName,
            LastName: employee.LastName,
            MiddleName: employee.MiddleName,
            Role: role,
            DepartmentId: employee.DepartmentId,
            DepartmentName: employee.Department?.Name,
            ShiftPatternId: employee.ShiftPatternId,
            ShiftPatternName: employee.ShiftPattern?.Name,
            StartDate: employee.StartDate,
            ManagerId: employee.ManagerId,
            FusionId: employee.FusionId,
            WCSId: employee.WCSId,
            VoiceConsoleId: employee.VoiceConsoleId,
            TerminationDate: employee.TerminationDate
        );
    }
}