using Microsoft.AspNetCore.Identity;

namespace Rook.Infrastructure.Identity;

// Extends Identity's base user to allow adding app-specific properties
// (e.g. DisplayName) without touching Identity's core schema.
public class ApplicationUser : IdentityUser
{
    public string Theme { get; set; } = "crimson";
}