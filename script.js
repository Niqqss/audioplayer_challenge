const musicsData = [
    { title: "I Feel Fantastic", artist: "Riovaz", id: 1 },
    { title: "Gangsta Boo", artist: "Ice Spice", id: 2 },
    { title: "Tranquillement", artist: "Houdi", id: 3 },
    { title: "Waves", artist: "Freddie Joachim", id: 4 },
    { title: "Massage Situation", artist: "Flying Lotus", id: 5 },
    { title: "Cangaiba", artist: "Sango", id: 6 },
];

const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');

let width = canvas.width;
let height = canvas.height;

let audio;
let audioContext, audioData, sourceNode, analyserNode;
let minDb, maxDb;

const numCircles = 5;
const numSlices = 1;
const slice = Math.PI * 2 / numSlices;
const radius = 200;

const bins = [];
const lineWidths = [];
const rotationOffsets = [];

let lineWidth, bin, mapped, phi;

let prevTime = 0;
let angle = 0;
const angularVelocity = 0.00004;

for (let i = 0; i < numCircles * numSlices; i++) {
    bin = Math.floor(Math.random() * 61) + 4;
    bins.push(bin)
}

for (let i = 0; i < numCircles; i++) {
    const t = i / (numCircles - 1);
    lineWidth = customQuadIn(t) * 200 + 10;
    lineWidths.push(lineWidth);
}

for (let i = 0; i < numCircles; i++) {
    const min = Math.PI * -0.25;
    const max = Math.PI * 0.25;
    const rand = Math.random() * (max - min) + min;
    rotationOffsets.push(rand - Math.PI * 0.5);
}

const sketch = () => {
    return ({ context, width, height }) => {
        context.clearRect(0, 0, width, height);
        context.fillStyle = 'transparent';
        context.fillRect(0, 0, width, height);

        if (!audioContext) return;

        analyserNode.getFloatFrequencyData(audioData);

        const currentTime = performance.now();
        const deltaTime = currentTime - prevTime;
        prevTime = currentTime;

        angle += angularVelocity * deltaTime;

        context.save();
        context.translate(width * 0.5, height * 0.5);
        context.rotate(angle);
        context.scale(1, -1);

        let cradius = radius;

        for (let i = 0; i < numCircles; i++) {
            context.save();
            context.rotate(rotationOffsets[i]);

            cradius += lineWidths[i] * 0.5 + 2;

            for (let j = 0; j < numSlices; j++) {
                context.rotate(slice);
                context.lineWidth = lineWidths[i];

                bin = bins[i * numSlices + j];

                mapped = mapRange(audioData[bin], minDb, maxDb, 0, 1, true);
                lineWidth = lineWidths[i] * mapped;

                phi = slice * mapped;

                context.beginPath();
                context.lineWidth = lineWidth;
                context.arc(0, 0, cradius, 0, phi);
                context.stroke();
            }

            cradius += lineWidths[i] * 0.5;

            context.restore();
        }

        context.restore();
    };
};

const initializeAudioAnalyzer = () => {
    audio = document.querySelector('audio');
    audio.volume = volumeControl.value / 100;

    audioContext = new AudioContext();

    sourceNode = audioContext.createMediaElementSource(audio);
    sourceNode.connect(audioContext.destination);

    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 512;
    analyserNode.smoothingTimeConstant = 0.95;
    sourceNode.connect(analyserNode);

    minDb = analyserNode.minDecibels;
    maxDb = analyserNode.maxDecibels;

    audioData = new Float32Array(analyserNode.frequencyBinCount);
}

function mapRange(value, inputMin, inputMax, outputMin, outputMax, clamp) {
    const mapped = (value - inputMin) / (inputMax - inputMin) * (outputMax - outputMin) + outputMin;
    return clamp ? Math.min(outputMax, Math.max(outputMin, mapped)) : mapped;
}

function customQuadIn(t) {
    return t * t;
}

const start = async () => {
    const animate = () => {
        sketch()({ context, width, height });
        requestAnimationFrame(animate);
    };
    animate();
}

start();

// FIN CANVAS // FIN CANVAS // FIN CANVAS // FIN CANVAS // FIN CANVAS // FIN CANVAS // FIN CANVAS // FIN CANVAS

const musicPlayer = document.querySelector('audio');
const musicTitle = document.querySelector('.music-title');
const artistName = document.querySelector('.artist-name');
const thumbnail = document.querySelector('.thumbnail');
const indexTxt = document.querySelector(".current-index");

let currentMusicIndex = 1;

populateUI(musicsData[currentMusicIndex - 1]);

const playBtn = document.querySelector('.play-btn');

playBtn.addEventListener('click', handlePlayPause);

function handlePlayPause() {
    if (!audioContext) initializeAudioAnalyzer();
    if (musicPlayer.paused) {
        play();
    }
    else {
        pause();
    }
}

function play() {
    playBtn.querySelector('i').classList.remove('fa-play');
    playBtn.querySelector('i').classList.add('fa-pause');
    musicPlayer.play();
}

function pause() {
    playBtn.querySelector('i').classList.remove('fa-pause');
    playBtn.querySelector('i').classList.add('fa-play');
    musicPlayer.pause();
}

const displayCurrentTime = document.querySelector('.current-time');
const durationTime = document.querySelector('.duration-time');
const progressBar = document.querySelector('.progress-bar');

musicPlayer.addEventListener("loadeddata", fillDurationVariables);

let current;
let totalDuration;

function fillDurationVariables() {
    current = musicPlayer.currentTime;
    totalDuration = musicPlayer.duration;

    formatValue(current, displayCurrentTime);
    formatValue(totalDuration, durationTime);
}

function formatValue(val, element) {
    const currentMin = Math.trunc(val / 60);
    let currentSec = Math.trunc(val % 60);

    if (currentSec < 10) {
        currentSec = `0${currentSec}`;
    }

    element.textContent = `${currentMin}:${currentSec}`;
}

musicPlayer.addEventListener("timeupdate", updateProgress);

function updateProgress(e) {
    current = e.srcElement.currentTime;
    formatValue(current, displayCurrentTime);

    const progressValue = current / totalDuration;
    progressBar.style.transform = `scaleX(${progressValue})`;
}

const progressBarContainer = document.querySelector(".progress-container");

progressBarContainer.addEventListener("click", setProgress);

let rect = progressBarContainer.getBoundingClientRect();
let progressWidth = rect.width;

function setProgress(e) {
    const x = e.clientX - rect.left;
    musicPlayer.currentTime = (x / progressWidth) * totalDuration;
}

const nextBtn = document.querySelector('.next-btn');
const prevBtn = document.querySelector('.prev-btn');

[prevBtn, nextBtn].forEach(btn => btn.addEventListener("click", changeSong));
musicPlayer.addEventListener("ended", changeSong);

const shuffleButtons = document.querySelectorAll(".shuffle-btn");
shuffleButtons.forEach(shuffleBtn => {
    shuffleBtn.addEventListener("click", shufflePlaylist);
});

let shuffle = false;
let shuffledMusicsData = musicsData.slice();

function populateUI({ title, artist }) {
    const formattedTitle = title.replace(/ /g, '-');
    musicTitle.textContent = title;
    artistName.textContent = artist;
    thumbnail.src = `assets/images/${formattedTitle}.jpg`;
    musicPlayer.src = `assets/audio/${formattedTitle}.mp3`;
    indexTxt.textContent = `${currentMusicIndex}/${musicsData.length}`;
}

function shufflePlaylist() {
    shuffleButtons.forEach(shuffleBtn => {
        shuffleBtn.classList.toggle("active");
    });
    shuffle = !shuffle;
    if (shuffle) {
        const currentMusic = shuffledMusicsData[currentMusicIndex - 1];
        shuffledMusicsData = musicsData.slice().sort(() => Math.random() - 0.5);
        const currentIndexInShuffled = shuffledMusicsData.findIndex(musicData => musicData.id === currentMusic.id);
        if (currentIndexInShuffled !== -1) {
            shuffledMusicsData.splice(currentIndexInShuffled, 1);
            shuffledMusicsData.unshift(currentMusic);
        }
        currentMusicIndex = 1;
        indexTxt.textContent = `${currentMusicIndex}/${musicsData.length}`;
    } else {
        const currentMusic = shuffledMusicsData[currentMusicIndex - 1];
        shuffledMusicsData = musicsData.slice();
        currentMusicIndex = shuffledMusicsData.findIndex(musicData => musicData.id === currentMusic.id) + 1;
        indexTxt.textContent = `${currentMusicIndex}/${musicsData.length}`;
    }
    displayPlaylist();
    if (currentlyPlayingItem !== null) {
        currentlyPlayingItem.classList.remove("currently-playing");
    }
    currentlyPlayingItem = playlistItems[currentMusicIndex - 1];
    currentlyPlayingItem.classList.add("currently-playing");
}

function changeSong(e) {
    e.target.classList.contains("next-btn") || e.type === "ended" ? currentMusicIndex++ : currentMusicIndex--;

    if (currentMusicIndex < 1) {
        currentMusicIndex = shuffledMusicsData.length;
    }
    else if (currentMusicIndex > shuffledMusicsData.length) {
        currentMusicIndex = 1;
    }

    populateUI(shuffledMusicsData[currentMusicIndex - 1]);
    if (!audioContext) initializeAudioAnalyzer();
    play();

    if (currentlyPlayingItem !== null) {
        currentlyPlayingItem.classList.remove("currently-playing");
    }
    currentlyPlayingItem = playlistItems[currentMusicIndex - 1];
    currentlyPlayingItem.classList.add("currently-playing");
}

const playlist = document.querySelector('.playlist');
let playlistItems = null;
let currentlyPlayingItem = null;

function displayPlaylist() {
  playlist.innerHTML = ""; // Clear the current playlist
  shuffledMusicsData.forEach((musicData, index) => {
    const playlistItem = document.createElement("li");
    playlistItem.className = "playlist-item";
    const playlistItemThumbnail = document.createElement("img");
    playlistItemThumbnail.className = "playlist-item-thumbnail";
    formattedTitle = musicData.title.replace(/ /g, '-');
    playlistItemThumbnail.src = `assets/images/${formattedTitle}.jpg`;
    playlistItem.appendChild(playlistItemThumbnail);
    const playlistItemInfo = document.createElement("h3");
    playlistItemInfo.className = "playlist-item-info";
    playlistItemInfo.textContent = musicData.title + " - ";
    playlistItemInfo.textContent += musicData.artist;
    playlistItem.appendChild(playlistItemInfo);
    playlistItem.setAttribute("data-index", index);
    playlist.appendChild(playlistItem);
  });
  playlistItems = document.querySelectorAll('.playlist-item');
  setupPlaylist();
}

function setupPlaylist() {
  playlistItems.forEach((playlistItem) => {
    playlistItem.addEventListener("click", () => {
      if (currentlyPlayingItem !== null) {
        currentlyPlayingItem.classList.remove("currently-playing");
      }
      const itemIndex = playlistItem.getAttribute("data-index");
      currentMusicIndex = parseInt(itemIndex) + 1;
      const itemData = shuffledMusicsData[itemIndex];
      populateUI(itemData);
      if (!audioContext) initializeAudioAnalyzer();
      play();
      playlistItem.classList.add("currently-playing");
      currentlyPlayingItem = playlistItem;
    });
  });
}

displayPlaylist();

const firstPlaylistItem = document.querySelector('.playlist-item');
firstPlaylistItem.classList.add('currently-playing');
currentlyPlayingItem = firstPlaylistItem;

const volumeControl = document.querySelector(".volume-control");
volumeControl.addEventListener("mousemove", function (e) {
    if (audio) {
        audio.volume = e.currentTarget.value / 100;
    }
})