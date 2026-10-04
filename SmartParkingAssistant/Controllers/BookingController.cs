using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartParkingAssistant.Server.Data;
using SmartParkingAssistant.Server.Models.Entities;
using SmartParkingAssistant.Server.Services;

namespace SmartParkingAssistant.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BookingController(SmartParkingAssistantDbContext context, IMqttService mqttService)
        : ControllerBase
    {
        [HttpPost("create")]
        public async Task<IActionResult> CreateBooking([FromBody] Booking request)
        {
            if (request is null || string.IsNullOrWhiteSpace(request.UserId) || request.ParkingSpotId <= 0)
                return BadRequest(new { Message = "UserId and ParkingSpotId are required." });

            var user = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == request.UserId);
            if (user is null)
                return NotFound(new { Message = "User not found." });

            var spot = await context.ParkingSpots.FindAsync(request.ParkingSpotId);
            if (spot is null)
                return NotFound(new { Message = "Parking spot not found." });

            if (spot.IsOccupied || spot.IsReserved)
                return BadRequest(new { Message = "Parking spot is unavailable." });

            if (!string.IsNullOrWhiteSpace(user.LicensePlate)
                && await context.Bookings.AnyAsync(b => b.LicensePlate == user.LicensePlate && b.IsActive))
            {
                return BadRequest(new { Message = "You already have an active booking." });
            }

            if (await context.Bookings.AnyAsync(b => b.ParkingSpotId == spot.Id && b.IsActive))
                return BadRequest(new { Message = "Parking spot already booked." });

            var booking = new Booking
            {
                UserId = user.UserId,
                LicensePlate = user.LicensePlate,
                ParkingSpotId = spot.Id,
                AccessCode = GenerateAccessCode(),
                //BookingCode = GenerateBookingCode(),
                BookTime = DateTime.UtcNow,
                IsActive = true
            };

            context.Bookings.Add(booking);

            spot.IsReserved = true;

            await context.SaveChangesAsync();

            await mqttService.PublishAsync("smart_parking/booking", booking);

            return Ok(new { Message = "Booking created successfully.", booking.BookingId, booking.AccessCode });
        }

        [HttpGet("available-spots")]
        public async Task<IActionResult> AvailableSpots()
        {
            var availableSpots = await context.ParkingSpots
                .Where(p => !p.IsOccupied && !p.IsReserved)
                .ToListAsync();

            return Ok(availableSpots);
        }

        [HttpGet("reservation/{userId}")]
        public async Task<IActionResult> GetReservationsByUser(string userId)
        {
            var reservations = await context.Bookings
                .Where(b => b.UserId == userId && b.IsActive)
                .ToListAsync();

            return Ok(reservations);
        }

        [HttpPost("cancel-reservation/{bookingCode}")]
        public async Task<IActionResult> CancelReservation(string accessCode)
        {
            if (string.IsNullOrWhiteSpace(accessCode))
                return BadRequest(new { Message = "Booking code is required." });

            var bookings = await context.Bookings
                .Where(b => b.AccessCode == accessCode && b.IsActive)
                .ToListAsync();

            if (!bookings.Any())
                return NotFound(new { Message = "No active reservation found with this booking code." });

            var spotIds = bookings.Select(b => b.ParkingSpotId).Distinct().ToArray();

            foreach (var b in bookings)
            {
                b.CancelTime = DateTime.UtcNow;
                b.IsActive = false;
            }

            var spots = await context.ParkingSpots
                .Where(s => spotIds.Contains(s.Id))
                .ToListAsync();

            foreach (var s in spots)
            {
                s.IsReserved = false;
            }

            await context.SaveChangesAsync();

            return Ok(new { Message = "Reservation cancelled successfully." });
        }

        private static string GenerateAccessCode() =>
            Random.Shared.Next(100_000, 1_000_000).ToString();

        private static string GenerateBookingCode() =>
            Guid.NewGuid().ToString("N")[..8];
    }
}

