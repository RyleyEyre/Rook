using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Rook.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class DepartmentAndShiftChanges2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "NormalizedName",
                table: "ShiftPatterns",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "NormalizedName",
                table: "Departments",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftPatterns_NormalizedName",
                table: "ShiftPatterns",
                column: "NormalizedName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Departments_NormalizedName",
                table: "Departments",
                column: "NormalizedName",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ShiftPatterns_NormalizedName",
                table: "ShiftPatterns");

            migrationBuilder.DropIndex(
                name: "IX_Departments_NormalizedName",
                table: "Departments");

            migrationBuilder.AlterColumn<string>(
                name: "NormalizedName",
                table: "ShiftPatterns",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<string>(
                name: "NormalizedName",
                table: "Departments",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");
        }
    }
}
