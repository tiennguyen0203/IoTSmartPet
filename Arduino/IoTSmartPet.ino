#include <WiFi.h>
#include "HX711.h"
#include <ESP32Servo.h>
#include <LiquidCrystal_I2C.h>
#include <FirebaseESP32.h>
#include "addons/TokenHelper.h"
#include <WiFiManager.h>

// Provide the RTDB payload printing info and other helper functions.
#include <addons/RTDBHelper.h>

#define DATABASE_URL "https://iotpet-abc5e-default-rtdb.asia-southeast1.firebasedatabase.app/"
#define WEB_API_KEY "AIzaSyA6-firUe48Bh1Y-q-cwjVMng98e35xu7c"

#define LOADCELL_DT_PIN 17
#define LOADCELL_SCK_PIN 16
#define PIN_SG90 14 

#define TRIGGER_PIN 32

#define WATER_LEVEL_PIN 33


#define SERVO_PIN 26 
#define PUMP_PIN 27

#define CALIBRATION_FACTOR 800

/* 3. Define the Firebase Data object */
FirebaseData fbdo;

/* 4, Define the FirebaseAuth data for authentication data */
FirebaseAuth auth;

/* Define the FirebaseConfig data for config data */
FirebaseConfig config;

Servo sg90;

HX711 scale;

LiquidCrystal_I2C lcd(0x27, 16, 2);

int pumpState=0,feedState=0;
long waterLevel=0,foodWeight=0, waterLevelConverted = 0;

int timeout = 120;

// Replace with your network credentials
const char* ssid = "TIEN";
const char* password = "66668888";

// Current time
unsigned long currentTime = millis();
// Previous time
unsigned long previousTime = 0; 
// Define timeout time in milliseconds (example: 2000ms = 2s)
const long timeoutTime = 2000;
long read_loadcell;

bool signupOK = false;

void controlServo(){
    for (int pos = 0; pos <= 60; pos += 1) {
    sg90.write(pos);
    delay(20);
  }
  delay(2000);
 // Rotation from 180° to 0
  for (int pos = 60; pos >= 0; pos -= 1) {
    sg90.write(pos);
    delay(20);
  }
}

void setup() {
  WiFi.mode(WIFI_STA); // explicitly set mode, esp defaults to STA+AP  
  lcd.init();
  lcd.backlight();
  lcd.print("Smart Container");
  lcd.setCursor(0, 1);
  lcd.print("");
  delay(500);
  lcd.setCursor(0, 0);
  lcd.print("                ");
  lcd.setCursor(0, 1);
  lcd.print("                ");

  Serial.begin(115200);
  pinMode(TRIGGER_PIN, INPUT_PULLUP);
  // Initialize the output variables as outputs
  scale.begin(LOADCELL_DT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(CALIBRATION_FACTOR);
  scale.tare(); 

  //Sevor setup
  sg90.setPeriodHertz(50); // PWM frequency for SG90
  sg90.attach(PIN_SG90, 500, 2400); // Minimum and maximum pulse width (in µs) to go from 0° to 180

  //
  pinMode(SERVO_PIN, OUTPUT);
  pinMode(PUMP_PIN, OUTPUT);
  // Set outputs to LOW
  digitalWrite(SERVO_PIN, LOW);
  digitalWrite(PUMP_PIN, LOW);

  // Connect to Wi-Fi network with SSID and password
  // Serial.print("Connecting to ");
  // Serial.println(ssid);
  // WiFi.begin(ssid, password);
  // while (WiFi.status() != WL_CONNECTED) {
  //   delay(500);
  //   Serial.print(".");
  // }
  // // Print local IP address and start web server
  // Serial.println("");
  // Serial.println("WiFi connected.");
  // Serial.println("IP address: ");
  // Serial.println(WiFi.localIP());
  
  
}

void loop(){

  //Wifi config

  if ( digitalRead(TRIGGER_PIN) == LOW) {
    WiFiManager wm;    

    //reset settings - for testing
    wm.resetSettings();
  
    // set configportal timeout
    wm.setConfigPortalTimeout(timeout);

    if (!wm.startConfigPortal("Smart Pet Container")) {
      Serial.println("failed to connect and hit timeout");
      delay(3000);
      //reset and try again, or maybe put it to deep sleep
      ESP.restart();
      delay(5000);
    }

    //if you get here you have connected to the WiFi
    Serial.println("Connected to Wifi");

    Serial.printf("Firebase Client v%s\n\n", FIREBASE_CLIENT_VERSION);
  config.database_url = DATABASE_URL;
  config.api_key = WEB_API_KEY;
   // Comment or pass false value when WiFi reconnection will control by your code or third party library e.g. WiFiManager
    Firebase.reconnectNetwork(true);

    // Since v4.4.x, BearSSL engine was used, the SSL buffer need to be set.
    // Large data transmission may require larger RX buffer, otherwise connection issue or data read time out can be occurred.
    fbdo.setBSSLBufferSize(4096 /* Rx buffer size in bytes from 512 - 16384 */, 1024 /* Tx buffer size in bytes from 512 - 16384 */);

    /* Initialize the library with the Firebase authen and config */
    if (Firebase.signUp(&config, &auth, "", ""))
    {
        Serial.println("ok");
        signupOK = true;

        /** if the database rules were set as in the example "EmailPassword.ino"
         * This new user can be access the following location.
         *
         * "/UserData/<user uid>"
         *
         * The new user UID or <user uid> can be taken from auth.token.uid
         */
    }
    else
        Serial.printf("%s\n", config.signer.signupError.message.c_str());
  config.token_status_callback = tokenStatusCallback; // see addons/TokenHelper.h
  Serial.println("begin");
    Firebase.begin(&config, &auth);
    Serial.println("Connected to Firebase !!!");

  }
  //Data

  if(scale.is_ready()){ //đọc cân nặng đồ ăn
    read_loadcell = round(scale.get_units(10));
    foodWeight = read_loadcell;
    Serial.print("Weight: ");
    Serial.println(foodWeight);
  } else{ 
    Serial.println("HX711 not found");
  }

  waterLevel = analogRead(WATER_LEVEL_PIN); //đọc mực nước
  water
  Serial.print("Water: ");
  Serial.println(waterLevel);

  lcd.setCursor(0,0); //in khối lượng đồ ăn ra LCD
  lcd.print("Weight: ");
  lcd.setCursor(8,0);
  lcd.print("        ");
  lcd.setCursor(8,0);
  lcd.print(foodWeight);

  lcd.setCursor(0,1); //in mực nước ra LCD
  lcd.print("Water: ");
  lcd.setCursor(7,1);
  lcd.print("        ");
  lcd.setCursor(7,1);
  lcd.print(waterLevel);
  if (Firebase.getInt(fbdo, "/FbPumpState")) {

      if (fbdo.dataTypeEnum() == firebase_rtdb_data_type_integer) {
        pumpState = fbdo.to<int>();
    }

  } else {
    Serial.println(fbdo.errorReason());
  }

  postFoodWeight(); //gửi giá trị cân nặng đồ ăn lên firebase
  postWaterLevel(); //gửi mực nước lên Firebase

  if(pumpState == 1){ //nếu trạng thái bơm là 1 (on) thì bật bơm 2s rồi tắt xong cập nhật trạng thái bơm lên firebase 
    turnOnThePump(); //bật bơm
    delay(3000); //2s
    turnOffThePump(); //tắt bơm
    pumpState=0;
    postPumpState(); //update trạng thái bơm lên firebase
  }

  if (Firebase.getInt(fbdo, "/FbFeedState")) {

      if (fbdo.dataTypeEnum() == firebase_rtdb_data_type_integer) {
        feedState = fbdo.to<int>();
    }

  } else {
    Serial.println(fbdo.errorReason());
  }

  if(feedState==1){ //nếu trạng thái cho ăn là 1 (on) thì nhả đồ ăn xong cập nhật trạng thái cho ăn lên firebase 
    doFeedFunction(); //nhả đồ ăn
    feedState=0;
    postFeedState(); //update trạng thái cho ăn lên firebase
  }

}


void postPumpState(){//update trạng thái bơm lên Firebase
  Firebase.setInt(fbdo, "/FbPumpState", pumpState); 
}

void postFeedState(){//update trạng thái cho ăn lên Firebase
  Firebase.setInt(fbdo, "/FbFeedState", feedState); 
}

void postFoodWeight(){//gửi dữ liệu khối lượng đồ ăn lên Firebase
  Firebase.setInt(fbdo, "/FbFoodWeight", foodWeight); 
}

void postWaterLevel(){//gửi dữ liệu mực nước lên firebase
  Firebase.setInt(fbdo, "/FbWaterLevel", waterLevel); 
}

void doFeedFunction(){ //nhả một phần đồ ăn ra rồi đóng lại
  controlServo();    
}

void turnOnThePump(){ //bật bơm
  digitalWrite(PUMP_PIN, HIGH);
  // Serial.println("Bat Bom");
}

void turnOffThePump(){ //tắt bơm
  digitalWrite(PUMP_PIN, LOW);
  // Serial.println("Tat Bom");
}