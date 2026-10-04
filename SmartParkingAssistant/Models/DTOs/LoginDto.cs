using System.ComponentModel.DataAnnotations;

namespace SmartParkingAssistant.Server.Models.DTOs
{
    public class LoginDto
    {
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [DataType(DataType.Password)]
        public string Password { get; set; }
    }
}
