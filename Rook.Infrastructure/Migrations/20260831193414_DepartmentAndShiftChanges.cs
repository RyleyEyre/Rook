using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Rook.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class DepartmentAndShiftChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NormalizedName",
                table: "ShiftPatterns",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "NormalizedName",
                table: "Departments",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NormalizedName",
                table: "ShiftPatterns");

            migrationBuilder.DropColumn(
                name: "NormalizedName",
                table: "Departments");
        }
    }
}
