namespace Rook.Domain.Entities.Tables.SharedMessage;
public class SharedMessage
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
}