/*
 * A button controlled blinking light, connect the button on pin 11, and LED on pin 12
 */

// The pin the LED is connected to
const int LED_PIN = 12;

// The pin the button is connected to
const int BTN_PIN = 11;

// How long the blink delay is, how long does it take to go from light off to light on.
const int BLINK_DELAY = 500;


void setup() {
  // Setup code here, runs once:

  // Setup pin 12 as output, to make LED blink.
  pinMode(LED_PIN, OUTPUT);

  // Setup pin 11 as an input pin, to read button.
  pinMode(BTN_PIN, INPUT);
}

void loop() {
  // Main loop code...

  // If the button pin is high, or the button is pressed
  if(digitalRead(BTN_PIN) == HIGH) {
    // If the time is in the first half of 2 times the blink delay.
    if ((millis() % (BLINK_DELAY * 2)) < BLINK_DELAY) {
      // Turn on the light
      digitalWrite(LED_PIN, HIGH);
    }
    else {
      // If we are in the second half of this section, turn the light off
      digitalWrite(LED_PIN, LOW);
    }
  }
}
