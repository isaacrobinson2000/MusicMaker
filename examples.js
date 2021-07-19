$(document).ready(function() {
    $.ajax({
        url: "examples/info.txt",
        success: (d) => {
            for(let entry in d.split("\n")) {
                $("#examples-list").append($.parseHTML("<li><a href='" + entry + "/" entry + ".ino'>" + entry + "</a></li>"));
            }
        },
        error: (xhr, e) => {
            $("#examples-list").append("Unable to load examples: " + e);
        },
        dataType: "text"
    });
});
