// CHATBOT DEMO (temporary, backend later)

let questions = [
    "What is your full name?",
    "Your email?",
    "Your phone number?",
    "Your skills?"
];

let step = 0;

function sendMessage() {
    let input = document.getElementById("userInput").value;
    let chatbox = document.getElementById("chatbox");

    chatbox.innerHTML += "<p><b>You:</b> " + input + "</p>";

    if(step < questions.length){
        chatbox.innerHTML += "<p><b>Bot:</b> " + questions[step] + "</p>";
        step++;
    } else {
        chatbox.innerHTML += "<p><b>Bot:</b> Thank you! Resume will be generated.</p>";
    }

    document.getElementById("userInput").value = "";
}
