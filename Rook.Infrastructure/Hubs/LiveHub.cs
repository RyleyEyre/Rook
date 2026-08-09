using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

namespace Rook.Infrastructure.Hubs;

[Authorize]
public class LiveHub : Hub
{
    public async Task JoinGroup(string groupName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
    }

    public async Task LeaveGroup(string groupName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }

    public async Task NotifyEditing(string groupName, string username)
    {
        await Clients.OthersInGroup(groupName).SendAsync("UserEditing", username);
    }

    public async Task NotifyStoppedEditing(string groupName, string username)
    {
        await Clients.OthersInGroup(groupName).SendAsync("UserStoppedEditing", username);
    }
}