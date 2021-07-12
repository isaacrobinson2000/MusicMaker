"use strict";

function* enumerate(iterable) {
    let i = 0;
    
    for(let item in iterable) {
        yield [i, item];
        i++;
    }
}

class TonePlayer {
    
    static AudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    constructor(trackObj, secondsPerTick) {
        this.tracks = trackObj;
        this.secondsPerTick = secondsPerTick;
        this.millisPerTick = secondsPerTick * 1000;
        this.offset = 0; // Offset in ticks...
        this.currentIndexes = TonePlayer.initFrom(trackObj, (a, b) => 0);
        
        this.oscillators = TonePlayer.initFrom(trackObj, (a, b) => {
            let osc = TonePlayer.AudioCtx.createOscillator()
            osc.type = "square";
            osc.connect(TonePlayer.AudioCtx.destination);
            return osc;
        });
        
        this._onUpdate = null;
        this.locations = TonePlayer.getTrackCumulators(lengths);
        this._length = Math.max(...Object.values(this.lengths));
        
        this._playing = false;
        this._timerId = null;
    }
    
    get length() {
        return this._length;
    }
    
    static initFrom(otherObj, initialValGen, initObj = {}) {
        for(let prop in otherObj) initObj[prop] = initialValGen(prop, otherObj[prop]);        
        return initObj;
    }
    
    static *objZip() {
        if(arguments.length < 1) throw "Error: Must pass at least 2 objects.";
        
        keysObj = arguments[0];
        
        for(let prop in keysObj) {
            let res = [prop];
            for(let arg in arguments) res.push(arg[prop]);
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
            
            for(let note of track) {
                cumSum.push(sum);
                sum += (note[0] == "play")? note[2]: note[1];
            }
            
            cumSum.push(sum);
            cumSums[trackName] = cumSum;
        }
        
        return cumSums;
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
    
    pause() {
        if(this._playing) {
            this._playing = false;
            if(this._timerId != null) clearTimeout(this._timerId);
            // Kill all of the oscillators...
            for(let [name, osc] of TonePlayer.objZip(this.oscillators)) osc.stop();
            this.onUpdate(this._playing, this.offset);
        }
    }
    
    setLocation(tickOffset) {
        this.pause();
        // Binary search for first spot
    }
    
    _execStep() {
        if(!this._playing) return;
        this.onUpdate(this._playing, this.offset);
        
        // Compute the time until the next note..
        let next = [];
        for(let [name, trackOff, osc, index] of TonePlayer.objZip(this.locations, this.oscillators, this.currentIndexes) {
            if(index >= trackOff.length) {
                osc.stop();
                continue;
            }
            next.push([name, trackOff - this.offset]);
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
                let track = this.tracks[name];
                let osc = this.oscillators[name];
                
                osc.stop();
                if(idx < track.length) {
                    let cmd = track[idx];
                    
                    if(cmd[0] == "play") {
                        osc.frequency.setValueAtTime(cmd[1], TonePlayer.AudioCtx.currentTime);
                        osc.play();
                    }
                }
                
                this.currentIndexes[name] = idx + 1;
            }
            else {
                // Setup timeout for next note play...
                this.offset += timeUntil;
                this._timerId = setTimeout(() => this._execStep(), this.millisPerTick * timeUntil);
                return;
            }
        }
    }
}
