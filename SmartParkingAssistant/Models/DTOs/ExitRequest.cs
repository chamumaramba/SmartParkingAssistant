using System.Text.Json.Serialization;

namespace SmartParkingAssistant.Server.Models.DTOs
{
    public class ExitRequest
    {
        [JsonPropertyName("code")]
        public string? AccessCode { get; set; }

        [JsonPropertyName("parkingSpotId")]
        public int ParkingSpotId { get; set; }
    }
}
