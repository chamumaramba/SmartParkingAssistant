using System.Text.Json;
using HiveMQtt.Client;
using HiveMQtt.Client.Options;
using HiveMQtt.MQTT5.ReasonCodes;
using HiveMQtt.MQTT5.Types;

namespace SmartParkingAssistant.Server.Services
{
    public class MqttService : IMqttService, IDisposable
    {
        private readonly HiveMQClient _client;
        private bool _isConnected;

        public MqttService(HiveMQClientOptions options)
        {
            _client = new HiveMQClient(options);
        }

        public async Task<bool> ConnectAsync()
        {
            if (_isConnected) return true;

            try
            {
                var result = await _client.ConnectAsync();
                _isConnected = result.ReasonCode == ConnAckReasonCode.Success;
                Console.WriteLine(_isConnected ? "MQTT Connected" : $"MQTT Failed: {result}");
                return _isConnected;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"MQTT Connection Error: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> PublishAsync<T>(string topic, T payload)
        {
            if (!_isConnected && !await ConnectAsync())
                return false;

            try
            {
                var json = JsonSerializer.Serialize(payload);
                await _client.PublishAsync(topic, json, QualityOfService.AtLeastOnceDelivery);
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Publish Error: {ex.Message}");
                return false;
            }
        }

        public async Task SubscribeAsync(string topic, Func<string, Task> handler)
        {
            if (!_isConnected && !await ConnectAsync())
                throw new InvalidOperationException("Cannot subscribe: Not connected");

            await _client.SubscribeAsync(topic);

            _client.OnMessageReceived += async (_, args) =>
            {
                if (args.PublishMessage.Topic == topic)
                {
                    await handler(args.PublishMessage.PayloadAsString);
                }
            };

            Console.WriteLine($"Subscribed to: {topic}");
        }

        public void Dispose()
        {
            if (_isConnected)
            {
                _client.DisconnectAsync().Wait();
            }
            _client.Dispose();
            GC.SuppressFinalize(this);
        }
    }
}
