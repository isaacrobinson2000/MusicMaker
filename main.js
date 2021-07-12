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
        }
    });
    
    function fixScroll() {
        let tbox = $("#codetext")[0];
        let codebox = $("#codehighlight")[0];
        
        codebox.scrollTop = tbox.scrollTop;
        codebox.scrollLeft = tbox.scrollLeft;
    }
    
    // Hookup syntax highlighting...
    $("#codetext").on("input", function(e) {
        let code = $(this).val();
        
        if(code == "") {
            $("#codehighlight").html("Write your music code here!");
            return;
        }
        
        let tokens = tokenize(code, true); // Lazy Eval...
        
        newText = [];
        lastSplit = 0;
        
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
    });
    
    $("#codetext").on("scroll", function(e) {
        fixScroll();
    });
});

