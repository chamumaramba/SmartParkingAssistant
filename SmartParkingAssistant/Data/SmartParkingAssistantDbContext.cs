using Microsoft.EntityFrameworkCore;
using SmartParkingAssistant.Server.Models.Entities;
namespace SmartParkingAssistant.Server.Data
{
    public class SmartParkingAssistantDbContext(DbContextOptions<SmartParkingAssistantDbContext> options): DbContext(options)
    {
        internal DbSet<User> Users { get; set; }
        public DbSet<ParkingSpot> ParkingSpots { get; set; }
        public DbSet<Booking> Bookings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Booking>()
                .HasOne(b => b.ParkingSpot)
                .WithMany(p => p.Bookings)
                .HasForeignKey(b => b.ParkingSpotId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);


            modelBuilder.Entity<Booking>()
                .HasOne(b => b.User)
                .WithMany(u => u.Bookings)
                .HasForeignKey(b => b.UserId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);

            // Seed parking spots 20
            var spots = new List<ParkingSpot>();
            for (int i = 1; i <= 20; i++)
            {
                spots.Add(new ParkingSpot
                {
                    Id = i,
                    IsOccupied = false,
                    IsReserved = false
                });
            }

            modelBuilder.Entity<ParkingSpot>().HasData(spots);

            base.OnModelCreating(modelBuilder);
        }

    }
}
