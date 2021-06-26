//connect the client to server via socket
let myUserName = prompt("Please enter your name?");
if (!myUserName) {
  myUserName = "User";
}
const socket = io("/");

//myPeer created
const myPeer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "3000",
  // proxied: true,
  // secure: true,
});

//peers empty object
const newPeers = {};
const oldPeers = {};

//welcome message ,inserted name of user
document.getElementById("welcomeMsg").innerText = myUserName;

//video Element creation,adding video/audio controls on my DOM
const videoContainer = document.getElementById("video-container");

const myVideo = document.createElement("video");
myVideo.muted = true; //mute the users audio
const myVideoDiv = document.createElement("div");
myVideoDiv.classList.add("video-div");
const myNameP = document.createElement("p");
const mynameTextS = document.createElement("span");

let htmlInserted = `<span class="control-btns-container">
                      <span id="videoBtn" class="control-btn "><span class="fas fa-video"></span></span>
                      <span id="audioBtn" class="control-btn "><span class="fas fa-microphone"></span></span>
                    </span> `;

myNameP.innerHTML = htmlInserted;

const videoBtn = myNameP.querySelector("#videoBtn");
const audioBtn = myNameP.querySelector("#audioBtn");
let isVidoeOn = true;
let isAudioOn = true;

//prompts the user for permission to use a media input which produces a MediaStream with tracks containing the requested types of media
//it returns a promise

navigator.getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    videoBtn.addEventListener("click", () => {
      const icon = document.querySelector("#videoBtn span");

      if (isVidoeOn) {
        stream.getVideoTracks()[0].enabled = false;
        icon.classList.replace("fa-video", "fa-video-slash");
        isVidoeOn = false;
      } else {
        stream.getVideoTracks()[0].enabled = true;
        icon.classList.replace("fa-video-slash", "fa-video");
        isVidoeOn = true;
      }
    });

    audioBtn.addEventListener("click", () => {
      const icon = document.querySelector("#audioBtn span");

      if (isAudioOn) {
        stream.getAudioTracks()[0].enabled = false;
        icon.classList.replace("fa-microphone", "fa-microphone-slash");
        isAudioOn = false;
      } else {
        stream.getAudioTracks()[0].enabled = true;
        icon.classList.replace("fa-microphone-slash", "fa-microphone");
        isAudioOn = true;
      }
    });

    //add my own stream in my own dom
    addVideoStream(
      myVideo,
      myVideoDiv,
      myNameP,
      myUserName + " (You)",
      mynameTextS,
      stream
    );

    //accept the call made by other old-users and send them my own stream
    myPeer.on("call", (call) => {
      const peerWhoCalledId = call.peer;
      // const myId = call.provider._id;
      const peerWhoCalledName = call.metadata.name;

      oldPeers[peerWhoCalledId] = call;
      call.answer(stream);
      console.log("my oldpeer called me,i answered and sent stream");
      const video = document.createElement("video");
      const videoDiv = document.createElement("div");
      videoDiv.classList.add("video-div");
      const nameP = document.createElement("p");
      const nameTextS = document.createElement("span");

      call.on("stream", (oldUservideoStream) => {
        console.log(
          "my old peer called me,i got his video and displayed it,he/she was: " +
            peerWhoCalledName
        );
        console.log(oldUservideoStream);
        addVideoStream(
          video,
          videoDiv,
          nameP,
          peerWhoCalledName,
          nameTextS,
          oldUservideoStream
        );
      });

      //fired when the old users leaves the room
      call.on("close", () => {
        console.log("deleted video of old user");
        videoDiv.remove();
      });
    });

    //ask the other  old-users for their stream to add in my own dom

    //user connected event,userid of newuser which is sent to all users except the new user
    socket.on("user-connected", (userId, userName) => {
      //conncet to the new user by passing our own stream to him
      console.log("new user joined: " + userId + " : " + userName);
      setTimeout(() => {
        connectToNewUser(userId, stream, myUserName, userName);
      }, 1000);
    });
  })
  .catch((err) => {
    alert("failed to get media:: " + err);
  });

//whichever user either old /new his userId is recieved
socket.on("user-disconnected", (userId, usersArr) => {
  console.log("user disconnected: " + userId);
  //close the call made to the new user
  if (newPeers[userId]) newPeers[userId].close();
  if (oldPeers[userId]) oldPeers[userId].close();
  updateNames(usersArr);
});

//peerjs sent back the id
myPeer.on("open", (id) => {
  //sent this id and room number to server.js
  console.log("my id created: " + id);
  //emit the event to add the new user
  socket.emit("join-room", ROOM_ID, id, myUserName);
});

function connectToNewUser(userId, stream, myUserName, userName) {
  console.log("connect to new user function");
  //userid of new user,jiski call kar re hai
  const call = myPeer.call(`${userId}`, stream, {
    metadata: { name: `${myUserName}` },
  }); //send the newuser our own stream and our name via metadata
  const video = document.createElement("video");
  const videoDiv = document.createElement("div");
  videoDiv.classList.add("video-div");
  const nameP = document.createElement("p");
  const nameTextS = document.createElement("span");

  //event of getting back the new users stream
  call.on("stream", (newuserVideoStream) => {
    console.log("call answered by newuser i got his video: ");
    console.log(newuserVideoStream);
    //adding the new users video to our own dom
    addVideoStream(
      video,
      videoDiv,
      nameP,
      userName,
      nameTextS,
      newuserVideoStream
    );
  });

  //remove the video of user who left the chat(close event listner)
  call.on("close", () => {
    console.log("deleted video of new user");
    videoDiv.remove();
  });

  newPeers[userId] = call;
}

//addvideostream function
function addVideoStream(video, videoDiv, nameP, userName, textS, stream) {
  video.srcObject = stream;
  //once the stream is loaded to the video element play the video
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });

  //append the video elem in dom

  videoDiv.append(video);
  textS.innerText = userName;
  nameP.prepend(textS);
  videoDiv.append(nameP);
  videoContainer.append(videoDiv);
}

//BUTTONS,CHAT-WINDOW functions

//CLIPBOARD COPY
const inviteBtn = document.getElementById("invitebtn");

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
    `URL coppied to clipboard,\r\nShare the room link with your friends,\r\nURL :${text}`
  );
}

inviteBtn.addEventListener("click", getUrl);

//update names event
const olList = document.querySelector("ol.list");

socket.on("updateNames", function (usersArr) {
  updateNames(usersArr);
});

function updateNames(usersArr) {
  let str = "";
  usersArr.forEach((userName) => {
    if (userName == myUserName) {
      str += `<li>${userName} (You)</li>`;
    } else {
      str += `<li>${userName}</li>`;
    }
  });
  olList.innerHTML = str;
}

//closeModal function
const modalContainer = document.querySelector(".modal-container");

function toggleModal() {
  modalContainer.classList.toggle("open-modal");
  modalContainer.classList.toggle("close-modal");
}

//Leave meeting function
function leaveMeeting() {
  const answer = confirm("are you sure you want to leave the meeting?");
  if (answer) {
    window.open("/");
  }
}

//CHAT WINDOW
const chatWindow = document.querySelector(".chat-window");
const videoWindow = document.querySelector(".video-window");
const chatBtn = document.querySelector("#chatbtn");

function toggleChatWindow() {
  chatWindow.classList.toggle("chat-window-open");
  chatWindow.classList.toggle("chat-window-close");
  videoWindow.classList.toggle("video-window-small");
  videoWindow.classList.toggle("video-window-large");
}

const inputText = document.getElementById("inputText");
const sendBtn = document.getElementById("sendBtn");

//when the send button is clicked to send a message
sendBtn.addEventListener("click", () => {
  console.log("send btn clicked");
  let message = inputText.value;
  displayMessage(message, "right", "You");
  socket.emit("messageSent", message, "left", myUserName);
  inputText.value = "";
});

//event recieved from server to all the sockets except the socket who initially sent message to server
socket.on("messageRecieved", (msg, position, name) => {
  displayMessage(msg, position, name);
});

//display message function in dom
const chatBoxDiv = document.querySelector(".chat-box");

function displayMessage(msg, position, name) {
  console.log("display function called");
  const mesgDiv = document.createElement("div");
  mesgDiv.classList.add("msg");
  mesgDiv.classList.add(`${position}`);
  let str = "";
  if (position == "right") {
    str = msg + `<span> :${name}</span>`;
  } else {
    str = `<span>${name}: </span>` + msg;
  }
  mesgDiv.innerHTML = str;
  chatBoxDiv.append(mesgDiv);
}
