using System.Net;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using Rook.Domain.Exceptions.Auth;
using Rook.Domain.Exceptions.Common;
using Rook.Domain.Exceptions.SharedMessage;

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

        IReadOnlyCollection<FieldError>? errors = null;

        (problemDetails.Status, problemDetails.Title, problemDetails.Detail) = exception switch
        {
            ValidationException validationEx => Handle(
                (int)HttpStatusCode.BadRequest,
                "Validation Error",
                "One or more validation errors occurred.",
                validationEx.Errors.Select(e => new FieldError(
                    LowercaseFirstLetter(e.PropertyName),
                    e.ErrorMessage
                )),
                out errors
            ),

            UserAlreadyExistsException userExistsEx => Handle(
                (int)HttpStatusCode.Conflict,
                "Conflict",
                "One or more conflicts occurred during registration.",
                userExistsEx.Errors,
                out errors
            ),

            RegistrationFailedException registrationEx => Handle(
                (int)HttpStatusCode.BadRequest,
                "Registration Failed",
                "One or more errors occurred during registration.",
                registrationEx.Errors,
                out errors
            ),

            InvalidLoginException invalidLoginEx => (
                (int)HttpStatusCode.Unauthorized,
                "Unauthorized",
                invalidLoginEx.Message
            ),

            InvalidSharedMessageException invalidSharedMessageEx => (
                (int)HttpStatusCode.NotFound,
                "Message not found",
                invalidSharedMessageEx.Message
            ),

            _ => (
                (int)HttpStatusCode.InternalServerError,
                "An internal server error has occurred.",
                "Please try again later."
            ),
        };

        if (errors is not null)
            problemDetails.Extensions["errors"] = errors;

        httpContext.Response.StatusCode = problemDetails.Status.Value;

        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }

    // Helper so switch arms can populate errors while still returning valid
    // (int, string string) tuple for Status/Title/Detail, keeping switch clean
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

    // FluentValidations PropertyName uses pascal case (Username) casing but our field errors use lowercase (username) to match react
    // Normalized here so react only needs to match the lowercase convention.
    private static string LowercaseFirstLetter(string value) =>
        string.IsNullOrEmpty(value) ? value : char.ToLowerInvariant(value[0]) + value[1..];
}