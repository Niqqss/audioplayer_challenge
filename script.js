// Constants
const musicsData = [
    { title: "I Feel Fantastic", artist: "Riovaz", id: 1 },
    { title: "Bas Monde", artist: "La Fève", id: 2 },
    { title: "Tranquillement", artist: "Houdi", id: 3 },
    { title: "Waves", artist: "Freddie Joachim", id: 4 },
    { title: "Massage Situation", artist: "Flying Lotus", id: 5 },
    { title: "Cangaíba to 7 Mile", artist: "Sango", id: 6 },
];
const musicPlayer = document.querySelector('audio');
const musicTitle = document.querySelector('.music-title');
const artistName = document.querySelector('.artist-name');
const thumbnail = document.querySelector('.thumbnail');
const indexTxt = document.querySelector(".current-index");
const playBtn = document.querySelector('.play-btn');
const displayCurrentTime = document.querySelector('.current-time');
const durationTime = document.querySelector('.duration-time');
const progressBar = document.querySelector('.progress-bar');
const progressBarContainer = document.querySelector(".progress-container");
const nextBtn = document.querySelector('.next-btn');
const prevBtn = document.querySelector('.prev-btn');
const playlist = document.querySelector('.playlist');
const shuffleButtons = document.querySelectorAll(".shuffle-btn");
const showPlaylistBtn = document.querySelector(".show-playlist-btn");
const playlistContainer = document.querySelector(".top-info");
const volumeControl = document.querySelector(".volume-control");

// Variables
let currentMusicIndex = 1;
let current;
let totalDuration;
let rect = progressBarContainer.getBoundingClientRect();
let progressWidth = rect.width;
let shuffle = false;
let shuffledMusicsData = musicsData.slice();

// Functions
function populateUI({ title, artist }) {
    const formattedTitle = title.replace(/ /g, '-');
    musicTitle.textContent = title;
    artistName.textContent = artist;
    thumbnail.src = `assets/images/thumbnails/${formattedTitle}.jpg`;
    musicPlayer.src = `assets/audio/${formattedTitle}.mp3`;
    indexTxt.textContent = `${currentMusicIndex}/${musicsData.length}`;
}

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

function updateProgress(e) {
    current = e.srcElement.currentTime;
    formatValue(current, displayCurrentTime);

    const progressValue = current / totalDuration;
    progressBar.style.transform = `scaleX(${progressValue})`;
}

function setProgress(e) {
    const x = e.clientX - rect.left;
    musicPlayer.currentTime = (x / progressWidth) * totalDuration;
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
        currentlyPlayingItem.querySelector('img').classList.remove("hidden")
        currentlyPlayingItem.querySelector(".currently-playing-animation").classList.remove("visible")
    }
    currentlyPlayingItem = playlistItems[currentMusicIndex - 1];
    currentlyPlayingItem.querySelector('img').classList.add("hidden")
    currentlyPlayingItem.querySelector(".currently-playing-animation").classList.add("visible")
}

function setupPlaylist() {
    playlistItems.forEach((playlistItem) => {
        playlistItem.addEventListener("click", () => {
            if (currentlyPlayingItem !== null) {
                currentlyPlayingItem.querySelector('img').classList.remove("hidden")
                currentlyPlayingItem.querySelector(".currently-playing-animation").classList.remove("visible")
            }
            const itemIndex = playlistItem.getAttribute("data-index");
            currentMusicIndex = parseInt(itemIndex) + 1;
            const itemData = shuffledMusicsData[itemIndex];
            populateUI(itemData);
            if (!audioContext) initializeAudioAnalyzer();
            play();
            playlistItem.querySelector('img').classList.add("hidden")
            playlistItem.querySelector(".currently-playing-animation").classList.add("visible")
            currentlyPlayingItem = playlistItem;

            playlistContainer.classList.toggle("hide-playlist")
        });
    });
}

function displayPlaylist() {
    playlist.innerHTML = ""; // Clear the current playlist
    shuffledMusicsData.forEach((musicData, index) => {
        const playlistItem = document.createElement("li");
        playlistItem.setAttribute("data-index", index);
        playlistItem.className = "playlist-item";
        const playlistItemThumbnail = document.createElement("img");
        playlistItemThumbnail.className = "playlist-item-thumbnail";
        formattedTitle = musicData.title.replace(/ /g, '-');
        playlistItemThumbnail.src = `assets/images/thumbnails/${formattedTitle}.jpg`;
        playlistItem.appendChild(playlistItemThumbnail);
        const playlistItemInfo = document.createElement("h3");
        playlistItemInfo.className = "playlist-item-info";
        playlistItemInfo.textContent = musicData.title + " - ";
        playlistItemInfo.textContent += musicData.artist;
        const currentlyPlayingAnimation = document.createElement("div");
        currentlyPlayingAnimation.className = "currently-playing-animation";
        for (let i = 0; i < 4; i++) {
            const currentlyPlayingAnimationBar = document.createElement("div");
            currentlyPlayingAnimationBar.className = "currently-playing-animation-bar";
            currentlyPlayingAnimation.appendChild(currentlyPlayingAnimationBar);
        }
        playlistItem.appendChild(currentlyPlayingAnimation);
        playlistItem.appendChild(playlistItemInfo);
        playlist.appendChild(playlistItem);
    });
    playlistItems = document.querySelectorAll('.playlist-item');
    setupPlaylist();
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
        currentlyPlayingItem.querySelector('img').classList.remove("hidden")
        currentlyPlayingItem.querySelector(".currently-playing-animation").classList.remove("visible")
    }
    currentlyPlayingItem = playlistItems[currentMusicIndex - 1];
    currentlyPlayingItem.querySelector('img').classList.add("hidden")
    currentlyPlayingItem.querySelector(".currently-playing-animation").classList.add("visible")
}

function togglePlaylistContainer() {
    if (!playlistContainer.classList.contains("show-playlist")) {
      playlistContainer.classList.toggle("show-playlist");
    } else {
      playlistContainer.classList.toggle("hide-playlist");
    }
  }

function handleVolumeChange(e) {
    if (audio) {
      audio.volume = e.currentTarget.value / 100;
    }
  }

// Event listeners
playBtn.addEventListener('click', handlePlayPause);
musicPlayer.addEventListener("loadeddata", fillDurationVariables);
musicPlayer.addEventListener("timeupdate", updateProgress);
progressBarContainer.addEventListener("click", setProgress);
[prevBtn, nextBtn].forEach(btn => btn.addEventListener("click", changeSong));
musicPlayer.addEventListener("ended", changeSong);
shuffleButtons.forEach(shuffleBtn => {
    shuffleBtn.addEventListener("click", shufflePlaylist);
});
volumeControl.addEventListener("mousemove", handleVolumeChange);
showPlaylistBtn.addEventListener("click", togglePlaylistContainer);

// Initialize
populateUI(musicsData[currentMusicIndex - 1]);

displayPlaylist();

const firstPlaylistItem = document.querySelector('.playlist-item');
firstPlaylistItem.querySelector('img').classList.add("hidden");
firstPlaylistItem.querySelector(".currently-playing-animation").classList.add("visible");
currentlyPlayingItem = firstPlaylistItem;



