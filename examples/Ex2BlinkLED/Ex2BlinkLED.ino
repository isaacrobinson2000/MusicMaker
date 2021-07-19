/*
 * Basic light blinking example....
 * turns light connected to pin 12 on and off every 1 second
 */


void setup() {
  // This is setup code here, it runs once:
  
  // Tell the arduino we want to setup pin 12 as output
  pinMode(12, OUTPUT);
}

void loop() {
  // This is the main loop, the code in here runs repeatedly until a new sketch is 
  // uploaded or arduino is turned off:

  // Send current through pin 12, turning LED on
  digitalWrite(12, HIGH);
  
  // Delay 1000 milliseconds, or 1 second
  delay(1000);

  // Stop sending current through pin 12 shutting off LED
  digitalWrite(12, LOW);

  // Delay 1 second again
  delay(1000);
}
