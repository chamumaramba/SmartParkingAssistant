namespace SmartParkingAssistant.Server.Services
{
    public interface IMqttService
    {
        Task<bool> ConnectAsync();
        Task<bool> PublishAsync<T>(string topic, T payload);
        Task SubscribeAsync(string topic, Func<string, Task> handler);
    }
}
