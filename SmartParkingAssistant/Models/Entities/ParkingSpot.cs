using System.ComponentModel.DataAnnotations;

namespace SmartParkingAssistant.Server.Models.Entities
{
    public class ParkingSpot
    {
        [Key]
        public int Id { get; set; }

        public bool IsOccupied { get; set; } = false;
        public bool IsReserved { get; set; } = false;

        // A parking spot has many bookings (optional)
        public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}
