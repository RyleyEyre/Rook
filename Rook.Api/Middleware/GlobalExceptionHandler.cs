using System.Net;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using Rook.Domain.Exceptions.Common;

namespace Rook.Api.Middleware;

public class GlobalExceptionHandler(
    ILogger<GlobalExceptionHandler> logger,
    IHostEnvironment environment
) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken
    )
    {
        logger.LogError(exception, "Unhandled exception processing {Method} {Path}",
            httpContext.Request.Method, httpContext.Request.Path);

        var problemDetails = new ProblemDetails
        {
            Instance = $"{httpContext.Request.Method} {httpContext.Request.Path}",
        };

        IReadOnlyCollection<FieldError>? errors = null;

        (problemDetails.Status, problemDetails.Title, problemDetails.Detail) = exception switch
        {
            ValidationException validationEx => Handle(
                (int)HttpStatusCode.BadRequest,
                "Validation Error",
                "One or more validation errors occurred.",
                validationEx.Errors.Select(e => new FieldError(
                    LowercaseFirstLetter(e.PropertyName),
                    ErrorCode.VALIDATION_FAILED.ToString(),
                    e.ErrorMessage
                )),
                out errors
            ),

            NotFoundException notFoundEx when notFoundEx.Errors is not null => Handle(
                (int)HttpStatusCode.NotFound,
                "Not Found",
                notFoundEx.Message,
                notFoundEx.Errors,
                out errors
            ),

            NotFoundException notFoundEx => (
                (int)HttpStatusCode.NotFound,
                "Not Found",
                notFoundEx.Message
            ),

            ConflictException conflictEx when conflictEx.Errors is not null => Handle(
                (int)HttpStatusCode.Conflict,
                "Conflict",
                conflictEx.Message,
                conflictEx.Errors,
                out errors
            ),

            ConflictException conflictEx => (
                (int)HttpStatusCode.Conflict,
                "Conflict",
                conflictEx.Message
            ),

            BadRequestException badRequestEx when badRequestEx.Errors is not null => Handle(
                (int)HttpStatusCode.BadRequest,
                "Bad Request",
                badRequestEx.Message,
                badRequestEx.Errors,
                out errors
            ),

            BadRequestException badRequestEx => (
                (int)HttpStatusCode.BadRequest,
                "Bad Request",
                badRequestEx.Message
            ),

            UnauthorizedException unauthorizedEx when unauthorizedEx.Errors is not null => Handle(
                (int)HttpStatusCode.Unauthorized,
                "Unauthorized",
                unauthorizedEx.Message,
                unauthorizedEx.Errors,
                out errors
            ),

            UnauthorizedException unauthorizedEx => (
                (int)HttpStatusCode.Unauthorized,
                "Unauthorized",
                unauthorizedEx.Message
            ),

            _ => (
                (int)HttpStatusCode.InternalServerError,
                "An internal server error has occurred.",
                environment.IsDevelopment()
                    ? $"{exception.GetType().Name}: {exception.Message}\n{exception.StackTrace}"
                    : "Please try again later."
            ),
        };

        if (errors is not null)
            problemDetails.Extensions["errors"] = errors;

        httpContext.Response.StatusCode = problemDetails.Status.Value;

        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }

    private static (int, string, string) Handle(
        int status,
        string title,
        string detail,
        IEnumerable<FieldError> source,
        out IReadOnlyCollection<FieldError> errors)
    {
        errors = source.ToList();
        return (status, title, detail);
    }

    private static string LowercaseFirstLetter(string value) =>
        string.IsNullOrEmpty(value) ? value : char.ToLowerInvariant(value[0]) + value[1..];
}