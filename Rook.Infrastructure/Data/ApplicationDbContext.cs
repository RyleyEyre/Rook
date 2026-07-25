using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Rook.Infrastructure.Identity;

namespace Rook.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
        
    }

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    // Domain DbSets will go here later, e.g.:
    // public DbSet<Account> Accounts => Set<Account>();
}

