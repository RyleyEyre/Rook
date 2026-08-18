using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Rook.Infrastructure.Data;
using Rook.Infrastructure.Identity;
using Rook.Domain.Exceptions.Employees;

namespace Rook.Application.Services.Employees.Delete;

public class DeleteEmployeeService(
    UserManager<ApplicationUser> userManager,
    ApplicationDbContext dbContext
)
{
    public async Task Delete(DeleteEmployeeCommand request)
    {
        var employee = await dbContext.Employees.FirstOrDefaultAsync(e => e.UserId == request.UserId);
        if (employee is null)
        {
            throw new EmployeeNotFoundException("No employee exists with this id.");
        }

        var user = await userManager.FindByIdAsync(request.UserId);
        if (user is null)
        {
            throw new EmployeeNotFoundException("No employee exists with this id.");
        }

        if (employee.TerminationDate is not null)
        {
            throw new EmployeeTerminatedException("This employee is terminated");
        }
        employee.TerminationDate = request.TerminationDate;

        // Free up the original username and email for reuse, and clearly mark the
        // account as terminated in the database, rather than leaving the
        // clean username permanently reserved by someone no longer employed.

        var terminatedUsername = $"{user.UserName}_terminated_{request.TerminationDate}";
        var terminatedEmail = $"{user.Email}_terminated_{request.TerminationDate}";

        await userManager.SetUserNameAsync(user, terminatedUsername);
        await userManager.SetEmailAsync(user, terminatedEmail);
        await userManager.UpdateNormalizedEmailAsync(user);
        await userManager.UpdateNormalizedUserNameAsync(user);

        await userManager.SetLockoutEnabledAsync(user, true);
        await userManager.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue);

        await dbContext.SaveChangesAsync();
    }
}