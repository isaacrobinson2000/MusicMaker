"use strict";

function sanitize(s) {
    return (String(s)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;'));
}

$(document).ready(function() {
    // Some globals to store state...
    let appData = {};
    
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
    
    function updateHighlight(e) {
        let code = $("#codetext").val();
        
        if(code == "") {
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
        if(newText.length > 0 && newText[newText.length - 1] == " ") newText += " ";
        
        $("#codehighlight").html(newText);
    }
    
    // Hookup syntax highlighting...
    $("#codetext").on("input", updateHighlight);
    
    $("#codetext").on("scroll", function(e) {
        fixScroll();
    });
    
    $("#build").click(function(e) {
        let code = $("#codetext").val();
        $("#outputconsole").html("");
        
        try {
            appData.music = runMusicLang(code);
        } catch(exp) {
            $("#outputconsole").html(sanitize(exp));
            return;
        }
        
        console.log(appData.music);
    });
});

