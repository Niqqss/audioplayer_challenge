const musicsData = [
    { title: "Fantastic", artist: "Riovaz", id: 1 },
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

function populateUI({ title, artist }) {
    musicTitle.textContent = title;
    artistName.textContent = artist;
    thumbnail.src = `assets/images/${title}.jpg`;
    musicPlayer.src = `assets/audio/${title}.mp3`;
    indexTxt.textContent = `${currentMusicIndex}/${musicsData.length}`;
}

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

const shuffleBtn = document.querySelector(".shuffle");
shuffleBtn.addEventListener("click", switchShuffle);

let shuffle = false;
function switchShuffle() {
    // MODIFIER POUR LAFFICHAGE DU BOUTON SHUFFLE
    shuffleBtn.classList.toggle("active");
    shuffle = !shuffle;
}

const nextBtn = document.querySelector('.next-btn');
const prevBtn = document.querySelector('.prev-btn');

[prevBtn, nextBtn].forEach(btn => btn.addEventListener("click", changeSong));
musicPlayer.addEventListener("ended", changeSong);

function changeSong(e) {
    if (shuffle) {
        playAShuffledSong();
        return;
    }

    e.target.classList.contains("next-btn") || e.type === "ended" ? currentMusicIndex++ : currentMusicIndex--;

    if (currentMusicIndex < 1) {
        currentMusicIndex = musicsData.length;
    }
    else if (currentMusicIndex > musicsData.length) {
        currentMusicIndex = 1;
    }

    populateUI(musicsData[currentMusicIndex - 1]);
    if (!audioContext) initializeAudioAnalyzer();
    play();
}

function playAShuffledSong() {
    const musicsWithoutCurrentSong = musicsData.filter(el => el.id !== currentMusicIndex);
    const randomMusic = musicsWithoutCurrentSong[Math.trunc(Math.random() * musicsWithoutCurrentSong.length)];

    currentMusicIndex = randomMusic.id;
    populateUI(randomMusic);
    if (!audioContext) initializeAudioAnalyzer();
    play();
}

// CODE PERSO A REPLACER

const playlist = document.querySelector('.playlist');

musicsData.forEach(musicData => {
    const playlistItem = document.createElement("li");
    playlistItem.className = "playlist-item";
    const playlistItemThumbnail = document.createElement("img");
    playlistItemThumbnail.className = "playlist-item-thumbnail";
    playlistItemThumbnail.src = `assets/images/${musicData.title}.jpg`;
    playlistItem.appendChild(playlistItemThumbnail);
    const playlistItemInfo = document.createElement("h3");
    playlistItemInfo.className = "playlist-item-info";
    playlistItemInfo.textContent = musicData.title + " - ";
    playlistItemInfo.textContent += musicData.artist;
    playlistItem.appendChild(playlistItemInfo);
    playlist.appendChild(playlistItem);
});

const playlistItems = document.querySelectorAll('.playlist-item');
let currentlyPlayingItem = null;

playlistItems.forEach((playlistItem, index) => {

    playlistItem.addEventListener("click", () => {
        if (currentlyPlayingItem !== null) {
            currentlyPlayingItem.classList.remove("currently-playing");
        }
        const [title, artist] = playlistItem.textContent.split(" - ");
        const itemData = { title, artist };
        populateUI(itemData);
        if (!audioContext) initializeAudioAnalyzer();
        play();
        if (index + 1 === musicsData[index].id) {
            playlistItem.classList.add("currently-playing");
            currentlyPlayingItem = playlistItem;
        }
    });
});

const volumeControl = document.querySelector(".volume-control");
volumeControl.addEventListener("mousemove", function (e) {
    if (audio) {
        audio.volume = e.currentTarget.value / 100;
    }
})