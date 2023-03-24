const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');

const width = 1080;
const height = 1080;

let audio;
let audioContext, audioData, sourceNode, analyserNode;

const sketch = () => {
    const bins = [4, 12, 37, 175];

    return ({ context, width, height }) => {
        context.fillStyle = 'black';
        context.fillRect(0, 0, width, height);

        if (!audioContext) return;

        analyserNode.getFloatFrequencyData(audioData);

        for (let i = 0; i < bins.length; i++) {
            const bin = bins[i];
            const mapped = mapRange(audioData[bin], analyserNode.minDecibels, analyserNode.maxDecibels, 0, 1, true);
            const radius = mapped * 300;

            context.save();
            context.translate(width * 0.5, height * 0.5);

            // Draw multiple copies of the lines with reduced opacity and a slight offset
            for (let j = 0; j < 5; j++) {
                const alpha = (j + 1) / 5 * 0.1;
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

const addListeners = () => {
    // Add mouse event listener for desktop browsers
    window.addEventListener('mouseup', () => {
        toggleAudio();
    });

    // Add touch event listeners for mobile devices
    window.addEventListener('touchstart', () => {
        toggleAudio();
    });

    window.addEventListener('touchend', () => {
        toggleAudio();
    });

    window.addEventListener('touchcancel', () => {
        toggleAudio();
    });
};

const toggleAudio = () => {
    if (!audioContext) createAudio();

    if (audio.paused) {
        audio.play();
    }
    else {
        audio.pause();
    }
};


const createAudio = () => {
    audio = document.createElement('audio');
    audio.src = 'audio/2.wav';

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
    addListeners();
    const animate = () => {
        sketch()({ context, width, height });
        requestAnimationFrame(animate);
    };
    animate();
}

start();