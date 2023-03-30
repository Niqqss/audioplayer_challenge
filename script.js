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

const resizeCanvas = () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    width = canvas.width;
    height = canvas.height;
};

let audio;
let audioContext, audioData, sourceNode, analyserNode;

const sketch = () => {
    const bins = [4, 12, 37, 165];

    return ({ context, width, height }) => {
        context.fillStyle = 'black';
        context.fillRect(0, 0, width, height);

        if (!audioContext) return;

        analyserNode.getFloatFrequencyData(audioData);

        for (let i = 0; i < bins.length; i++) {
            const bin = bins[i];
            const mapped = mapRange(audioData[bin], analyserNode.minDecibels, analyserNode.maxDecibels, 0, 1, true);
            const radius = mapped * 200;

            context.save();
            context.translate(width * 0.5, height * 0.5);

            // Draw multiple copies of the lines with reduced opacity and a slight offset
            for (let j = 0; j < 5; j++) {
                const alpha = (j + 1) / 5 * 0.15;
                const offset = j - 2;
                context.beginPath();
                context.arc(offset, offset, radius, 0, Math.PI * 2);
                context.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                context.lineWidth = 10;
                context.stroke();
            }

            context.restore();
        }
    };
};

const initializeAudioAnalyzer = () => {
    audio = document.querySelector('audio');

    audioContext = new AudioContext();

    sourceNode = audioContext.createMediaElementSource(audio);
    sourceNode.connect(audioContext.destination);

    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 512;
    analyserNode.smoothingTimeConstant = 0.95;
    sourceNode.connect(analyserNode);

    audioData = new Float32Array(analyserNode.frequencyBinCount);
}

const getAverage = (data) => {
    let sum = 0;

    for (let i = 0; i < data.length; i++) {
        sum += data[i];
    }

    return sum / data.length;
}

function mapRange(value, low1, high1, low2, high2, clamped) {
    const val = low2 + (high2 - low2) * (value - low1) / (high1 - low1);
    if (clamped) {
        if (low2 < high2) {
            if (val < low2) return low2;
            else if (val > high2) return high2;
        } else {
            if (val > low2) return low2;
            else if (val < high2) return high2;
        }
    }
    return val;
}

const start = async () => {
    const animate = () => {
        sketch()({ context, width, height });
        requestAnimationFrame(animate);
    };
    animate();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
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
    thumbnail.src = `./assets/images/${title}.jpg`;
    musicPlayer.src = `./assets/audio/${title}.mp3`;
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

const playlistContainer = document.querySelector('.playlist-container');
const switchContentBtn = document.querySelector('.switch-content-btn');

switchContentBtn.addEventListener("click", () => {
    playlistContainer.classList.toggle("visible");
    thumbnail.classList.toggle("hidden");
})

const playlist = document.querySelector('.playlist');

musicsData.forEach(musicData => {
    const playlistItem = document.createElement("li");
    playlistItem.className = "playlist-item";
    const playlistItemThumbnail = document.createElement("img");
    playlistItemThumbnail.className = "playlist-item-thumbnail";
    playlistItemThumbnail.src = `./assets/images/${musicData.title}.jpg`;
    playlistItem.appendChild(playlistItemThumbnail);
    const playlistItemInfo = document.createElement("h3");
    playlistItemInfo.className = "playlist-item-info";
    playlistItemInfo.textContent = musicData.title + " - ";
    playlistItemInfo.textContent += musicData.artist;
    playlistItem.appendChild(playlistItemInfo);
    playlist.appendChild(playlistItem);
});

const playlistItems = document.querySelectorAll('.playlist-item');

playlistItems.forEach(playlistItem => {
    const [title, artist] = playlistItem.textContent.split(" - ");
    const musicData = { title, artist};

    if (title === musicTitle.textContent) {
        playlistItem.classList.toggle("currently-playing");
    }

    playlistItem.addEventListener("click", () => {
        playlistItem.classList.toggle("currently-playing");
        populateUI(musicData);
        if (!audioContext) initializeAudioAnalyzer();
        play();
    });
});
