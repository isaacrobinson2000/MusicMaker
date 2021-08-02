"use strict";

let PLAYERS = {};
let ID_GEN = 0;

$(document).ready(async function() {
    
    function addPlayer(play_div, music_code) {
        // Parse the music...
        let music = runMusicLang(music_code);
        
        let play_icon = $($.parseHTML('<i class="playicon fa fa-play"></i>'));
        let play_btn = $($.parseHTML('<button class="play"></button>'));
        play_btn.append(play_icon);
        
        let stop_btn = $($.parseHTML('<button class="stop" disabled><i class="stopicon fa fa-stop"></i></button>'));
        let slider = $($.parseHTML('<input type="range" class="play-slider" disabled>'));
        
        let container = $($.parseHTML('<div class="player-div"></div>'));
        container.append(play_btn);
        container.append(stop_btn);
        container.append(slider);
        
        let play_id = ID_GEN++;
        
        // On first click, generate the player...
        play_btn.on("click", () => {
            if(play_id in PLAYERS) return;
            play_btn.off("click");
            
            PLAYERS[play_id] = new TonePlayerController(
                play_btn,
                stop_btn,
                slider,
                new TonePlayer(music.tracks, getSecondsPerTick(music)),
                (p, o) => {
                    let icon = (a) => ((a)? "fa-pause": "fa-play");
                    play_icon.removeClass(icon(!p)).addClass(icon(p));
                }
            )
            
            PLAYERS[play_id].connect();
            play_btn.trigger("click");
        });
        
        play_div.append(container);
    }
    
    $.get({
        url: "sources.txt",
        success: function(d) {
            let i = 0;
            let play_div = $("#player-preview-div");
            play_div.empty();
                        
            for(let info of d.split("@@@")) {
                if(i % 2 == 0) {
                    play_div.append($.parseHTML("<h4>" + info.trim() + "</h4>"));
                } 
                else {
                    addPlayer(play_div, info);
                }
                i++;
            }
        },
        dataType: "text"
    });
});
