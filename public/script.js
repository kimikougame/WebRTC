const socket = io("http://localhost:3030");
const myPeer = new Peer()
const videpWrap = document.getElementById("video-wrap");
const ROOM_ID = "room1";
const peers = {};
let myVideoStream;

const myVideo = document.createElement("video");
myVideo.muted = true;

const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
    });
    videpWrap.append(video);
};

const connectToNewUser = (userId, stream) => {
    const call = myPeer.call(userId, stream);
    const video = document.createElement("video")
    call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
    })
    call.on("close", () => {
        video.remove();
    });
    peers[userId] = call;
}

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream)

    myPeer.on("call", call => {
        call.answer(stream);
        const video = document.createElement("video");
        call.on("stream", userVideoStream => {
            addVideoStream(video, userVideoStream);
        });
        const userId = call.peer;
        peers[userId] = call;
    });
    socket.on("user-connected", userId => {
        connectToNewUser(userId, stream)
    })
});

socket.on("user-disconnected", (userId) => {
    console.log('userId=', userId);
    if (peers[userId]) peers[userId].close();
});

myPeer.on("open", userId => {
    socket.emit("join-room", ROOM_ID, userId);
});
myPeer.on("disconnected", (userId) => {
    console.log("disconnected=", userId)
})
const muteUnmute = (e) => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        e.classList.add("active");
        myVideoStream.getAudioTracks()[0].enabled = false;
    } else {
        e.classList.remove("active");
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
}

const playStop = (e) => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        e.classList.add("active");
        myVideoStream.getVideoTracks()[0].enabled = false;
    } else {
        e.classList.remove("active");
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
};

const leaveVideo = (e) => {
    if (myVideoStream) {
        myVideoStream.getTracks().forEach(track => track.stop());
        myVideoStream = null;
    }

    setTimeout(() => {
        const videos = document.getElementsByTagName("video");
        for (let i = videos.length - 1; i >= 0; --i) {
            videos[i].pause();
            videos[i].srcObject = null;
            videos[i].remove();
        };
    }, 100);

    socket.disconnect();
    myPeer.disconnect();
};


