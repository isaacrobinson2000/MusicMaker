// MUSIC GOES HERE:
const uint16_t PROGMEM Example[] = {
  0b0110001010000000, 0b0000000001100100, 0b1000000001100100, 0b0101111000000000, 0b0000000001100100, 
  0b0110000000000000, 0b0000000001100100, 0b0110001010000000, 0b0000000001100100, 0b1000000001100100, 
  0b0101111000000000, 0b0000000001100100, 0b0110000000000000, 0b0000000001100100, 0b0110001010000000, 
  0b0000000001100100, 0b1000000001100100, 0b0110010000000000, 0b0000000001100100, 0b0110000000000000, 
  0b0000000001100100, 0b0110001010000000, 0b0000000001100100, 0b1000000001100100, 0b0110010000000000, 
  0b0000000001100100, 0b0110000000000000, 0b0000000001100100, 0b0110001010000000, 0b0000000001100100, 
  0b1000000001100100, 0b0110000110000000, 0b0000000001100100, 0b0110011000000000, 0b0000000001100100, 
  0b0110001010000000, 0b0000000001100100, 0b1000000001100100, 0b0110000110000000, 0b0000000001100100, 
  0b0110011000000000, 0b0000000001100100, 0b0110001010000000, 0b0000000001100100, 0b1000000001100100, 
  0b0110000110000000, 0b0000000001100100, 0b0110011000000000, 0b0000000001100100, 0b0110001010000000, 
  0b0000000001100100, 0b1000000001100100, 0b0110000110000000, 0b0000000001100100, 0b0110011000000000, 
  0b0000000001100100
};
const size_t ExampleLen = sizeof(Example) / sizeof(uint16_t);
const float ExampleMillisPerTick = 1;

// The pin the piezoelectric buzzer is connected to.
const int PIEZO_PIN = 6;

// Pin the start/stop or reset music... Set to -1 to disable...
const int ON_PIN = 3;

// Enable/Disable external timing/syncing. Useful if trying to use multiple arduino's at once...
const bool SYNC_EXTERNAL = false;
// The update pin, if external syncing is on...
const int UPDATE_PIN = 2;

// Enable/Disable send a millisecond syncing signal.
const bool SEND_SYNC_SIGNAL = false;
// If sending syncing information is enabled, send it on this pin...
const int SEND_SYNC_PIN = 8;

// Set the selected song...
const auto &SELECTED_SONG = Example;
const auto &SELECTED_SONG_LENGTH = ExampleLen;
const auto &SELECTED_SONG_TICK_SPEED = ExampleMillisPerTick;

// Enable/Disable Debuging, which pin to read data in on...
const bool DEBUG = false;
const int DEBUG_READ_PIN = A3;

// END OF CONFIGURATION...

/*
 * MUSIC PLAYING CODE BELOW:
 */


int toFrequency(uint16_t midi_num) {
  return (int)(pow(2, (((double)midi_num / 128.0) - 69) / 12) * 440);
}

// Stash current state of the music player....
bool syncState = false;
size_t nextNote = 0;
unsigned long lastSyncSendSwitch = 0;
unsigned long lastNoteTime = 0;
unsigned long currentTime = 0;
float noteDuration = 0;

void setup() {
  // Setup code...
  if(SYNC_EXTERNAL) {
    // If syncing is set up, configure interrupt to update internal millis function...
    pinMode(UPDATE_PIN, INPUT);
    attachInterrupt(digitalPinToInterrupt(UPDATE_PIN), updateSync, CHANGE); 
  }
  // Configure output/on pin...
  pinMode(PIEZO_PIN, OUTPUT);
  if(SEND_SYNC_SIGNAL) pinMode(SEND_SYNC_PIN, OUTPUT);
  if(ON_PIN >= 0) pinMode(ON_PIN, INPUT_PULLUP);

  lastNoteTime = getTime();
  currentTime = getTime();

  if constexpr(DEBUG) {
    Serial.begin(9600);
    pinMode(DEBUG_READ_PIN, INPUT);
  }
}

// Grabs correct millisecond timing function based on config, and calls it...
unsigned long getTime() {
  if constexpr(SYNC_EXTERNAL) {
    return syncedMillis();
  } 
  else {
    return millis();
  }
}

const uint16_t DATA_MASK = 0b0011111111111111;

void loop() {
  // Loop code... Repeats forever...
  // Get the current time...
  currentTime = getTime();

  // If one millisecond has passed, toggle the sync pin if enabled...
  if(SEND_SYNC_SIGNAL && ((currentTime - lastSyncSendSwitch) >= 1)) {
    lastSyncSendSwitch = currentTime;
    syncState = !syncState;
    digitalWrite(SEND_SYNC_PIN, syncState);
  }
  
  // If on, keep playing, otherwise reset the song...
  if((SELECTED_SONG_LENGTH > 0) && ((ON_PIN < 0) || (digitalRead(ON_PIN) == HIGH))) {
    // If the time passed is equal to at least the note duration, play the next note
    if((currentTime - lastNoteTime) >= noteDuration) {
      // Read the next note.
      uint16_t noteData = (uint16_t *)pgm_read_word(&SELECTED_SONG[nextNote]);
      // Set lastNoteTime to the current time...
      lastNoteTime = currentTime;
      
      switch((noteData >> 14) & 0b11) {
        case 0b00:
          // Wait command, copy over the wait time...
          noteDuration = ((float)(noteData & DATA_MASK)) * SELECTED_SONG_TICK_SPEED;
          break;
        case 0b01:
          // Play command, push tone to buzzer pin, set duration to 0 so next instruction is executed immediately.
          tone(PIEZO_PIN, toFrequency(noteData & DATA_MASK));
          noteDuration = 0;
          break;
        case 0b10:
          // Rest command, stop tone playing, copy over the wait time...
          noTone(PIEZO_PIN);
          noteDuration = ((float)(noteData & DATA_MASK)) * SELECTED_SONG_TICK_SPEED;
          break;
        default:
          noteDuration = 0;
          break;
      }

      // Update nextNote to point to the next note in the song...
      nextNote = (nextNote + 1) % SELECTED_SONG_LENGTH;
    }
  }
  else {
    // Reset the music player to the begining...
    noTone(PIEZO_PIN);
    nextNote = 0;
    noteDuration = 0;
    lastNoteTime = currentTime;
  }

  if constexpr(DEBUG) {
    Serial.println(analogRead(DEBUG_READ_PIN));
  }
}

// Syncing interrupt if syncing is enabled...
volatile unsigned long mils = 0;

unsigned long syncedMillis() {
  return mils;
}

void updateSync() {
  mils++;
}
