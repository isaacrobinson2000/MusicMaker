/*
 * Makes a piezo buzzer fire on and off.
*/

// Pin of the piezo buzzer
const int PIEZO_PIN = 3;

// Frequency of the piezo buzzer when it fires
const int BUZZ_FREQ = 500;

// Delay between the firing of the peizo buzzer, in millis
const int BUZZ_DELAY = 1000;

void setup() {
  // Setup piezo pin as output...
  pinMode(PIEZO_PIN, OUTPUT);
}

void loop() {
  // Make the piezo pin fire
  tone(PIEZO_PIN, BUZZ_FREQ, BUZZ_DELAY);
  // Wait 2 times the delay, since tone does not wait for the given delay time.
  delay(BUZZ_DELAY * 2);
}
