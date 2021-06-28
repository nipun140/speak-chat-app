const shareBtn = document.querySelector("#share-btn");
const inviteBtn = document.querySelector("#invite-link");
const joinBtn = document.querySelector("#join-btn");

const getUrl = () => {
  let text = window.location.href;
  copyToClipboard(text);
};

function copyToClipboard(text) {
  const dummy = document.createElement("textarea");
  dummy.innerText = text;
  document.body.append(dummy);
  dummy.select();
  document.execCommand("copy");
  dummy.remove();
  showAlertBox(
    `URL coppied to clipboard, <br> Share the room link with your friends, <br> URL :${text}`
  );
}

function redirectUser() {
  const inviteLink = inviteBtn.value;
  window.open(inviteLink);
}

shareBtn.addEventListener("click", getUrl);
joinBtn.addEventListener("click", redirectUser);

//alert box
const alertMessageContainer = document.querySelector(
  "#alert-message-container"
);
const alertDiv = document.querySelector("#alert-div");
const alertText = document.querySelector("#alert-div p");
const okBtn = document.querySelector("#alert-div .okBtn");

function showAlertBox(alertMsg) {
  alertMessageContainer.style.display = "flex";
  alertText.innerHTML = alertMsg;
  alertDiv.classList.replace("zoom-out", "zoom-in");
}

okBtn.addEventListener("click", () => {
  closeAlertMessageBox();
});

function closeAlertMessageBox() {
  alertDiv.classList.replace("zoom-in", "zoom-out");

  setTimeout(() => {
    alertMessageContainer.style.display = "none";
  }, 400);
}
