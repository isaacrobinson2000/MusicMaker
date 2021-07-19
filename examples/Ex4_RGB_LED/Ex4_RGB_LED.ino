/*
 * Program randomly changes the color of a RGB LED.
*/

// Ports for the red, green, and blue pins of the RGB LED
const int LED_BLUE = 11;
const int LED_GREEN = 9;
const int LED_RED = 10;

// Delay of the random color switch, in milliseconds 
const int DELAY = 5000;

void setup() {
  // Setup all LED pins as output
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_BLUE, OUTPUT);
}

void loop() {
  // Assign the RGB LED a random red value between 0 and 255.
  analogWrite(LED_RED, random(0, 255));
  // Assign the RGB LED a random green value between 0 and 255.
  analogWrite(LED_GREEN, random(0, 255));
  // Assign the RGB LED a random blue value between 0 and 255.
  analogWrite(LED_BLUE, random(0, 255));

  // Wait 5 seconds...
  delay(DELAY);
}
