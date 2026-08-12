using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Rook.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ConvertSharedMessageIdsToInt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "SharedMessageEdits");
            migrationBuilder.DropTable(name: "SharedMessages");

            migrationBuilder.CreateTable(
                name: "SharedMessages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SharedMessages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SharedMessageEdits",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SharedMessageId = table.Column<int>(type: "int", nullable: false),
                    EditedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EditedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SharedMessageEdits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SharedMessageEdits_SharedMessages_SharedMessageId",
                        column: x => x.SharedMessageId,
                        principalTable: "SharedMessages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SharedMessageEdits_SharedMessageId",
                table: "SharedMessageEdits",
                column: "SharedMessageId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "SharedMessageEdits");
            migrationBuilder.DropTable(name: "SharedMessages");
        }
    }
}
