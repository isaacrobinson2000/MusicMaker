"use strict";

class TonePlayerController {
    constructor(playButton, stopButton, progressSlider, tonePlayer, playChange = null) {
        this._playBtn = playButton;
        this._stopBtn = stopButton;
        this._slider = progressSlider;
        this._tonePlayer = tonePlayer;
        this._playChange = playChange;
        this._attached = false;
        
        this._playFunc = (e) => {
            if(this._tonePlayer.playing){
                this._tonePlayer.pause();
            } else {
                this._tonePlayer.play();
            }
        };
        this._stopFunc = (e) => {
            this._tonePlayer.stop();
        };
        this._sliderChange = (e) => {
            this._tonePlayer.setLocation(Number(this._slider.prop("value")));
        };
        this._tonePlayerChange = (playing, offset) => {
            if(this._playChange != null) this._playChange(playing, offset);
            this._slider.prop("value", offset);
        };
        
        if(playChange != null) playChange(false, 0);
    }
    
    resetSlider() {
        // Configure the slider for the given tonePlayer...
        this._slider.prop("min", 0);
        this._slider.prop("max", this._tonePlayer.length);
        this._slider.prop("step", "any");
        this._slider.prop("value", 0); 
    }
    
    connect() {
        this._attached = true;
        
        this._tonePlayer.stop();
        
        this.resetSlider();
        
        // Connect events...
        this._slider.on("input", this._sliderChange);
        this._playBtn.on("click", this._playFunc);
        this._stopBtn.on("click", this._stopFunc);
        this._tonePlayer.onUpdate = this._tonePlayerChange;
        
        // Enable controls...
        this._slider.prop("disabled", false);
        this._playBtn.prop("disabled", false);
        this._stopBtn.prop("disabled", false);
    }
    
    disconect() {
        if(this._attached) {
            this._attached = false;
            // Enable controls...
            this._slider.prop("disabled", true);
            this._playBtn.prop("disabled", true);
            this._stopBtn.prop("disabled", true);
            
            this._slider.off("input", this._sliderChange);
            this._playBtn.off("click", this._playFunc);
            this._stopBtn.off("click", this._stopFunc);
            this._tonePlayer.onUpdate = null;
            
            this._tonePlayer.stop();
            this.resetSlider();
        }
    }
} 
