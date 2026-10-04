#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include <PubSubClient.h>
#include <Keypad.h>
#include <LiquidCrystal_I2C.h>

// Hardware
#define SERVO_PIN 32
#define LED_RED 14
#define LED_GREEN 12
const int rgbPins[] = { 13, 27, 23 };

LiquidCrystal_I2C lcd(0x27, 20, 4);
Servo gateServo;

// Keypad
const uint8_t ROWS = 4, COLS = 4;
char keys[ROWS][COLS] = {
    {'1', '2', '3', 'A'},
    {'4', '5', '6', 'B'},
    {'7', '8', '9', 'C'},
    {'*', '0', '#', 'D'}};
uint8_t rowPins[ROWS] = {19, 18, 5, 17};
uint8_t colPins[COLS] = {16, 33, 25, 26};
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

// MQTT
WiFiClientSecure espClient;
PubSubClient mqtt(espClient);
const char *MQTT_SERVER = "534ca5638fc8471581505031cbac2238.s1.eu.hivemq.cloud";
const char *MQTT_USER = "chamumaramba";
const char *MQTT_PASS = "Tapejosh@86";

// State
String screen = "menu";
String code = "";
bool isEntry = true;
unsigned long lastMqttAttempt = 0;
const unsigned long MQTT_RECONNECT_INTERVAL = 5000;

void setRGB(bool red, bool green, bool blue);

void showMenu()
{
  screen = "menu";
  code = "";

  lcd.clear();
  lcd.setCursor(2, 0);
  lcd.print("SMART PARKING");
  lcd.setCursor(0, 1);
  lcd.print("1=Entry   2=Exit");
  lcd.setCursor(0, 3);
  lcd.print("Select mode");

  digitalWrite(LED_RED, HIGH);
  digitalWrite(LED_GREEN, LOW);
}

void updateCodeDisplay()
{
  lcd.setCursor(0, 1);
  lcd.print("Code: ");
  lcd.setCursor(6, 1);

  for (int i = 0; i < 6; i++)
  {
    if (i < code.length())
      lcd.print("*");
    else
      lcd.print("_");
  }
}

void showCodeEntry()
{
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(isEntry ? "ENTRY CODE" : "EXIT CODE");
  lcd.setCursor(0, 2);
  lcd.print("#Send *Clear D=Back");
  updateCodeDisplay();
}

void sendCode()
{
  if (!mqtt.connected())
  {
    lcd.setCursor(0, 3);
    lcd.print("Offline: D=Menu");
    return;
  }

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Checking access...");

  JsonDocument doc;
  doc["code"] = code;
  doc["isEntry"] = isEntry;

  char buffer[128];
  serializeJson(doc, buffer);
  if (!mqtt.publish(isEntry ? "smart_parking/entry" : "smart_parking/exit", buffer))
  {
    showCodeEntry();
    lcd.setCursor(0, 3);
    lcd.print("Send failed; retry");
  }
}

void handleMqttMessage(char *topic, byte *payload, unsigned int length)
{
  JsonDocument doc;
  deserializeJson(doc, payload, length);

  if (doc["Success"])
  {
    // Access granted
    lcd.clear();

    if (isEntry)
    {
      lcd.setCursor(2, 0);
      lcd.print("ACCESS GRANTED");
      lcd.setCursor(0, 1);
      lcd.print("Gate opening");
      lcd.setCursor(0, 2);
      lcd.print("Spot: ");
      lcd.print((int)doc["ParkingSpotId"]);
    }
    else
    {
      lcd.setCursor(2, 0);
      lcd.print("EXIT OK");
      lcd.setCursor(0, 1);
      lcd.print("Thank you!");
      lcd.setCursor(0, 2);
      lcd.print("Drive safely");
    }
    setRGB(0, 1, 0);
    gateServo.write(180);
    delay(5000);
    gateServo.write(90);
    setRGB(0, 0, 1);
    delay(1500);
  }
  else
  {
    // Access denied
    lcd.clear();
    lcd.setCursor(2, 0);
    lcd.print("ACCESS DENIED");
    lcd.setCursor(0, 1);
    lcd.print(doc["Message"] | "Try again");

    for (int i = 0; i < 3; i++)
    {
      setRGB(1, 0, 0);
      delay(1000);
      setRGB(0, 0, 0);
      delay(1000);
    }
    delay(1000);
    setRGB(0, 0, 1);
  }

  showMenu();
}

// Helper function to control RGB LED
void setRGB(bool red, bool green, bool blue)
{
    digitalWrite(rgbPins[0], red);
    digitalWrite(rgbPins[1], green);
    digitalWrite(rgbPins[2], blue);
}

void setup()
{
  Serial.begin(115200);

  lcd.init();
  lcd.backlight();
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  digitalWrite(LED_RED, HIGH);
  for( int i=0; i<3; i++)
    pinMode( rgbPins[i], OUTPUT);
  setRGB(0, 0, 1);

  gateServo.attach(SERVO_PIN);
  gateServo.write(90);

  lcd.print("Connecting WiFi...");
  WiFi.begin("Wokwi-GUEST", "");
  while (WiFi.status() != WL_CONNECTED) delay(100);

  espClient.setInsecure();
  mqtt.setSocketTimeout(1);
  mqtt.setServer(MQTT_SERVER, 8883);
  mqtt.setCallback(handleMqttMessage);

  showMenu();
}

void loop()
{
  char key = keypad.getKey();
  if (key && screen == "menu")
  {
    if (key == '1')
    {
      isEntry = true;
      screen = "entry";
      showCodeEntry();
    }
    else if (key == '2')
    {
      isEntry = false;
      screen = "exit";
      showCodeEntry();
    }
  }
  else if (key)
  {
    if (key == '#' && code.length() > 0)
    {
      sendCode();
    }
    else if (key == 'D')
    {
      showMenu();
    }
    else if (key == '*')
    {
      code = "";
      updateCodeDisplay();
    }
    else if (key >= '0' && key <= '9' && code.length() < 6)
    {
      code += key;
      updateCodeDisplay();
    }
  }

  if (mqtt.connected())
  {
    mqtt.loop();
  }
  else if (lastMqttAttempt == 0 || millis() - lastMqttAttempt >= MQTT_RECONNECT_INTERVAL)
  {
    lastMqttAttempt = millis();
    if (mqtt.connect("esp32_parking", MQTT_USER, MQTT_PASS))
    {
      mqtt.subscribe("smart_parking/response");
    }
  }
}