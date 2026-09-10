using Rook.Domain.Entities.Tables.Employees;

namespace Rook.Domain.Entities.Tables.ShiftPatterns;

public class ShiftPattern
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string NormalizedName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public required string CreatedBy {get; set; }
    public DateTime? LastEditedAt {get; set ;}
    public string? LastEditedBy { get; set; }

    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
    public ICollection<ShiftPatternDay> Days { get; set; } = new List<ShiftPatternDay>();
}