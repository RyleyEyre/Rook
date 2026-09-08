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

    public async Task NotifyRowSelected(string groupName, string rowId, string username) =>
        await Clients.OthersInGroup(groupName).SendAsync("RowSelected", rowId, username);

    public async Task NotifyRowDeselected(string groupName, string rowId, string username) =>
        await Clients.OthersInGroup(groupName).SendAsync("RowDeselected", rowId, username);

    public async Task NotifyRowEditing(string groupName, string rowId, string username) =>
        await Clients.OthersInGroup(groupName).SendAsync("RowEditing", rowId, username);

    public async Task NotifyRowStoppedEditing(string groupName, string rowId, string username) =>
        await Clients.OthersInGroup(groupName).SendAsync("RowStoppedEditing", rowId, username);
}