using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Rook.Infrastructure.Identity;
using Rook.Domain.Entities.Tables.SharedMessage;
using Rook.Domain.Entities.Tables.Employees;
using Rook.Domain.Entities.Tables.Departments;
using Rook.Domain.Entities.Tables.ShiftPatterns;

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
    public DbSet<ShiftPatternDay> ShiftPatternDays => Set<ShiftPatternDay>();
    

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // IdentityDbContext configures its own tables (AspNetUsers, AspNetRoles, etc.)
    // in its own OnModelCreating — always call base first or that configuration
    // is silently skipped.
    base.OnModelCreating(modelBuilder);

    // Employee shares its primary key with ApplicationUser.Id rather than having
    // its own — this is a genuine, permanent 1-to-1 relationship, so a separate
    // auto-incrementing Id would just be redundant. EF Core doesn't auto-detect
    // UserId as a key by convention here, so it's declared explicitly.
    modelBuilder.Entity<Employee>()
        .HasKey(e => e.UserId);

    // No navigation property to ApplicationUser exists on Employee (Domain can't
    // reference Infrastructure-layer Identity types), so this relationship is
    // configured entirely here instead of via convention. Restrict: deleting a
    // user must never silently delete their employee/HR record.
    modelBuilder.Entity<Employee>()
        .HasOne<ApplicationUser>()
        .WithOne()
        .HasForeignKey<Employee>(e => e.UserId)
        .OnDelete(DeleteBehavior.Restrict);

    // Restrict (not the EF default Cascade for required relationships): deleting
    // a Department/ShiftPattern must never silently wipe out every employee
    // assigned to it. DeleteDepartmentService/DeleteShiftPatternService check
    // for in-use references explicitly before allowing a delete.
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

    // DB-level uniqueness on the normalized name, not just an application-level
    // check — closes the race condition where two simultaneous requests could
    // both pass the app-level "does this name exist" check before either saves.
    modelBuilder.Entity<Department>()
        .HasIndex(d => d.NormalizedName)
        .IsUnique();

    modelBuilder.Entity<ShiftPattern>()
        .HasIndex(sp => sp.NormalizedName)
        .IsUnique();

    // Cascade here (unlike Employee's relationships above) is deliberate and
    // correct: a ShiftPatternDay has no meaning without its parent ShiftPattern,
    // so there's no scenario where an orphaned day-entry should survive.
    modelBuilder.Entity<ShiftPatternDay>()
        .HasOne(spd => spd.ShiftPattern)
        .WithMany(sp => sp.Days)
        .HasForeignKey(spd => spd.ShiftPatternId)
        .OnDelete(DeleteBehavior.Cascade);
}
}