using SmartParkingAssistant.Server.Models.DTOs;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SmartParkingAssistant.Server.Data;

namespace SmartParkingAssistant.Server.Services
{
    public class MqttBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly IMqttService _mqttService;

        public MqttBackgroundService(IServiceProvider serviceProvider, IMqttService mqttService)
        {
            _serviceProvider = serviceProvider;
            _mqttService = mqttService;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await _mqttService.ConnectAsync();

            await _mqttService.SubscribeAsync("smart_parking/entry", HandleEntryAsync);
            await _mqttService.SubscribeAsync("smart_parking/exit", HandleExitAsync);
            await _mqttService.SubscribeAsync("smart_parking/available", _ => HandleAvailabilityAsync());

            await Task.Delay(Timeout.Infinite, stoppingToken);
        }

        private async Task HandleEntryAsync(string message)
        {
            try
            {
                var request = JsonSerializer.Deserialize<EntryRequest>(message);
                if (string.IsNullOrEmpty(request?.AccessCode))
                {
                    await PublishResponseAsync("entry", false, "Invalid request: Missing access code");
                    return;
                }

                var accessCode = request.AccessCode.ToUpperInvariant();

                using var scope = _serviceProvider.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<SmartParkingAssistantDbContext>();

                var booking = await db.Bookings
                    .Include(b => b.ParkingSpot)
                    .FirstOrDefaultAsync(b => b.AccessCode == accessCode && b.IsActive);

                if (booking == null)
                {
                    await PublishResponseAsync("entry", false, "No active booking found");
                    return;
                }

                if (booking.ParkingSpot.IsOccupied)
                {
                    await PublishResponseAsync("entry", false, "Vehicle already parked");
                    return;
                }

                booking.StartTime = DateTime.UtcNow;
                booking.ParkingSpot.IsOccupied = true;
                await db.SaveChangesAsync();

                await PublishResponseAsync("entry", true, "Entry authorized", new
                {
                    booking.ParkingSpotId,
                    booking.UserId,
                    booking.AccessCode
                });
            }
            catch (Exception ex)
            {
                await PublishResponseAsync("entry", false, $"Error: {ex.Message}");
            }
        }

        private async Task HandleExitAsync(string message)
        {
            try
            {
                var accessCode = ExtractAccessCode(message)?.ToUpperInvariant();
                if (string.IsNullOrEmpty(accessCode))
                {
                    await PublishResponseAsync("exit", false, "Invalid request: Missing access code");
                    return;
                }

                using var scope = _serviceProvider.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<SmartParkingAssistantDbContext>();

                var booking = await db.Bookings
                    .Include(b => b.ParkingSpot)
                    .FirstOrDefaultAsync(b => b.AccessCode == accessCode && b.IsActive);

                if (booking == null)
                {
                    await PublishResponseAsync("exit", false, "No active booking found");
                    return;
                }

                booking.IsActive = false;
                booking.EndTime = DateTime.UtcNow;
                booking.ParkingSpot.IsOccupied = false;
                booking.ParkingSpot.IsReserved = false;
                await db.SaveChangesAsync();

                await PublishResponseAsync("exit", true, "Exit authorized", new
                {
                    booking.ParkingSpotId,
                    booking.UserId,
                    booking.AccessCode
                });
            }
            catch (Exception ex)
            {
                await PublishResponseAsync("exit", false, $"Error: {ex.Message}");
            }
        }

        private async Task HandleAvailabilityAsync()
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<SmartParkingAssistantDbContext>();
                var count = await db.ParkingSpots.CountAsync(p => !p.IsOccupied);

                await _mqttService.PublishAsync("smart_parking/response", new
                {
                    ResponseType = "available",
                    count
                });
            }
            catch (Exception ex)
            {
                await _mqttService.PublishAsync("smart_parking/response", new
                {
                    ResponseType = "available",
                    count = 0,
                    Message = $"Error: {ex.Message}"
                });
            }
        }

        private async Task PublishResponseAsync(string type, bool success, string message, object? data = null)
        {
            var response = new Dictionary<string, object>
            {
                ["ResponseType"] = type,
                ["Success"] = success,
                ["Message"] = message
            };

            if (data != null)
            {
                foreach (var prop in data.GetType().GetProperties())
                {
                    response[prop.Name] = prop.GetValue(data) ?? string.Empty;
                }
            }

            await _mqttService.PublishAsync("smart_parking/response", response);
        }

        private string? ExtractAccessCode(string payload)
        {
            try
            {
                var request = JsonSerializer.Deserialize<ExitRequest>(payload);
                return request?.AccessCode;
            }
            catch
            {
                var doc = JsonDocument.Parse(payload);
                if (doc.RootElement.TryGetProperty("code", out var element))
                {
                    return element.GetString();
                }
            }
            return null;
        }
    }
}
