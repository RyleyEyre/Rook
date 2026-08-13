using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Rook.Infrastructure.Identity;
using Rook.Domain.Entities.Tables.SharedMessage;
using Rook.Domain.Entities.Tables.Employee;

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
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<ShiftPattern> ShiftPatterns => Set<ShiftPattern>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Employee>()
            .HasKey(e => e.UserId);

        modelBuilder.Entity<Employee>()
            .HasOne<ApplicationUser>()
            .WithOne()
            .HasForeignKey<Employee>(e => e.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Employee>()
            .HasOne(e => e.Department)
            .WithMany(d => d.Employees)
            .HasForeignKey(e => e.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Employee>()
            .HasOne(e => e.ShiftPattern)
            .WithMany(sp => sp.Employees)
            .HasForeignKey(e => e.ShiftPatternId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}