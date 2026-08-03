using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Rook.Infrastructure.Identity;
using Rook.Domain.Entities;

namespace Rook.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
        
    }

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<SharedMessage> SharedMessages => Set<SharedMessage>();
    public DbSet<SharedMessageEdit> SharedMessageEdits => Set<SharedMessageEdit>();
    // Domain DbSets will go here later, e.g.:
    // public DbSet<Account> Accounts => Set<Account>();
}

