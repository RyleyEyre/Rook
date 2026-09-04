using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Rook.Infrastructure.Data;
using Rook.Infrastructure.Identity;
using Rook.Domain.Exceptions.Common;

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
            var field = nameof(request.UserId);
            var error = new FieldError(field, ErrorCode.RECORD_NOT_FOUND.ToString(), ErrorMessages.For(ErrorCode.RECORD_NOT_FOUND, "user id"));
            throw new NotFoundException("The requested record was not found.", [error]);
        }

        var user = await userManager.FindByIdAsync(request.UserId);
        if (user is null)
        {
            var field = nameof(request.UserId);
            var error = new FieldError(field, ErrorCode.RECORD_NOT_FOUND.ToString(), ErrorMessages.For(ErrorCode.RECORD_NOT_FOUND, "user id"));
            throw new NotFoundException("The requested record was not found.", [error]);
        }

        if (employee.TerminationDate is not null)
        {
            var field = nameof(employee.TerminationDate);
            var error = new FieldError(field, ErrorCode.INVALID_STATE.ToString(), ErrorMessages.For(ErrorCode.INVALID_STATE, "termination date"));
            throw new ConflictException("The employee is already terminated.", [error]);
        }

        // Free up the original username and email for reuse, and clearly mark the
        // account as terminated in the database, rather than leaving the
        // clean username permanently reserved by someone no longer employed.

        employee.TerminationDate = request.TerminationDate;

        var terminatedUsername = $"{user.UserName}_terminated_{request.UserId}";
        var terminatedEmail = $"{user.Email}_terminated_{request.UserId}";

        await userManager.SetUserNameAsync(user, terminatedUsername);
        await userManager.SetEmailAsync(user, terminatedEmail);
        await userManager.UpdateNormalizedEmailAsync(user);
        await userManager.UpdateNormalizedUserNameAsync(user);

        await userManager.SetLockoutEnabledAsync(user, true);
        await userManager.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue);

        await dbContext.SaveChangesAsync();
    }
}