using Rook.Domain.Entities.Tables.Departments;
using Rook.Domain.Entities.Tables.ShiftPatterns;

namespace Rook.Domain.Entities.Tables.Employees;

public class Employee
{
    public string UserId { get; set; } = string.Empty;

    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }

    public int? DepartmentId { get; set; }
    public Department? Department { get; set; }

    public int? ShiftPatternId { get; set; }
    public ShiftPattern? ShiftPattern { get; set; }

    // TODO create a management portal
    public string? ManagerId { get; set; }

    public string? FusionId { get; set; }
    public string? WCSId { get; set; }
    public string? VoiceConsoleId { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime? TerminationDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public required string CreatedBy {get; set; }
    public DateTime? LastEditedAt {get; set ;}
    public string? LastEditedBy { get; set; }

    // Computed rather than stored, so it can never drift out of sync with
    // the actual data — always reflects whatever's currently filled in.
    public bool IsProfileComplete =>
        DepartmentId is not null &&
        ShiftPatternId is not null;
}