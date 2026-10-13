
export type GameSound =
  | 'eat' | 'drink' | 'thunder' | 'grass-step' | 'gravel-step'
  | 'step' | 'horn' | 'impact'
  | 'interact'
  | 'talk'
  | 'coin'
  | 'job'
  | 'error'
  | 'event'
  | 'start'
  | 'wave';

let context: AudioContext | null = null;
let master: GainNode | null = null;
let noiseSource: AudioBufferSourceNode | null = null;
let rainGain: GainNode | null=null;
let weatherNight=0;
export function updateWeatherAudio(rain:number,night:number){weatherNight=night;if(context&&rainGain)rainGain.gain.setTargetAtTime(rain*.28,context.currentTime,.8);}
let birdTimer: number | null = null;
let enabled = false;
let volume = 0.75;
let sfxGain: GainNode | null=null, ambienceGain: GainNode | null=null;
let motor: OscillatorNode | null=null, motorGain: GainNode | null=null;
let sfxVolume=.8, ambienceVolume=.45;
export function setAudioChannel(channel:'sfx'|'ambience',value:number){const v=Math.max(0,Math.min(1,value));if(channel==='sfx'){sfxVolume=v;if(sfxGain)sfxGain.gain.value=v;}else{ambienceVolume=v;if(ambienceGain)ambienceGain.gain.value=v;}}
export function updateEngineSound(speed:number,driving:boolean,rpm=900){if(!context||!motor||!motorGain)return;motor.frequency.setTargetAtTime(35+Math.max(0,rpm)*.025,context.currentTime,.15);motorGain.gain.setTargetAtTime(driving?.025+Math.abs(speed)*.001:0,context.currentTime,.12);}

function tone(
  frequency: number,
  duration: number,
  level: number,
  delay = 0,
  shape: OscillatorType = 'sine',
  endFrequency = frequency,
  ambient = false
): void {
  if (!context || !master || !enabled) return;

  const start = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const envelope = context.createGain();

  oscillator.type = shape;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(1, endFrequency),
    start + duration
  );

  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(
    Math.max(0.0002, level),
    start + 0.016
  );
  envelope.gain.exponentialRampToValueAtTime(
    0.0001,
    start + duration
  );

  oscillator.connect(envelope);
  envelope.connect((ambient?ambienceGain:sfxGain)||master);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.025);

  oscillator.onended = () => {
    oscillator.disconnect();
    envelope.disconnect();
  };
}

export function playGameSound(sound: GameSound): void {
  if (!enabled || context?.state !== 'running') return;

  switch (sound) {
    case 'eat': tone(140,.09,.06,0,'triangle',80);tone(170,.09,.04,.2,'triangle',100);break;
    case 'drink': tone(420,.22,.035,0,'sine',140);break;
    case 'thunder': tone(48,1.8,.14,.35,'sawtooth',24,true);tone(62,1.4,.07,.55,'triangle',28,true);break;
    case 'grass-step': tone(75,.065,.015,0,'triangle',45);break;
    case 'gravel-step': tone(160,.07,.018,0,'sawtooth',80);break;
    case 'step': tone(100,.055,.026,0,'triangle',65); break;
    case 'horn': tone(280,.28,.06,0,'sawtooth'); tone(355,.28,.04,0,'triangle'); break;
    case 'impact': tone(90,.18,.075,0,'triangle',25); break;
    case 'start':
      tone(523, 0.17, 0.17);
      tone(659, 0.17, 0.17, 0.13);
      tone(784, 0.34, 0.2, 0.26);
      break;

    case 'interact':
      tone(450, 0.095, 0.11, 0, 'triangle', 510);
      break;

    case 'talk':
      tone(330, 0.09, 0.09, 0, 'triangle', 385);
      tone(390, 0.085, 0.075, 0.095, 'triangle');
      break;

    case 'coin':
      tone(710, 0.11, 0.17, 0, 'sine', 810);
      tone(980, 0.2, 0.19, 0.095);
      break;

    case 'job':
      tone(392, 0.15, 0.18);
      tone(523, 0.15, 0.18, 0.14);
      tone(659, 0.16, 0.18, 0.28);
      tone(784, 0.32, 0.21, 0.42);
      break;

    case 'error':
      tone(250, 0.21, 0.12, 0, 'triangle', 180);
      break;

    case 'event':
      tone(530, 0.18, 0.12, 0, 'triangle', 390);
      tone(530, 0.18, 0.12, 0.23, 'triangle', 390);
      break;

    case 'wave':
      tone(600, 0.12, 0.08, 0, 'sine', 820);
      break;
  }
}

function birdChirp(): void {
  if (!enabled || context?.state !== 'running') return;

  if(weatherNight>.8){tone(2200,.045,.008,0,'sine',1800,true);return;}
  tone(1160, 0.12, 0.03, 0, 'sine', 1750,true);
  tone(1420, 0.115, 0.025, 0.16, 'sine', 1880,true);
}

function beginAmbience(
  ctx: AudioContext,
  destination: GainNode
): void {
  const buffer = ctx.createBuffer(
    1,
    ctx.sampleRate * 3,
    ctx.sampleRate
  );
  const samples = buffer.getChannelData(0);

  for (let i = 0; i < samples.length; i++) {
    samples[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 160;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 1500;

  const windGain = ctx.createGain();
  windGain.gain.value = 0.16;

  source.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(windGain);
  windGain.connect(destination);
  const rainFilter=ctx.createBiquadFilter();rainFilter.type='lowpass';rainFilter.frequency.value=4500;
  rainGain=ctx.createGain();rainGain.gain.value=0;source.connect(rainFilter);rainFilter.connect(rainGain);rainGain.connect(destination);

  source.start();
  noiseSource = source;

  birdTimer = window.setInterval(birdChirp, 6500);
  birdChirp();
}

export async function startGameAudio(): Promise<void> {
  if (enabled && context) {
    await context.resume();
    return;
  }

  // Must be called from a user interaction.
  const ctx = new AudioContext();
  const gain = ctx.createGain();

  gain.gain.value = volume;
  gain.connect(ctx.destination);

  context = ctx;
  master = gain;
  enabled = true;

  try {
    await ctx.resume();

    if (!enabled || context !== ctx) return;

    sfxGain=ctx.createGain();sfxGain.gain.value=sfxVolume;sfxGain.connect(gain);
    ambienceGain=ctx.createGain();ambienceGain.gain.value=ambienceVolume;ambienceGain.connect(gain);
    motor=ctx.createOscillator();motor.type='triangle';motor.frequency.value=45;
    motorGain=ctx.createGain();motorGain.gain.value=0;motor.connect(motorGain);motorGain.connect(sfxGain);motor.start();
    beginAmbience(ctx, ambienceGain);
    playGameSound('start');
  } catch (error) {
    await stopGameAudio();
    throw error;
  }
}

export async function stopGameAudio(): Promise<void> {
  enabled = false;

  if (birdTimer !== null) {
    window.clearInterval(birdTimer);
    birdTimer = null;
  }

  if (noiseSource) {
    try {
      noiseSource.stop();
    } catch {
      // Already stopped.
    }

    noiseSource.disconnect();
    noiseSource = null;
  }

  rainGain?.disconnect();rainGain=null;
  motor?.stop();motor?.disconnect();motorGain?.disconnect();motor=null;motorGain=null;sfxGain=null;ambienceGain=null;
  const old = context;
  context = null;
  master = null;

  if (old && old.state !== 'closed') {
    await old.close();
  }
}

export function setGameAudioVolume(next: number): void {
  volume = Math.max(0, Math.min(1, next));

  if (master && context) {
    master.gain.setTargetAtTime(
      volume,
      context.currentTime,
      0.03
    );
  }
}
