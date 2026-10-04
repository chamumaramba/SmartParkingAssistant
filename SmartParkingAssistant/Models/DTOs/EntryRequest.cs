using System.Text.Json.Serialization;

namespace SmartParkingAssistant.Server.Models.DTOs
{
    public class EntryRequest
    {
        [JsonPropertyName("code")]
        public string? AccessCode { get; set; }

        [JsonPropertyName("isEntry")]
        public bool IsEntry { get; set; }
    }
}
