"use strict";

class ToneArduinoConv {
    
    static getTrackCumulators = TonePlayer.getTrackCumulators;
    
    constructor(trackObj, secondsPerTick) {
        this.tracks = trackObj;
        this.secondsPerTick = secondsPerTick;
        this.millisPerTick = secondsPerTick * 1000;
        
        let locs = ToneArduinoConv.getTrackCumulators(lengths);
        this._length = Math.max(...Object.values(this.locations).map((a) => a[a.length - 1]));
        
        
    }
    
    static findMinTick(track, length) {
        let min = Infinity;
        
        for(let [type, duration] of track.notes) {
            if(min >= duration) {
                min = duration;
            }
        }
        
        return min;
    }
    
    static solveTrack(track, length) {
        minTick = this.findMinTick(track, length);
        finalNoteList = [];
        
        for(let [type, duration, freq] of track.notes) {
            let startNote
        }
    }
    
    get length() {
        return this._length;
    }
}
