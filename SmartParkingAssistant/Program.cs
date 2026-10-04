using HiveMQtt.Client;
using HiveMQtt.Client.Options;
using Microsoft.EntityFrameworkCore;
using SmartParkingAssistant.Server.Data;
using SmartParkingAssistant.Server.Services;
using System.Security; // Add this at the top with other using statements

var builder = WebApplication.CreateBuilder(args);

    
var mqttOptions = new HiveMQClientOptions
{
    Host = "534ca5638fc8471581505031cbac2238.s1.eu.hivemq.cloud",
    Port = 8883,
    UseTLS = true,
    UserName = "chamumaramba",
    Password = "Tapejosh@86"

};

// Add services to the container.
builder.Services.AddDbContext<SmartParkingAssistantDbContext>(options =>
{
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"));
});

builder.Services.AddSingleton(mqttOptions);
builder.Services.AddSingleton<IMqttService, MqttService>();
builder.Services.AddHostedService<MqttBackgroundService>();
builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins(
                // frontend dev server - include exact scheme + port
                "http://localhost:58778",
                // other dev or hosting origins if needed (include scheme)
                "https://localhost:58778",
                "https://localhost:7201",
                "http://localhost:5073",
                "https://localhost:5073",
                "https://localhost:3000"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
