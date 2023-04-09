  /// Define either TSTICKJOINT or SPARKFUN_ESP32_THING_PLUS
// #define TSTICKJOINT 1
//#define SPARKFUN_ESP32_THING_PLUS 1
// Define visual feedback
#define VISUAL_FEEDBACK
// Define libmapper
#define LIBMAPPER

#include "variants.h"

// #include <SPI.h>
#include <Wire.h>
#include <WiFi.h>
#include <cmath>
#include <mapper.h>
//#include "Filter.h"
#include <Adafruit_RGBLCDShield.h>
#include <utility/Adafruit_MCP23017.h>

#ifndef SPARKFUN_ESP32_THING_PLUS
#include <TinyPICO.h>
#endif

#include "haptics.h"

// For disabling power saving
#include "esp_wifi.h"

// --------  Wifi Credentials   ----------
/// Create a wifi_credentials.h file that contains the right values "..." for:
/// const char* SSID     = "...";
/// const char* PASSWORD = "...";
#include "wifi_credentials.h"


const int SEL_PIN = 0;

#ifdef TSTICKJOINT
const int SDA_PIN = 26;
const int SCL_PIN = 25;
#else
#ifdef SPARKFUN_ESP32_THING_PLUS
const int SDA_PIN = 23;
const int SCL_PIN = 22;
#else
const int SDA_PIN = 21;
const int SCL_PIN = 22;
#endif
#endif

// LCD properties
#ifdef VISUAL_FEEDBACK
  Adafruit_RGBLCDShield lcd = Adafruit_RGBLCDShield();
  #define OFF 0x0
  #define RED 0x1
  #define YELLOW 0x3
  #define GREEN 0x2
  #define TEAL 0x6
  #define BLUE 0x4
  #define VIOLET 0x5
  #define WHITE 0x7 
  int gui_state = 0;
  int max_gui_state = 3; //0 = haptic mode, 1 = angle, 2 = velocity, 3 = torque
  int old_gui_state = 0;
#endif

// Motor properties
int STATE = 6;
int OLD_VALUE = 9999;
int OLD_STATE = 4;
int MAX_MOTOR_STATES = 9;

// I2C variables
const uint8_t I2C_BUF_SIZE = 10;
const uint8_t CHECKSUMSIZE = 2;
uint8_t tx_data[I2C_BUF_SIZE+CHECKSUMSIZE];
uint8_t rx_data[I2C_BUF_SIZE+CHECKSUMSIZE];
uint16_t checksum_rx = 0;
uint16_t checksum_tx = 0;

// Timing variables
const uint32_t LIBMAPPER_POLL_RATE = 600000 ; // us
const uint32_t LIBMAPPER_UPDATE_RATE = 25000 ; // us
const uint32_t HAPTICS_UPDATE_RATE = 500 ; // 2 KHz
const uint32_t I2CUPDATE_FREQ = 400000; // high speed mode;
const uint32_t DEBOUNCE_TIME = 10000; // 10 ms
const uint32_t MAINTENANCE_RATE = 30000000; // 30 s
const uint32_t GUI_RATE = 66000; //  15 FPS

#ifndef SPARKFUN_ESP32_THING_PLUS
// Initialise the TinyPICO library
TinyPICO tp = TinyPICO();
#endif

// Initialize TorqueTuner
TorqueTuner knob;

// State flags
int connected = 0;
bool is_playing = true;

// Libmapper variables
mpr_sig in_sig_scale;
mpr_sig in_sig_stretch;
mpr_sig in_sig_mode;
mpr_sig in_sig_target_velocity;
mpr_sig in_sig_offset;
mpr_sig in_sig_damping;

mpr_sig out_sig_angle;
mpr_sig out_sig_velocity;
mpr_sig out_sig_trigger;
mpr_sig out_sig_speed;
mpr_sig out_sig_quant_angle;
mpr_sig out_sig_acceleration;
mpr_dev dev;

int pressure = 0;
int sel = 0;
int sel_min = 0;
int sel_max = 0;

// System variables
int err = 0;
int err_count = 0;
uint32_t last_time = 0;
uint32_t last_time_libmapper_poll = 0;
uint32_t last_time_libmapper_update = 0;
uint32_t last_time_errprint = 0;
uint32_t last_time_maintenance = 0;
uint32_t last_time_gui = 0;
uint32_t now = 0;

unsigned long time_tt;
unsigned long last_time_tt;
unsigned long latency;

unsigned long latencycal(unsigned long t, unsigned long init){
  return t - init;
}

uint16_t calcsum(uint8_t buf[], uint8_t length) {
  uint16_t val = 0;
  for (int k = 0; k < length; k++) {
    val += buf[k];
  }
  return val;
}

int init_wifi(const char* ssid, const char* password, int timeout_ms) {
  int time = millis();

  printf("Connecting to: %s \n", ssid);
  
  WiFi.begin(ssid, password);
  // printf("wifi state %d, %s, %s \n", WiFi.status(), ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    printf(".");
    if (millis() - time > timeout_ms) {
      printf(" Timeout waiting for connection");
      
      return 0;
    }
    delay(500);
  }
  IPAddress ip = WiFi.localIP();
  printf("\n Wifi Connected \n IP adress:  %u.%u.%u.%u", ip[0], ip[1], ip[2], ip[3]);
  return 1;
}

#ifdef VISUAL_FEEDBACK
void print_state(int cur_state) {
  lcd.setCursor(0,1);
  if (cur_state == 0) {
    lcd.print("CLICK");
  } 
  else if (cur_state == 1) {
    lcd.print("MAGNET");
  }
  else if (cur_state == 2) {
    lcd.print("NO RESISTANCE");
  }
  else if (cur_state == 3) {
    lcd.print("INERTIA");
  }  
  else if (cur_state == 4) {
    lcd.print("LINEAR SPRING");
  }
  else if (cur_state == 5) {
    lcd.print("EXP SPRING");
  }
  else if (cur_state == 6) {
    lcd.print("FREE");
  }
  else if (cur_state == 7) {
    lcd.print("SPIN");
  }
  else if (cur_state == 8) {
    lcd.print("VIBRATE");
  }
  else {
    lcd.print("Unknown State");
  }
}
#endif

int CHANGE_STATE(int cur_state, int max_state, int inc_flag) {
  int new_state = 0;
  if (inc_flag) {
    new_state = cur_state + 1;
  } else{
    new_state = cur_state - 1;
  }
  if (new_state > max_state) {
    new_state = 0;
  }
  if (new_state < 0) {
    new_state = max_state;
  }
  printf("New State %d\n",new_state);
  return new_state;
}

bool update_btn(const int pin) {
  static bool last_val;
  static bool has_changed;
  static int32_t last_change;
  // Read button pin
  int32_t now = esp_timer_get_time();
  bool val =  !digitalRead(pin);
  if (val != last_val) {
    last_val = val;
    last_change = now;
    has_changed = true;
  }

  // Debounce button and trigger on release
  if (has_changed && (now - last_change) > DEBOUNCE_TIME  && !val) {
    has_changed = false;
    return true;
  } else {
    return false;
  }

}

bool update_btn_lcd(uint8_t buttonPressed){
  static bool last_val;
  static bool has_changed;
  static int32_t last_change;
  // Read button pin
  int32_t now = esp_timer_get_time();
  bool val =  !buttonPressed;
  if (val != last_val) {
    last_val = val;
    last_change = now;
    has_changed = true;
  }

  // Debounce button and trigger on release
  if (has_changed && (now - last_change) > DEBOUNCE_TIME  && !val) {
    has_changed = false;
    return true;
  } else {
    return false;
  }

}


int read_param(float * param, uint8_t*  data, uint8_t length) {
  memcpy(param, data, length);
  if ( std::isnan(*param)) {
    return 1;
  } else {
    return 0;
  }
}

int receiveI2C(TorqueTuner * knob_) {
  Wire.requestFrom(8, I2C_BUF_SIZE + CHECKSUMSIZE);
  uint8_t k = 0;
  while (Wire.available()) {
    rx_data[k] = Wire.read();
    k++;
  }
  if (k != I2C_BUF_SIZE + CHECKSUMSIZE) { // check if all data is recieved
    //printf("Error in recieved data. Bytes missing :  %i\n", I2C_BUF_SIZE + CHECKSUMSIZE - k);
    return 1;
  }
  else {
    memcpy(&checksum_rx, rx_data + I2C_BUF_SIZE, 2); // read checksum
    if (checksum_rx != calcsum(rx_data, I2C_BUF_SIZE)) { // error in recieved data
      return 2;
    }
    else { // Succesfull recieve
      #ifdef MECHADUINO
      memcpy(&knob_->angle, rx_data, 2);
      #endif
      #ifdef MOTEUS
      memcpy(&knob_->angle, rx_data + 1, 2);
      #endif
      memcpy(&knob_->velocity, rx_data + 4, 4);
      return 0; //Return 0 if no error has occured
    }
  }
}

void sendI2C(TorqueTuner * knob_) {
  Wire.beginTransmission(8); // transmit to device #8
  memcpy(tx_data, &knob_->torque, 2);
  memcpy(tx_data + 2, &knob_->target_velocity, 4);
  memcpy(tx_data + 6, &knob_->active_mode->pid_mode, 1);
  checksum_tx = calcsum(tx_data, I2C_BUF_SIZE);
  memcpy(tx_data + I2C_BUF_SIZE , &checksum_tx, 2);
  // printf("angle_clip %d \n", knob_->angle_unclipped);
  printf("Torque,%d,Angle,%d,AngleOut,%d,Velocity,%f,VelocityOut,%f,Mode,%c,\n",knob_->torque,knob_->angle,knob_->velocity,knob_->velocity_out,knob_->active_mode->name);
  
  // printf("Angle,%d,",knob_->angle);
  // delay(40);
  int n = Wire.write(tx_data, I2C_BUF_SIZE + CHECKSUMSIZE);
  Wire.endTransmission();    // stop transmitting
}


void in_sig_scale_callback(mpr_sig sig, mpr_sig_evt evt, mpr_id inst, int length, mpr_type type, const void* value, mpr_time time) {
  knob.scale =  *((float*)value);
}

void in_sig_stretch_callback(mpr_sig sig, mpr_sig_evt evt, mpr_id inst, int length, mpr_type type, const void* value, mpr_time time) {
  knob.stretch =  *((float*)value);
}

void in_sig_offset_callback(mpr_sig sig, mpr_sig_evt evt, mpr_id inst, int length, mpr_type type, const void* value, mpr_time time) {
  knob.active_mode->offset = (*((float*)value));
  //printf("Offset: %f", knob.active_mode->offset);
}

void in_sig_mode_callback(mpr_sig sig, mpr_sig_evt evt, mpr_id inst, int length, mpr_type type, const void* value, mpr_time time) {
  knob.set_mode(*((int32_t*)value));
}

void in_sig_target_velocity_callback(mpr_sig sig, mpr_sig_evt evt, mpr_id inst, int length, mpr_type type, const void* value, mpr_time time) {
  knob.target_velocity = (*((float*)value));
  //printf("Target Velocity: %f", knob.target_velocity);
}

void in_sig_damping_callback(mpr_sig sig, mpr_sig_evt evt, mpr_id inst, int length, mpr_type type, const void* value, mpr_time time) {
  knob.active_mode->damping = (*((float*)value));
}


void init_mpr_sigs() {
  dev = mpr_dev_new("TorqueTuner", 0);

  // Init libmapper inputs
  float scale_min = -230;
  float scale_max = 230;
  in_sig_scale = mpr_sig_new(dev, MPR_DIR_IN, "Scale", 1, MPR_FLT, "Ncm", &scale_min, &scale_max, 0, in_sig_scale_callback, MPR_SIG_UPDATE);

  float angle_scale_min = 0;
  float angle_scale_max = 30;
  in_sig_stretch = mpr_sig_new(dev, MPR_DIR_IN, "Stretch", 1, MPR_FLT, "ratio", &angle_scale_min, &angle_scale_max, 0, in_sig_stretch_callback, MPR_SIG_UPDATE);

  int mode_min = 0;
  int mode_max = knob.num_modes - 1;
  sel_max = mode_max;
  in_sig_mode = mpr_sig_new(dev, MPR_DIR_IN, "Mode", 1, MPR_INT32, "mode", &mode_min, &mode_max, 0, in_sig_mode_callback, MPR_SIG_UPDATE);

  float vel_min = -700;
  float vel_max = 700;
  in_sig_target_velocity = mpr_sig_new(dev, MPR_DIR_IN, "TargetVelocity", 1, MPR_FLT, "Rpm", &vel_min, &vel_max, 0, in_sig_target_velocity_callback, MPR_SIG_UPDATE);

  float offset_min = -1800;
  float offset_max = 1800;
  in_sig_offset = mpr_sig_new(dev, MPR_DIR_IN, "Offset", 1, MPR_FLT, "degrees", &offset_min, &offset_max, 0, in_sig_offset_callback, MPR_SIG_UPDATE);

  float damping_min = -1;
  float damping_max = 1;
  in_sig_damping = mpr_sig_new(dev, MPR_DIR_IN, "Damping", 1, MPR_FLT, "ratio", &offset_min, &offset_max, 0, in_sig_damping_callback, MPR_SIG_UPDATE);

  // Init libmapper outputs
  int angle_min = 0;
  int angle_max = 3600;
  out_sig_angle = mpr_sig_new(dev, MPR_DIR_OUT, "Angle", 1, MPR_INT32, 0, &angle_min, &angle_max, 0, 0, 0);

  out_sig_velocity = mpr_sig_new(dev, MPR_DIR_OUT, "Velocity", 1, MPR_FLT, 0, &vel_min, &vel_max, 0, 0, 0);

  int trig_min = 0;
  int trig_max = 1;
  out_sig_trigger = mpr_sig_new(dev, MPR_DIR_OUT, "Trigger", 1, MPR_INT32, 0, &trig_min, &trig_max, 0, 0, 0);

  float speed_min = 0;
  float speed_max = vel_max;
  out_sig_speed = mpr_sig_new(dev, MPR_DIR_OUT, "Speed", 1, MPR_FLT, 0, &speed_min, &speed_max, 0, 0, 0);

  out_sig_quant_angle = mpr_sig_new(dev, MPR_DIR_OUT, "QuantAngle", 1, MPR_INT32, 0, &angle_min, &angle_max, 0, 0, 0);

  float acc_min = -100;
  float acc_max = 100;
  out_sig_acceleration = mpr_sig_new(dev, MPR_DIR_OUT, "Acceleration", 1, MPR_FLT, 0, &acc_min, &acc_max, 0, 0, 0);

  mpr_dev_poll(dev, 0);

}

void setup() {
  #ifdef VISUAL_FEEDBACK
  // Setup LCD
  lcd.begin(16,2);
  lcd.print("Booting up");
  #endif

  // Start serial
  Serial.begin(115200);
  #ifdef LIBMAPPER
  connected = init_wifi(SSID, PASSWORD, 30000);
  // lcd.clear();
  // lcd.setCursor(0,0);
  // lcd.print("Connected to Wifi");
  
  // if (connected) {
  init_mpr_sigs();
  // }
  esp_wifi_set_ps(WIFI_PS_NONE);
  #endif

  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.setClock(I2CUPDATE_FREQ); // Fast mode plus

  // while (Serial.available() > 0) {
  //   char received = Serial.read();
  //   inData.concat(received);

  //   // Process message when new line character is received
  //   if (received == '\n') {
  //       // Message is ready in inDate
  //   }
  // }

  // Make a reading for initilization
  int err = 1;
  #ifdef VISUAL_FEEDBACK
  // lcd.clear();
  // lcd.print("Waiting for I2C");
  #endif
  while (err) {
    err = receiveI2C(&knob);
    #ifdef VISUAL_FEEDBACK
    lcd.setCursor(0, 1);
    lcd.print(millis()/1000);
    #endif
  }
  knob.set_mode(STATE);

  // Show current haptic effect
  // #ifdef VISUAL_FEEDBACK
  // gui_state = 0; 
  // old_gui_state = 0;
  // lcd.clear();
  // lcd.setCursor(0,0);
  // lcd.print("Haptic Effect");
  // print_state(STATE);
  // #endif
  pinMode(SEL_PIN, INPUT);
  
}

void loop() {

  now = micros();

  if (Serial.available() > 0) {
    String inputString = Serial.readString(); // Read the string from the serial port
    // Serial.println("Received: " + inputString); // Print the received string to the serial monitor
    lcd.clear();
    lcd.setCursor(0, 1);
    lcd.printf("Received: %s", inputString);
    int changedMode;
    if(inputString == "c") changedMode = 0;
    else if(inputString == "m") changedMode = 1;
    else if(inputString == "w") changedMode = 2;
    else if(inputString == "i") changedMode = 3;
    else if(inputString == "l") changedMode = 4;
    else if(inputString == "e") changedMode = 5;
    else if(inputString == "f") changedMode = 6;
    else if(inputString == "s") changedMode = 7;
    else if(inputString == "v") changedMode = 8;
    else if(inputString == "u") knob.update_angle();
    // else if(inputString == "c") changedMode = 0;
    lcd.clear();
    lcd.setCursor(0, 1);
    print_state(changedMode);
    knob.set_mode(changedMode); //set mode to click
    delay(50);
  }

  // Update libmapper connections
  #ifdef LIBMAPPER
    if (now - last_time_libmapper_poll > LIBMAPPER_POLL_RATE) {
      mpr_dev_poll(dev, 0);
      last_time_libmapper_poll = now;
    }
  #endif

  // Check mode change
  #ifdef VISUAL_FEEDBACK
  uint8_t buttons = lcd.readButtons();
  bool button_pressed = update_btn_lcd(buttons);
  if (button_pressed) {
    if(STATE != 9 || knob.t_angles_index != 0){
        printf("set demo false\n");
        knob.set_demo(false);
      }

    if ((buttons & BUTTON_RIGHT)) { //(buttons & BUTTON_SELECT) || ***Removed***
      OLD_STATE = STATE;
      STATE = CHANGE_STATE(STATE,MAX_MOTOR_STATES,1);
      knob.set_mode(STATE);

    }
    if (buttons & BUTTON_LEFT) {
      OLD_STATE = STATE;
      STATE = CHANGE_STATE(STATE,MAX_MOTOR_STATES,0);
      knob.set_mode(STATE);
    }
    if (buttons & BUTTON_SELECT & STATE == 8){ //checks that we are in teacher mode to record values into the list, if not do set select an angle
      //insert code for appending the value to the list
      //check fits at maximum capacity, if so stops recording
      knob.t_angles[knob.t_angles_index] = knob.relative_angle();
      knob.t_angles_index = mod(knob.t_angles_index + 1, knob.t_angles_MAX_SIZE);
      // printf("angles: %d %d %d\n",knob.t_angles[0],knob.t_angles[1],knob.t_angles[2]);
      print_state(STATE);
    }
    if (buttons & BUTTON_SELECT & STATE == 9 ){ //input new angle
      // reset array if starting
      if (knob.t_angles_index == 0){
        for (size_t i = 0; i < 3; i++)
        {
          knob.performed_angles[i] = 0;
        }
      }

      knob.performed_angles[knob.t_angles_index] = knob.relative_angle();
      int16_t diff = abs(knob.t_angles[knob.t_angles_index]-knob.relative_angle());
      if (diff<knob.precision_tolerance){ // no point if above tolerance threshold
        knob.precision_score += static_cast<int>((knob.precision_tolerance-diff)*knob.max_score/(knob.precision_tolerance*knob.t_angles_MAX_SIZE)); // 0 diff is max points, average accross all angles
      }
  	// printf("start %d | current: %d | diff: %d | index: %d | targets: %d %d %d | angles: %d %d %d\n",knob.start_angle,knob.angle,diff,knob.t_angles_index,knob.t_angles[0],knob.t_angles[1],knob.t_angles[2],knob.performed_angles[0],knob.performed_angles[1],knob.performed_angles[2]);

      // printf("index %d | score %d",knob.t_angles_index,knob.score);
      knob.t_angles_index = mod(knob.t_angles_index + 1, knob.t_angles_MAX_SIZE);
      print_state(STATE);

      knob.compute_scores();
      // printf("overshot c %f s %d | time c %d s %d | precision d %d s %d | score %d\n", knob.overshot_count,knob.overshot_score,knob.time_count,knob.time_score,diff,knob.precision_score,knob.score);

      if (knob.t_angles_index == 0){ // if just looped back, score is ready
        // lcd.clear();
        // lcd.printf("Score: %4d/%4d",knob.score,knob.max_score*3);
        // lcd.setCursor(0,1);
        // lcd.printf("%4dO%4dT%4dP",knob.overshot_score,knob.time_score,knob.precision_score);
        knob.reset_scores();
      }
      

    }
//    if (buttons & BUTTON_UP){
//      old_gui_state = gui_state;
//      gui_state = CHANGE_STATE(gui_state,max_gui_state,1);
//      OLD_VALUE = 9999;
//    }
//    if (buttons & BUTTON_DOWN){
//      old_gui_state = gui_state;
//      gui_state = CHANGE_STATE(gui_state,max_gui_state,0);
//      OLD_VALUE = 9999;
//    }
  }
  #endif

  if (now - last_time > HAPTICS_UPDATE_RATE) {
    // Recieve Angle and velocity from servo
    err = receiveI2C(&knob);

    if (err) {
      //printf("i2c error \n");
    }
    else {
      
      // Update torque if valid angle measure is recieved.
      if (is_playing) {
        knob.update();
      } else { 
        // OBS: Consider not updating? assign last last value instead? //
        knob.torque = 0;
        knob.target_velocity = 0;
      }
      sendI2C(&knob);

    }
    last_time = now;
  }
  // int print_amount = 0;
  // if (knob.t_angles_index >= knob.t_angles_MAX_SIZE & print_amount != 1){
  //   int length_t = sizeof(knob.t_angles)/sizeof(knob.t_angles[0]);
  //   for (int i = 0; i < length_t; i++) {     
  //       printf("%d \n", knob.t_angles[i]);     
  //   }      
  //   print_amount++;
  // }
 #ifdef LIBMAPPER
 if (now - last_time_libmapper_update > LIBMAPPER_UPDATE_RATE) {

      // Update libmapper outputs
      mpr_sig_set_value(out_sig_angle, 0, 1, MPR_INT32, &knob.angle_out);
      mpr_sig_set_value(out_sig_velocity, 0, 1, MPR_FLT, &knob.velocity);
      mpr_sig_set_value(out_sig_trigger, 0, 1, MPR_INT32, &knob.trigger);
      float speed = abs(knob.velocity);
      mpr_sig_set_value(out_sig_speed, 0, 1, MPR_FLT, &speed);
      mpr_sig_set_value(out_sig_quant_angle, 0, 1, MPR_INT32, &knob.angle_discrete);
      mpr_sig_set_value(out_sig_acceleration, 0, 1, MPR_FLT, &knob.acceleration);

      mpr_dev_update_maps(dev);

   last_time_libmapper_update = now;
  }
  #endif

  /* ------------------------------*/
  /* -------- GUI update  ---------*/
  /* ------------------------------*/
  #ifdef VISUAL_FEEDBACK
  if (now - last_time_gui > GUI_RATE) {
    if ((gui_state == 0) && ((STATE != OLD_STATE) || (old_gui_state != gui_state))){
      if (old_gui_state != gui_state) {
        old_gui_state = 0;
      }
      if (STATE != OLD_STATE) {
        OLD_STATE = STATE;
      }
      // lcd.clear();
      // lcd.print("Haptic Effect");
      print_state(STATE); 
    }
//    if ((gui_state == 1) && (abs(OLD_VALUE - knob.angle_out)>2)){
//        lcd.clear();
//        lcd.setCursor(0,0);
//        lcd.print("Angle");
//        lcd.setCursor(0,1);
//        lcd.print(knob.angle_out/10);
//        OLD_VALUE = knob.angle_out;
//    }
//    if ((gui_state == 2) && (abs(OLD_VALUE - round(knob.velocity))>2)){
//        lcd.clear();
//        lcd.setCursor(0,0);
//        lcd.print("Velocity");
//        lcd.setCursor(0,1);
//        lcd.print(round(knob.velocity));
//        OLD_VALUE = round(knob.velocity);
//      }
//    if ((gui_state == 3) && (abs(OLD_VALUE - round(knob.torque))>2)){
//        lcd.clear();
//        lcd.setCursor(0,0);
//        lcd.print("Torque");
//        lcd.setCursor(0,1);
//        lcd.print(round(knob.torque));
//        OLD_VALUE = round(knob.torque);
//      }
    last_time_gui = now;
  }
  #endif


  /* ------------------------------*/
  /* -------- Maintenance ---------*/
  /* ------------------------------*/

// Reconnect to wifi if not connected
  #ifdef LIBMAPPER
  if (now - last_time_maintenance > MAINTENANCE_RATE) {
    if (WiFi.status() != WL_CONNECTED) {
      connected = init_wifi(SSID, PASSWORD, 0);
      delay(100);
      if (WiFi.status() == WL_CONNECTED) {
        init_mpr_sigs(); //
      }
    }
//    #ifndef SPARKFUN_ESP32_THING_PLUS
//    // Check LiPo battery voltage
//    float voltage = tp.GetBatteryVoltage();
//    if (voltage < 3.1) {
//      is_playing = false;
//      printf("Battery voltage is %f under 3.3 V, shotting down ...:\n", voltage );
//    }
//    printf("Battery voltage is: %f\n", voltage);
//    #endif
    last_time_maintenance = now;
  }
  #endif



}