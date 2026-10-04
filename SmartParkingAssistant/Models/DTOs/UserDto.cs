using System.ComponentModel.DataAnnotations;

namespace SmartParkingAssistant.Server.Models.DTOs
{
    public class UserDto
    {
        [MaxLength(15)]
        public string? LicensePlate { get; set; }

        public string FirstName { get; set; }

        public string LastName { get; set; }

        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [DataType(DataType.Password)]
        public string Password { get; set; }

        [DataType(DataType.Password)]
        [Compare("Password")]
        public string ConfirmPassword { get; set; }
    }
}
