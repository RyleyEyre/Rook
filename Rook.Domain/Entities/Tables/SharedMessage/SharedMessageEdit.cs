namespace Rook.Domain.Entities.Tables.SharedMessage;

// Demo-scoped audit table for this one feature. A real generic audit log
// (entity type + entity id + user + timestamp) would be the better long-term
// pattern once there are multiple features needing history tracking.
public class SharedMessageEdit
{
    public int Id { get; set; }
    public int SharedMessageId { get; set; }
    public string EditedByUserId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime EditedAt { get; set; }
}