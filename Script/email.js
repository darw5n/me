var user = "darwin.vegher"; // Nome utente
var domain = "gmail.com"; // Dominio
var element = document.getElementById("email"); // ID dell'elemento dove vuoi visualizzare l'email

// Costruisci l'indirizzo email
var email = user + "@" + domain;

// Sostituisci il contenuto dell'elemento con l'indirizzo email
element.innerHTML = '<a href="mailto:' + email + '">' + email + "</a>";
