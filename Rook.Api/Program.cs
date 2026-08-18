using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Rook.Infrastructure.Data;
using Rook.Infrastructure.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using Rook.Api.Middleware;
using Rook.Application.Services.Auth.Login;
using Rook.Application.Services.Employees.Create;
using FluentValidation;
using Rook.Application.Services.Auth.Logout;
using Rook.Application.Services.Auth.Refresh;
using Rook.Domain.Entities.Tables.Employees;
using Rook.Infrastructure.Hubs;
using Rook.Application.Services.Employees.Update;
using Rook.Application.Services.Employees.Delete;



var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// Connection string is loaded from User Secrets in Development
// (never committed to source control — see dotnet user-secrets).
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddScoped<LoginService>();
builder.Services.AddScoped<CreateEmployeeService>();
builder.Services.AddScoped<UpdateEmployeeService>();
builder.Services.AddScoped<DeleteEmployeeService>();
builder.Services.AddScoped<LogoutService>();
builder.Services.AddScoped<RefreshService>();
builder.Services.AddScoped<GetSharedMessageService>();
builder.Services.AddScoped<UpdateSharedMessageService>();

builder.Services.AddSignalR();

builder.Services.AddValidatorsFromAssembly(typeof(LoginValidator).Assembly);

var jwtKey = builder.Configuration["Jwt:Key"]!;
var jwtIssuer = builder.Configuration["Jwt:Issuer"]!;
var jwtAudience = builder.Configuration["Jwt:Audience"]!;

// Without this, .NET remaps standard claims (e.g. "sub" -> nameidentifier URI)
// on incoming tokens, so User.FindFirst("sub") wouldn't find anything.
// Disabling it keeps claim names identical to what we put in the token.
JwtSecurityTokenHandler.DefaultMapInboundClaims = false;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    // Key, Issuer and Audience loaded from user secrets in development,
    // ValidateIssuer used to ensure token came from this api,
    // ValidateAudience ensures that the token is valid for this api only, checking against the specific audience value,
    // ValidateLifetime disalowes the use of expired tokens,
    // ValidateIssuerSigningKey recomputes what the signature should be using our secret, tokens not created with our secret wont work as the signature will be invalid.
    // ClockSkew default is 5 minutes (to account for server time drift), Set to 0 here so token expiry is enforced exactly
    // acceptable as both issuing and validating server are the same
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };
    
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;

            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }

            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://192.168.0.245:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

app.UseExceptionHandler();
app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapHub<LiveHub>("/hubs/live");
app.MapControllers();



// RoleManager is normally scoped to an HTTP request, but this seeding code
// runs once at startup with no request in progress — so we manually create
// a scope just for this block, then let it dispose automatically via 'using'.
using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    string [] roles = ["User", "Admin"];
    
    foreach (var role in roles)
    {
        if  (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(new IdentityRole(role));
        }
    }
}

using (var scope = app.Services.CreateScope())
{
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();

    // Seed a default "Unassigned" department/shift pattern if none exist yet,
    // so the seeded admin's Employee record has something valid to reference.
    var unassignedDepartment = await dbContext.Departments.FirstOrDefaultAsync(d => d.Name == "Unassigned");
    if (unassignedDepartment is null)
    {
        unassignedDepartment = new Department { Name = "Unassigned" };
        dbContext.Departments.Add(unassignedDepartment);
        await dbContext.SaveChangesAsync();
    }

    var unassignedShiftPattern = await dbContext.ShiftPatterns.FirstOrDefaultAsync(sp => sp.Name == "Unassigned");
    if (unassignedShiftPattern is null)
    {
        unassignedShiftPattern = new ShiftPattern { Name = "Unassigned" };
        dbContext.ShiftPatterns.Add(unassignedShiftPattern);
        await dbContext.SaveChangesAsync();
    }

    // Only seed the default admin if no Admin-role user exists yet — this
    // keeps the block idempotent (safe to run on every startup), and means
    // once a real admin exists, this never fires again.
    var existingAdmins = await userManager.GetUsersInRoleAsync("Admin");
    if (existingAdmins.Count == 0)
    {
        var seedUsername = configuration["SeedAdmin:Username"]!;
        var seedEmail = configuration["SeedAdmin:Email"]!;
        var seedPassword = configuration["SeedAdmin:Password"]!;

        var adminUser = new ApplicationUser
        {
            UserName = seedUsername,
            Email = seedEmail
        };

        var result = await userManager.CreateAsync(adminUser, seedPassword);

        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(adminUser, "Admin");
        }
    }
}

app.Run();
