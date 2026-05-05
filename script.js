const controls = {
  signalType: document.getElementById('signalType'),
  length: document.getElementById('length'),
  amplitude: document.getElementById('amplitude'),
  frequency: document.getElementById('frequency'),
  phase: document.getElementById('phase'),
  decay: document.getElementById('decay'),
  width: document.getElementById('width'),
};

const values = {
  length: document.getElementById('lengthValue'),
  amplitude: document.getElementById('amplitudeValue'),
  frequency: document.getElementById('frequencyValue'),
  phase: document.getElementById('phaseValue'),
  decay: document.getElementById('decayValue'),
  width: document.getElementById('widthValue'),
};

const paramBlocks = {
  amplitude: document.querySelector('[data-param="amplitude"]'),
  frequency: document.querySelector('[data-param="frequency"]'),
  phase: document.querySelector('[data-param="phase"]'),
  decay: document.querySelector('[data-param="decay"]'),
  width: document.querySelector('[data-param="width"]'),
};

const timeCanvas = document.getElementById('timeCanvas');
const freqCanvas = document.getElementById('freqCanvas');

function showParams(signalType) {
  Object.values(paramBlocks).forEach((block) => block.classList.add('hidden'));
  paramBlocks.amplitude.classList.remove('hidden');

  if (signalType === 'sinusoid') {
    paramBlocks.frequency.classList.remove('hidden');
    paramBlocks.phase.classList.remove('hidden');
  } else if (signalType === 'damped') {
    paramBlocks.frequency.classList.remove('hidden');
    paramBlocks.decay.classList.remove('hidden');
  } else if (signalType === 'rect') {
    paramBlocks.width.classList.remove('hidden');
  }
}

function generateSignal() {
  const N = Number(controls.length.value);
  const amp = Number(controls.amplitude.value);
  const f0 = Number(controls.frequency.value);
  const phase = Number(controls.phase.value);
  const decay = Number(controls.decay.value);
  const width = Math.min(Number(controls.width.value), N);
  const type = controls.signalType.value;

  const x = [];
  for (let n = 0; n < N; n += 1) {
    let value = 0;
    if (type === 'sinusoid') {
      value = amp * Math.cos(2 * Math.PI * f0 * n + phase);
    } else if (type === 'damped') {
      value = amp * Math.pow(decay, n) * Math.cos(2 * Math.PI * f0 * n);
    } else {
      value = n < width ? amp : 0;
    }
    x.push(value);
  }
  return x;
}

function dtftMagnitude(x, bins = 512) {
  const N = x.length;
  const spectrum = [];
  for (let k = 0; k < bins; k += 1) {
    const omega = -Math.PI + (2 * Math.PI * k) / (bins - 1);
    let re = 0;
    let im = 0;
    for (let n = 0; n < N; n += 1) {
      re += x[n] * Math.cos(-omega * n);
      im += x[n] * Math.sin(-omega * n);
    }
    spectrum.push({ omega, mag: Math.hypot(re, im) });
  }
  return spectrum;
}

function drawStem(canvas, data, color = '#22d3ee') {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const maxAbs = Math.max(1e-6, ...data.map((v) => Math.abs(v)));
  const xScale = (w - 60) / Math.max(1, data.length - 1);
  const yMid = h / 2;
  const yScale = (h * 0.38) / maxAbs;

  ctx.strokeStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(40, yMid);
  ctx.lineTo(w - 20, yMid);
  ctx.stroke();

  ctx.strokeStyle = color;
  data.forEach((v, i) => {
    const x = 40 + i * xScale;
    const y = yMid - v * yScale;
    ctx.beginPath();
    ctx.moveTo(x, yMid);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, 2 * Math.PI);
    ctx.fill();
  });
}

function drawLine(canvas, points) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const maxMag = Math.max(1e-6, ...points.map((p) => p.mag));
  const xMin = -Math.PI;
  const xMax = Math.PI;
  const xScale = (w - 60) / (xMax - xMin);
  const yScale = (h - 40) / maxMag;

  ctx.strokeStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(40, h - 20);
  ctx.lineTo(w - 20, h - 20);
  ctx.stroke();

  ctx.strokeStyle = '#f472b6';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = 40 + (p.omega - xMin) * xScale;
    const y = h - 20 - p.mag * yScale;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.lineWidth = 1;
}

function updateReadouts() {
  values.length.textContent = controls.length.value;
  values.amplitude.textContent = Number(controls.amplitude.value).toFixed(2);
  values.frequency.textContent = Number(controls.frequency.value).toFixed(2);
  values.phase.textContent = Number(controls.phase.value).toFixed(2);
  values.decay.textContent = Number(controls.decay.value).toFixed(3);
  values.width.textContent = controls.width.value;

  controls.width.max = controls.length.value;
  if (Number(controls.width.value) > Number(controls.length.value)) {
    controls.width.value = controls.length.value;
    values.width.textContent = controls.width.value;
  }
}

function render() {
  updateReadouts();
  showParams(controls.signalType.value);
  const x = generateSignal();
  const X = dtftMagnitude(x);
  drawStem(timeCanvas, x);
  drawLine(freqCanvas, X);
}

Object.values(controls).forEach((el) => el.addEventListener('input', render));
render();
