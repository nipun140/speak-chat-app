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
  window.alert(
    `URL coppied to clipboard,\r\nShare with your friends,\r\nURL :${text}`
  );
}

function redirectUser() {
  const inviteLink = inviteBtn.value;
  window.open(inviteLink);
}

shareBtn.addEventListener("click", getUrl);
joinBtn.addEventListener("click", redirectUser);

// browser.runtime.onMessage.addListener((message) => {
//   console.log("background: onMessage", message);

//   // Add this line:
//   return Promise.resolve("Dummy response to keep the console quiet");
// });
