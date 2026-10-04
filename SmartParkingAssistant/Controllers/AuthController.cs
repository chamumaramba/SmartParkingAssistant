using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartParkingAssistant.Server.Data;
using SmartParkingAssistant.Server.Models.DTOs;
using SmartParkingAssistant.Server.Models.Entities;
using BC = BCrypt.Net.BCrypt;

namespace SmartParkingAssistant.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController(SmartParkingAssistantDbContext context) : ControllerBase
    {
        private readonly SmartParkingAssistantDbContext _context = context;

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] UserDto user)
        {
            var licensePlate = await _context.Users.FirstOrDefaultAsync(lp => lp.LicensePlate == user.LicensePlate);
            if (licensePlate != null)
            {
                return BadRequest(new { Message = "License plate already exists." });
            }

            string hashedPassword = BC.HashPassword(user.Password);
            var newUser = new User
            {
                LicensePlate = user.LicensePlate,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                PasswordHash = hashedPassword
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "User registered successfully." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto user)
        {

            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == user.Email);
            if (existingUser == null)
            {
                return Unauthorized(new { Message = "Invalid email or password." });
            }

            var isPasswordValid = BC.Verify(user.Password, existingUser.PasswordHash);
            if (!isPasswordValid)
            {
                return Unauthorized(new { Message = "Invalid email or password." });
            }
            return Ok(new
            {
                Message = "Login successful.",
                existingUser.UserId,
                existingUser.FirstName,
                existingUser.LastName,
                existingUser.Email
            });
        }
    }
}
