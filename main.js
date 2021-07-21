"use strict";

function sanitize(s) {
    return (String(s)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;'));
}

$(document).ready(async function() {
    // Some globals to store state...
    let appData = {};
    
    ToneArduinoConv.loadTemplate();
    
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
    
    // Enable tabbing in text area
    $(document).on("keydown", ".codetext", function(e) {
        var keyCode = e.keyCode || e.which;
        let tabInsert = "    ";
        
        if(keyCode == 9) {
            e.preventDefault();
            let start = this.selectionStart;
            let end = this.selectionEnd;
            let currentVal = $(this).val();
            
            $(this).val(currentVal.slice(0, start) + tabInsert + currentVal.slice(end));
            
            this.selectionStart = start + tabInsert.length;
            this.selectionEnd = start + tabInsert.length;
            updateHighlight(null);
        }
    });
    
    function fixScroll() {
        let tbox = $("#codetext")[0];
        let codebox = $("#codehighlight")[0];
        
        codebox.scrollTop = tbox.scrollTop;
        codebox.scrollLeft = tbox.scrollLeft;
    }
    
    function addLineNums(txt) {
        let finalTxt = [];
        let txtLst = txt.split("\n");
        let spacesNeeded = Math.floor(Math.log10(txtLst.length)) + 2
        
        for(let i = 0; i < txtLst.length; i++) {
            finalTxt.push("<span class='line-number'>" + ((i + 1) + " ").padStart(spacesNeeded, " ") + "</span>" + txtLst[i]);
        }
        
        return [finalTxt.join("\n"), spacesNeeded];
    }
    
    function updateHighlight(e) {
        let code = $("#codetext").val();
        
        if(code == "") {
            $(".codetextholder").css("left", "0");
            $("#codehighlight").html("Write your music code here!");
            return;
        }
        
        let tokens = tokenize(code, true); // Lazy Eval...
        
        let newText = [];
        let lastSplit = 0;
        
        for(let [type, text, line, offset] of tokens) {
            if(type == null) continue;
            
            type = type.replaceAll(":", "-");

            newText.push(sanitize(code.slice(lastSplit, offset)));
            newText.push("<span class='code-" + sanitize(type) + "'>" + sanitize(text) + "</span>");
            
            lastSplit = offset + text.length;
        }
        
        newText.push(sanitize(code.slice(lastSplit)));
        fixScroll();
        
        newText = newText.join("");
        let [finalTxt, spacing] = addLineNums(newText);
        $(".codetextholder").css("left", spacing + "ch");
        
        if(newText.length > 0 && finalTxt[finalTxt.length - 1] == "\n") finalTxt += " ";
        
        $("#codehighlight").html(finalTxt);
    }
    
    // Hookup syntax highlighting...
    $("#codetext").on("input", updateHighlight);
    
    $("#codetext").on("scroll", function(e) {
        fixScroll();
    });
    
    $("#build").click(function(e) {
        if(appData.player != null) appData.player.disconect(); 
        
        let code = $("#codetext").val();
        $("#outputconsole").html("");
        
        try {
            appData.music = runMusicLang(code);
        } catch(exp) {
            $("#outputconsole").html(sanitize(exp));
            return;
        }
        
        
        try {
            let secsPerTick = getSecondsPerTick(appData.music);
            
            let arduinoGen = new ToneArduinoConv(appData.music.tracks, secsPerTick);
            $("#outputconsole").html(sanitize(arduinoGen.getCode()));
            
            appData.player = new TonePlayerController(
                $("#play"),
                $("#stop"),
                $("#play-slider"),
                new TonePlayer(appData.music.tracks, secsPerTick),
                (p, o) => {
                    let icon = (a) => ((a)? "fa-pause": "fa-play");
                    $("#playicon").removeClass(icon(!p)).addClass(icon(p));
                }
            );
            appData.player.connect();
        } catch(e) {
            console.log("Warning: " + e);
        }
    });
    
    // Download support...
    $("#download").on("click", function(e) {
        function downloadFile(filename, data) {
            let aElem = $("<a>")
            aElem.css("display", "none");
            aElem.attr("download", filename);
            aElem.attr("href", "data:text/plain;charset=utf-8," + encodeURIComponent(data));
            $("body").append(aElem);
            aElem[0].click();
            aElem.remove();
        }
        
        downloadFile("MusicFile.txt", $("#codetext").val());
    });
    
    $("#upload").on("click", function(e) {
        $("#fileselect")[0].click();
    });
    
    $("#fileselect").on("change", async function(e) {
        let fileObj = $("#fileselect")[0];
        
        if(fileObj.files.length > 0) {
            let file = fileObj.files[0];
            try {
                let text = await file.text();
                $("#codetext").val(text);
                updateHighlight(null);
            } catch(e) {
                $("#outputconsole").html(sanitize(e));
            }
        }
        
        fileObj.value = null;
    });
    
    // Disable selection on noselect elements.
    $(".noselect").on("selectstart", false);
});

