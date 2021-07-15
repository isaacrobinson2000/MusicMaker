"use strict";

function* enumerate(iterable) {
    let i = 0;
    
    for(let item of iterable) {
        yield [i, item];
        i++;
    }
}

class ToneArduinoConv {
    
    static getTrackCumulators = TonePlayer.getTrackCumulators;
    static MAX_TICKS = (2 ** 14) - 1;
    static NUMS_PER_LINE = 5;
    
    constructor(trackObj, secondsPerTick) {
        this.tracks = trackObj;
        this.secondsPerTick = secondsPerTick;
        this.millisPerTick = secondsPerTick * 1000;
        
        let locs = TonePlayer.getTrackCumulators(this.tracks);
        this._length = Math.max(...Object.values(locs).map((a) => a[a.length - 1]));
    }
    
    getCode() {
        let trackSol = [];
        
        for(let trackName in this.tracks) {
            let track = this.tracks[trackName];
            let [noteLst, tickSpeed] = ToneArduinoConv.solveTrack(track, this.length, this.millisPerTick);
            let encodedTrack = ToneArduinoConv.encodeTrack(noteLst);
            trackSol.push(ToneArduinoConv.toCode(trackName, encodedTrack, tickSpeed));
        }
        
        return trackSol.join("\n");
    }
    
    static findGCFOfDurations(track) {
        let gcfTick = null;
        
        for(let [type, duration] of track.notes) {
            gcfTick = (gcfTick == null)? duration: this.gcf(gcfTick, duration);
        }
        
        return gcfTick;
    }
    
    static to128Midi(num) {
        return Math.floor(128 * (69 + 12 * Math.log2(num / 440)));
    }
    
    static gcf(a, b) {
        // GCF for floats...
        while(b > 1e-8) {
            let tmp = b;
            b = a % b;
            a = tmp;
        }
        return a;
    }
    
    static solveTrack(track, length, millisPerTick) {
        // We allow up to millisecond percision on the tick unit max...
        let tickUnit = Math.max(this.findGCFOfDurations(track), 1 / millisPerTick);
        let finalNoteList = [];
        
        for(let [type, arg1, arg2] of track.notes) {
            let duration = (type == "play")? arg2: arg1;
            let freq = (type == "play")? arg1: undefined;
            
            let durationTicks = Math.floor(duration / tickUnit);
            
            if(type == "play") {
                finalNoteList.push(["play", this.to128Midi(freq)]);
                type = "wait";
            }
            
            for(; durationTicks > this.MAX_TICKS; durationTicks -= this.MAX_TICKS) {
                finalNoteList.push([type, this.MAX_TICKS]);
                if(type == "rest") type = "wait";
            }
            finalNoteList.push([type, durationTicks]);
            
            length -= duration;
        }
        
        if(length > 0) {
            let tickLength = Math.floor(length / tickUnit);
            let type = "rest";
            
            for(; tickLength > this.MAX_TICKS; tickLength -= this.MAX_TICKS) {
                finalNoteList.push([type, this.MAX_TICKS]);
                if(type == "rest") type = "wait";
            }
            
            finalNoteList.push([type, tickLength]);
        }
        
        return [finalNoteList, tickUnit * millisPerTick];
    }
    
    static encodeTrack(solvedTrack) {
        let encoded = [];
        let to14Bit = (n) => {
            return (Math.abs(n) >>> 0).toString(2).padStart(14, "0");
        };
        
        let toCommand = {
            "wait": "00",
            "play": "01",
            "rest": "10"
        };
        
        for(let [type, arg] of solvedTrack) {
            encoded.push(toCommand[type] + to14Bit(arg));
        }
        
        return encoded;
    }
    
    static toCode(name, encodedTrack, tickSpeed) {
        let finalString = "const uint16_t PROGMEM " + name + " = {";
        
        for(let [i, binary] of enumerate(encodedTrack)) {
            if(i % this.NUMS_PER_LINE == 0) finalString += "\n  ";
            
            finalString += "0b" + binary + ((i == encodedTrack.length - 1)? "\n": ", ");
        }
        
        finalString += "};\n\n";
        finalString += "const size_t " + name + "Len = sizeof(" + name + ") / sizeof(uint16_t);\n";
        finalString += "const float " + name + "MillisPerTick = " + tickSpeed + ";\n";
        
        return finalString;
    }
    
    get length() {
        return this._length;
    }
}
