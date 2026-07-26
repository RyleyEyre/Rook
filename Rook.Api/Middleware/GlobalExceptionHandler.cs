using System.Net;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using Rook.Domain.Exceptions;

namespace Rook.Api.Middleware;

public class GlobalExceptionHandler() : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken
    )
    {
        var problemDetails = new ProblemDetails
        {
            Instance = $"{httpContext.Request.Method} {httpContext.Request.Path}",
        };

        (problemDetails.Status, problemDetails.Title, problemDetails.Detail) = exception switch
        {
            
            ValidationException validationEx => (
                (int)HttpStatusCode.BadRequest,
                "Validation Error",
                "One or more validation errors occurred."
            ),
            
            InvalidLoginException invalidLoginEx=> (
                (int)HttpStatusCode.Unauthorized,
                "Unauthorized",
                invalidLoginEx.Message
            ),
            
            _ => (
                (int)HttpStatusCode.InternalServerError,
                "An internal server error has occurred.",
                "Please try again later."
            ),
        };

        if (exception is ValidationException validationException)
            problemDetails.Extensions["errors"] = validationException.Errors.Select(e => new
            {
                property = e.PropertyName,
                error = e.ErrorMessage,
            });

        httpContext.Response.StatusCode = problemDetails.Status.Value;

        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }
}