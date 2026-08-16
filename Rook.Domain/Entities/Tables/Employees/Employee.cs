namespace Rook.Domain.Entities.Tables.Employees;

public class Employee
{
    public string UserId { get; set; } = string.Empty;

    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }

    public int DepartmentId { get; set; }
    public Department Department { get; set; } = null!;

    public int ShiftPatternId { get; set; }
    public ShiftPattern ShiftPattern { get; set; } = null!;

    public string? ManagerId { get; set; }

    public string? FusionId { get; set; }
    public string? WCSId { get; set; }
    public string? VoiceConsoleId { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime? TerminationDate {get; set; }
}