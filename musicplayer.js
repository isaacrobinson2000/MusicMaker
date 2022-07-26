"use strict";

class TonePlayer {
    
    static AudioCtx = null;
    static MAX_UPDATE_WAIT = 100;
    
    constructor(trackObj, secondsPerTick) {
        if(TonePlayer.AudioCtx == null) TonePlayer.AudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        this.tracks = trackObj;
        this.secondsPerTick = secondsPerTick;
        this.millisPerTick = secondsPerTick * 1000;
        this.offset = 0; // Offset in ticks...
        this.currentIndexes = TonePlayer.initFrom(trackObj, (a, b) => 0);
        
        this.oscillators = TonePlayer.initFrom(trackObj, (a, b) => null);
        
        this._onUpdate = null;
        this.locations = TonePlayer.getTrackCumulators(this.tracks);
        this._length = Math.max(...Object.values(this.locations).map((a) => a[a.length - 1]));
        
        this._playing = false;
        this._timerId = null;
    }
    
    get length() {
        return this._length;
    }
    
    static genOsc(type = "square", freq = 440, volume = 1) {
        let osc = TonePlayer.AudioCtx.createOscillator();
        let gain = TonePlayer.AudioCtx.createGain();
        gain.gain.value = volume;
        osc.type = type;
        osc.connect(gain);
        gain.connect(TonePlayer.AudioCtx.destination);
        osc.frequency.setValueAtTime(freq, TonePlayer.AudioCtx.currentTime);
        return osc;
    }
    
    static initFrom(otherObj, initialValGen, initObj = {}) {
        for(let prop in otherObj) initObj[prop] = initialValGen(prop, otherObj[prop]);        
        return initObj;
    }
    
    static *objZip() {
        if(arguments.length < 1) throw "Error: Must pass at least 1 object.";
        
        let keysObj = arguments[0];
        
        for(let prop in keysObj) {
            let res = [prop];
            for(let arg of arguments) {
                res.push(arg[prop]);
            }
            yield res;
        }
    }
    
    static getTrackCumulators(tracks) {
        let cumSums = {};
        let lengths = {};
        
        for(let trackName in tracks) {
            let track = tracks[trackName];
            let cumSum = [];
            let sum = 0;
            
            if(track.notes == undefined) {
                cumSums[trackName] = [0];
                continue
            }
            
            for(let note of track.notes) {
                cumSum.push(sum);
                sum += (note[0] == "play")? note[2]: note[1];
            }
            
            cumSum.push(sum);
            cumSums[trackName] = cumSum;
        }
        
        return cumSums;
    }
    
    static binarySearch(locations, offset) {
        if(locations.length < 2) throw "Must have at least 2 elements.";
        
        let low = 0;
        let high = locations.length - 1;
        let mid = 0;
        
        while(low < high) {
            mid = Math.floor((low + high) / 2);
            let off2 = locations[mid];
            let off3 = locations[mid + 1];
            if(offset < off2) {
                high = mid - 1;
            }
            else if(offset >= off3){
                low = mid + 1;
            }
            else {
                return mid;
            }
        }
        
        return Math.max(Math.floor((high + low) / 2), 0);
    }
    
    set onUpdate(func) {
        this._onUpdate = func;
    }
    
    get onUpdate() {
        return this._onUpdate ?? (() => null);
    }
    
    play() {
        if(!this._playing) {
            this._playing = true;
            this._execStep();
        }
    }
    
    pause(evt = true) {
        if(this._playing) {
            this._playing = false;
            if(this._timerId != null) clearTimeout(this._timerId);
            // Kill all of the oscillators...
            for(let [name, osc] of TonePlayer.objZip(this.oscillators)) {
                if(osc != null) {
                    // Was a note playing? Kill the oscillator and move the index back...
                    osc.stop();
                    this.oscillators[name] = null;
                    this.currentIndexes[name]--;
                }
            }
            if(evt) this.onUpdate(this._playing, this.offset);
        }
    }
    
    stop() {
        this.pause();
        this.setLocation(0);
    }
    
    get playing() {
        return this._playing;
    }
    
    setLocation(offset) {
        offset = Number(offset);
        
        if((offset < 0) || (offset > this.length)) {
            throw "Error: offset not within track!";
        }
        
        let wasPlaying = this._playing;
        // Pause it....
        this.pause(false);
        // Update offset...
        this.offset = offset;
        // Update indexes... We use a binary search...
        for(let name in this.currentIndexes) {
            if(this.locations[name].length > 1)
                this.currentIndexes[name] = TonePlayer.binarySearch(this.locations[name], offset);
        }
        // All done... We now check if the code was playing. If so, begin playing again...
        if(wasPlaying) {
            this.play();
        }
        else {
            this.onUpdate(this._playing, this.offset);
        }
    }
    
    _execStep() {
        if(!this._playing) return;
        this.onUpdate(this._playing, this.offset);
        
        // Compute the time until the next note..
        let next = [];
        for(let [name, trackOff, osc, index] of TonePlayer.objZip(this.locations, this.oscillators, this.currentIndexes)) {
            if(index >= trackOff.length) {
                if(osc != null) {
                    osc.stop();
                    this.oscillators[name] = null;
                }
                continue;
            }
            next.push([name, trackOff[index] - this.offset]);
        }
        
        // We finished the song...
        if(next.length == 0) {
            this.pause();
            return;
        }
        
        // Sort by time...
        next.sort((a, b) => a[1] - b[1]);
        
        for(let [name, timeUntil] of next) {
            if(timeUntil <= 0) {
                let idx = this.currentIndexes[name];
                let track = this.tracks[name].notes ?? [];
                let vars = this.tracks[name].variables ?? {};
                let osc = this.oscillators[name];
                
                if(osc != null) {
                    osc.stop();
                    this.oscillators[name] = null;
                }
                
                if(idx < track.length) {
                    let cmd = track[idx];
                    
                    if(cmd[0] == "play") {
                        let osc = TonePlayer.genOsc(vars.WAVE_TYPE ?? "square", cmd[1] + (vars.FREQUENCY_SHIFT ?? 0), vars.VOLUME ?? 1);
                        osc.start();
                        this.oscillators[name] = osc;
                    }
                }
                
                this.currentIndexes[name] = idx + 1;
            }
            else {
                // Setup timeout for next note play...
                let step = Math.min(timeUntil, TonePlayer.MAX_UPDATE_WAIT / this.millisPerTick);
                this.offset += step;
                this._timerId = setTimeout(() => this._execStep(), step * this.millisPerTick);
                return;
            }
        }
        this._execStep();
    }
}
