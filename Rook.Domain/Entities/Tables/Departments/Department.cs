using Rook.Domain.Entities.Tables.Employees;
namespace Rook.Domain.Entities.Tables.Departments;

public class Department
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string NormalizedName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public required string CreatedBy {get; set; }
    public DateTime? LastEditedAt {get; set ;}
    public string? LastEditedBy { get; set; }
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
}