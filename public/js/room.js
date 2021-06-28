const alertMessageContainer = document.querySelector(
  "#alert-message-container"
);
const alertDiv = document.querySelector("#alert-div");
const alertText = document.querySelector("#alert-div p");
const inputName = document.querySelector("#alert-div input");
const okBtn = document.querySelector("#alert-div .okBtn");

let myUserName = "";

// custom alert box & prompt box

okBtn.addEventListener("click", () => {
  closeAlertMessageBox(showLater);
});

function showAlertBox(alertMsg, takeInput) {
  alertMessageContainer.style.display = "flex";
  if (takeInput == "true") {
    inputName.style.display = "block";
  }
  alertText.innerHTML = alertMsg;
  alertDiv.classList.replace("zoom-out", "zoom-in");
}

function closeAlertMessageBox(callBack) {
  alertDiv.classList.replace("zoom-in", "zoom-out");

  setTimeout(() => {
    alertMessageContainer.style.display = "none";

    let inputVal = inputName.value;
    if (inputVal == "") {
      inputVal = "default user";
    }
    myUserName = inputVal;

    if (inputName.style.display == "block") {
      inputName.style.display = "none";
      callBack();
    }
  }, 400);
}

// confirm box
const confirmMessageContainer = document.querySelector(
  "#confirm-message-container"
);
const confirmDiv = document.querySelector("#confirm-div");
const confirmText = document.querySelector("#confirm-div p");
const confirmOkBtn = document.querySelector("#confirm-div .okBtn");
const confirmCancelBtn = document.querySelector("#confirm-div .cancelBtn");

function showConfirmBox() {
  confirmMessageContainer.style.display = "flex";
  confirmText.innerHTML = "are you sure you want to leave the meeting?";
  confirmDiv.classList.replace("zoom-out", "zoom-in");
}

function closeConfirmMessageBox() {
  confirmDiv.classList.replace("zoom-in", "zoom-out");

  setTimeout(() => {
    confirmMessageContainer.style.display = "none";
  }, 200);
}

confirmOkBtn.addEventListener("click", () => {
  closeConfirmMessageBox();
  window.location.assign("/");
});

confirmCancelBtn.addEventListener("click", () => {
  closeConfirmMessageBox();
});

//call once default time
showAlertBox("Please enter your name?", "true");

//////////////////CALLLBACK called after the prompt box to load the DOM
function showLater() {
  //connect the client to server via socket
  const socket = io("/");
  document.querySelector(".main-window").style.display = "flex";

  //myPeer created
  const myPeer = new Peer(undefined, {
    path: "/peerjs",
    host: "/",
    port: "443",
    // proxied: true,
    // secure: true,
  });

  //peers empty object
  const newPeers = {};
  const oldPeers = {};

  let myStream;
  const currentPeers = [];

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
                      <span id="screenShareBtn" class="control-btn "><span class="fa fa-tv"></span></span>
                      <span id="videoBtn" class="control-btn "><span class="fas fa-video"></span></span>
                      <span id="audioBtn" class="control-btn "><span class="fas fa-microphone"></span></span>
                    </span> `;

  myNameP.innerHTML = htmlInserted;

  const videoBtn = myNameP.querySelector("#videoBtn");
  const audioBtn = myNameP.querySelector("#audioBtn");
  const screenShareBtn = myNameP.querySelector("#screenShareBtn");
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
      myStream = stream;
      //changing the stream according the butttons pressed of video or audio
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
        const peerWhoCalledFilter = call.metadata.filter;

        oldPeers[peerWhoCalledId] = call;
        call.answer(stream);
        console.log("my oldpeer called me,i answered and sent stream");
        const video = document.createElement("video");
        video.className = peerWhoCalledFilter;

        socket.on("filterUpdate", (filter, newUserid) => {
          if (peerWhoCalledId == newUserid) {
            video.className = filter;
          }
        });

        const videoDiv = document.createElement("div");
        videoDiv.classList.add("video-div");
        const nameP = document.createElement("p");
        const nameTextS = document.createElement("span");

        call.on("stream", (oldUservideoStream) => {
          console.log(
            "my old peer called me,i got his video and displayed it,he/she was: " +
              peerWhoCalledName
          );
          // currentPeer = call.peerConnection;
          currentPeers.push(call.peerConnection);
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
      showAlertBox(`failed to get media:: ${err}`, "false");
    });

  //whichever user either old /new his userId is recieved
  socket.on("user-disconnected", (userId, usersArr) => {
    console.log("user disconnected: " + userId);
    //close the call made to the new user
    if (newPeers[userId]) newPeers[userId].close();
    if (oldPeers[userId]) oldPeers[userId].close();
    updateNames(usersArr);
  });

  let myFilterVal = "none";

  //peerjs sent back the id
  myPeer.on("open", (id) => {
    //sent this id and room number to server.js
    console.log("my id created: " + id);
    //emit the event to add the new user,new user sends his name server
    socket.emit("join-room", ROOM_ID, id, myUserName);

    //On filter change event, emit it to server
    const filterSelect = document.querySelector("select#filter");

    filterSelect.onchange = function () {
      myFilterVal = filterSelect.value;
      myVideo.className = myFilterVal;

      socket.emit("filterSent", myFilterVal, id);
    };
  });

  function connectToNewUser(userId, stream, myUserName, userName) {
    console.log("connect to new user function");
    //userid of new user,jiski call kar re hai
    const call = myPeer.call(`${userId}`, stream, {
      metadata: { name: `${myUserName}`, filter: `${myFilterVal}` },
    }); //send the newuser our own stream and our namevia metadata
    const video = document.createElement("video");

    socket.on("filterUpdate", (filter, newUserid) => {
      if (userId == newUserid) {
        video.className = filter;
      }
    });

    const videoDiv = document.createElement("div");
    videoDiv.classList.add("video-div");
    const nameP = document.createElement("p");
    const nameTextS = document.createElement("span");

    //event of getting back the new users stream
    call.on("stream", (newuserVideoStream) => {
      console.log("call answered by newuser i got his video: ");

      currentPeers.push(call.peerConnection);

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
    showAlertBox(
      `URL coppied to clipboard, <br> Share the room link with your friends, <br> URL :${text}`,
      "false"
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
  const endbtn = document.querySelector("#endbtn");
  const participantbtn = document.querySelector("#participantbtn");
  const modalCloseBtn = document.querySelector("#modalCloseBtn");

  participantbtn.addEventListener("click", toggleModal);

  modalCloseBtn.addEventListener("click", toggleModal);

  function toggleModal() {
    modalContainer.classList.toggle("open-modal");
    modalContainer.classList.toggle("close-modal");
  }

  endbtn.addEventListener("click", leaveMeeting);

  //Leave meeting function
  function leaveMeeting() {
    showConfirmBox();
  }

  //CHAT WINDOW
  const chatWindow = document.querySelector(".chat-window");
  const videoWindow = document.querySelector(".video-window");
  const chatBtn = document.querySelector("#chatbtn");
  const closeChatWindowBtn = document.querySelector("#closeChatWindowBtn");

  closeChatWindowBtn.addEventListener("click", toggleChatWindow);
  chatBtn.addEventListener("click", toggleChatWindow);

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
    let message = inputText.value;
    if (message) {
      displayMessage(message, "right", "You");
      socket.emit("messageSent", message, "left", myUserName);
      inputText.value = "";
    }
  });

  //event recieved from server to all the sockets except the socket who initially sent message to server
  socket.on("messageRecieved", (msg, position, name) => {
    displayMessage(msg, position, name);
  });

  //display message function in dom
  const chatBoxDiv = document.querySelector(".chat-box");

  function displayMessage(msg, position, name) {
    var audioObj = new Audio("../sounds/ting.mp3");
    audioObj.play();
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

  // function startScreenShare(camStream) {

  // }

  //function to switch to screen share
  screenShareBtn.addEventListener("click", () => {
    navigator.mediaDevices
      .getDisplayMedia({
        video: {
          cursor: "always",
        },
        audio: {
          echoCancellation: true,
          noiseSupprission: true,
        },
      })
      .then((screenStream) => {
        var videoTrack = myStream.getVideoTracks()[0];

        currentPeers.forEach((currentPeer) => {
          var videoSender = currentPeer.getSenders().find(function (s) {
            return s.track.kind == videoTrack.kind;
          });
          var screenVideoTrack = screenStream.getVideoTracks()[0];
          videoSender.replaceTrack(screenVideoTrack);
        });

        screenStream.getVideoTracks()[0].addEventListener("ended", () => {
          // stopScreenShare
          currentPeers.forEach((currentPeer) => {
            var videoSender = currentPeer.getSenders().find(function (s) {
              return s.track.kind == videoTrack.kind;
            });

            videoSender.replaceTrack(myStream.getVideoTracks()[0]);
          });

          showAlertBox("You have ended sharing the screen", "false");
        });
      })
      .catch((err) => {
        showAlertBox(err, "false");
      });
  });
}
