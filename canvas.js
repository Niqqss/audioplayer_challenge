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
const angularVelocity = 0.00006;

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