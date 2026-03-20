function rot13(s) {
    return s.replace(/[a-zA-Z]/g, function(c) {
        var base = c <= 'Z' ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
    });
}

var encoded = "qnejva.irture@tznvy.pbz";
var email = rot13(encoded);
var element = document.getElementById("email");
element.innerHTML = '<a href="mailto:' + email + '">' + email + '</a>';
