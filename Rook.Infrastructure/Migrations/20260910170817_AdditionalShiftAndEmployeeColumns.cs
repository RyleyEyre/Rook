using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Rook.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AdditionalShiftAndEmployeeColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "ShiftPatterns",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "ShiftPatterns",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "LastEditedAt",
                table: "ShiftPatterns",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastEditedBy",
                table: "ShiftPatterns",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Employees",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "LastEditedAt",
                table: "Employees",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastEditedBy",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "ShiftPatterns");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "ShiftPatterns");

            migrationBuilder.DropColumn(
                name: "LastEditedAt",
                table: "ShiftPatterns");

            migrationBuilder.DropColumn(
                name: "LastEditedBy",
                table: "ShiftPatterns");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "LastEditedAt",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "LastEditedBy",
                table: "Employees");
        }
    }
}
