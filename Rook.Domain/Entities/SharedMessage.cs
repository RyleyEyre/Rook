namespace Rook.Domain.Entities;
public class SharedMessage
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
}