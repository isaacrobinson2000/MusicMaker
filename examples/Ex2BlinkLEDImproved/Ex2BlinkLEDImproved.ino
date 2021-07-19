/*
 * Basic light blinking example....
 * turns light connected to pin 12 on and off every 1 second
 */

// The pin the LED is plugged into, change as you like
const int LED_PIN = 12;

// The delay between turning the light on and off in milliseconds, change as you like
const int DELAY_MILLIS = 1000;

// This is a variable without const, so it can change
int foo = 0;


void setup() {
  // This is setup code here, it runs once:
  
  // Tell the arduino we want to setup pin LED_PIN as output
  pinMode(LED_PIN, OUTPUT);

  // Now foo equals 1
  foo = 1;
}

void loop() {
  // This is the main loop, the code in here runs repeatedly until a new scetch is 
  // uploaded or arduino is turned off:

  // Send current through pin LED_PIN, turning LED on
  digitalWrite(LED_PIN, HIGH);
  
  // Delay 1000 milliseconds, or DELAY_MILLIS second
  delay(DELAY_MILLIS);

  // Stop sending current through pin LED_PIN shutting off LED
  digitalWrite(LED_PIN, LOW);

  // Delay DELAY_MILLIS second again
  delay(DELAY_MILLIS);

  // Now foo will count the amount of iterations
  foo = foo + 1;
}
