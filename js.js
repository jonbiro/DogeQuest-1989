//Put the following in the game at Game Over:

function hideForm() {
  document.getElementById('appendForm').style.display = "none"
}

jonFunc(score);
// The above!

// Below is the creation of the name form, and fetch post requests to the JSON
function jonFunc(score) {
console.log("hiya")



document.addEventListener("DOMContentLoaded", function(){

let appendFormDiv = document.getElementById('appendForm')


appendFormDiv.innerHTML =
`<form class="ui form" id="formId">Your Name: <input type="text" placeholder="What's your name?" name="formName"><button type="submit" onclick="hideForm()">Save</button></form>`

let form = document.getElementById("formId");


form.addEventListener("submit", event => {
  console.log("Saving name:", event.target.elements.formName.value);
  event.preventDefault();

  fetch("https://salty-eyrie-53093.herokuapp.com/users", {
    method: "POST",
    headers: {
      'Accept': "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ "name": `${event.target.elements.formName.value}` })
  })
  .then(res => res.json())
  .then(res => postScore(res.id))
});

function postScore(id) {
  fetch("https://salty-eyrie-53093.herokuapp.com/scores",{
    method: "POST",
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ "gamescore": `${score}`, "user_id": `${id}`})
  });
}

});
}
