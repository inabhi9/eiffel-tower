#include <Preferences.h>
#include <WiFi.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <WebServer.h>


#define LED_BUILTIN 8             // Internal LED pin is 8 as per schematic
#define DEFAULT_HOUR_START 18
#define DEFAULT_HOUR_STOP 22
#define DEFAULT_DURATION_MIN 1
#define DEFAULT_TZ_OFFSET 3600
#define DEFAULT_BLINK_MODE 1

const char* HOSTNAME = "eiffel-tower";
const char* PREF_HOUR_START_KEY = "start_hour";
const char* PREF_HOUR_STOP_KEY = "stop_hour";
const char* PREF_ON_DURATION_KEY = "on_duration";
const char* PREF_TZ_OFFSET = "tz_offset";
// Controls if blinking should happen automatically based on time
// 1 = auto, 2 = manual
const char* PREF_BLINK_MODE = "mode";

// Replace with your network credentials
const char* ssid = "xxxxx";
const char* password = "xxxxx";

WebServer server(80);
Preferences prefConfig;

// Define NTP Client to get time
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, 3600);  // 3600 = GMT+1

bool forceBlink = false;

// the setup function runs once when you press reset or power the board
void setup() {
  prefConfig.begin("config", false); 

  Serial.begin(9600);

  connectWifi();

  // initialize digital pin LED_BUILTIN as an output.
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);  // off, led-on

  timeClient.setTimeOffset(prefConfig.getInt(PREF_TZ_OFFSET, DEFAULT_TZ_OFFSET));
  timeClient.begin();

  server.enableCORS();
  server.on(F("/config"), []() {
    if (server.hasArg("name")){
      int value = 0;

      const String _name_str = server.arg("name");
      char name[_name_str.length()];
      server.arg("name").toCharArray(name, _name_str.length() + 1);

      if (strcmp(name, PREF_HOUR_START_KEY) == 0) {
        value = prefConfig.getInt(name, DEFAULT_HOUR_START);
      } else if (strcmp(name, PREF_HOUR_STOP_KEY) == 0) {
        value = prefConfig.getInt(name, DEFAULT_HOUR_STOP);
      } else if (strcmp(name, PREF_ON_DURATION_KEY) == 0) {
        value = prefConfig.getInt(name, DEFAULT_DURATION_MIN);
      } else if (strcmp(name, PREF_TZ_OFFSET) == 0) {
        value = prefConfig.getInt(name, DEFAULT_TZ_OFFSET);
      } else if (strcmp(name, PREF_BLINK_MODE) == 0) {
        value = prefConfig.getInt(name, DEFAULT_BLINK_MODE);
      } else {
        server.send(200, "text/plain", "nok! name = " + String(name));
        return;
      }
 
      if (server.hasArg("value")) {
          value = server.arg("value").toInt();
          prefConfig.putInt(name, value);

          timeClient.setTimeOffset(prefConfig.getInt(PREF_TZ_OFFSET, DEFAULT_TZ_OFFSET));
      }
      Serial.println(name);
      Serial.println(value);
      server.send(200, "text/plain", "ok! " + String(name) + "=" + value);
    } else {
      server.send(200, "text/plain", "ok!");
    }
  });

  server.on(F("/blink"), []() {
    forceBlink = true;
    server.send(200, "text/plain", "ok!");
  });

  server.begin();
}


unsigned long __blink_started_millis = 0;
int __on_duration = 10000;
bool startBlinkCycle = false;
void cycleBlinkIfDue() {
  if (startBlinkCycle && __blink_started_millis == 0) {
    __blink_started_millis = millis();
    __on_duration = prefConfig.getInt(PREF_ON_DURATION_KEY, DEFAULT_DURATION_MIN) * 60 * 1000;
    Serial.println("Effile Light Blink.");
    digitalWrite(LED_BUILTIN, HIGH);  // ON, led-off
  }

  if (millis() - __blink_started_millis >= __on_duration) {
      __blink_started_millis = 0;
      startBlinkCycle = false;

      digitalWrite(LED_BUILTIN, LOW);   // OFF, led-on
      Serial.println("Effile Light STOP.");
  }
}

void scheduleBlinkWheDue() {
  int nowMin = timeClient.getMinutes();
  int nowHr = timeClient.getHours();

  startBlinkCycle = nowHr >= prefConfig.getInt(PREF_HOUR_START_KEY, DEFAULT_HOUR_START) && nowHr <= prefConfig.getInt(PREF_HOUR_STOP_KEY, DEFAULT_HOUR_STOP)
      && nowMin == 0
      && prefConfig.getInt(PREF_BLINK_MODE, DEFAULT_BLINK_MODE) > 0;

  if (forceBlink) {
    startBlinkCycle = true;
    forceBlink = false;
  }
}

// the loop function runs over and over again forever
void loop() {
  server.handleClient();
  
  timeClient.update();

  cycleBlinkIfDue();

  scheduleBlinkWheDue();

  delay(1);
}

void connectWifi() {
  Serial.printf("Connecting to %s \n", ssid);
  WiFi.setHostname(HOSTNAME);
  WiFi.begin(ssid, password);

  // WIFI_POWER_8_5dBm makes the ESP32-C3 Supermini boards from Aliexpress more reliable on wifi
  // https://www.reddit.com/r/esp32/comments/1fqx2ts/wifi_power_8_5dbm_makes_the_esp32c3_supermini/
  WiFi.setTxPower(WIFI_POWER_8_5dBm);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  // Print local IP address and start web server
  Serial.println("");
  Serial.print("WiFi connected. IP address: ");
  Serial.println(WiFi.localIP());
}
