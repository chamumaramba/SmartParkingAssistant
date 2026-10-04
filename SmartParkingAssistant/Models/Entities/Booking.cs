using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartParkingAssistant.Server.Models.Entities
{
    public class Booking
    {
        [Key]
        public int BookingId { get; set; }

        //public string BookingCode { get; set; } = Guid.NewGuid().ToString();

        [ForeignKey("User")]
        public string UserId { get; set; }

        [MaxLength(15)]
        public string? LicensePlate { get; set; }

        [MaxLength(6)]
        public string? AccessCode { get; set; }

        [ForeignKey("ParkingSpot")]
        public int ParkingSpotId { get; set; }

        public DateTime BookTime { get; set; } = DateTime.Now;
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public DateTime? CancelTime { get; set; }

        public bool IsActive { get; set; } = true;

        // Navigation properties
        public virtual User? User { get; set; }
        public virtual ParkingSpot? ParkingSpot { get; set; }
    }
}
