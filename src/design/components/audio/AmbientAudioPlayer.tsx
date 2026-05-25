import { useEffect, useState } from 'react';

const ambientTrack = {
  name: 'CYBERPUNK 2077 SOUNDTRACK - NIGHT CITY by R E L & Artemis Delta',
  src: '/mp3/theme.mp3',
};

const maxVolume = 0.06;
const initialVolume = 0.02;
let ambientAudio: HTMLAudioElement | null = null;
let ambientStarted = false;

function getAmbientAudio() {
  if (!ambientAudio) {
    ambientAudio = new Audio(ambientTrack.src);
    ambientAudio.loop = true;
    ambientAudio.preload = 'auto';
    ambientAudio.volume = initialVolume;
  }

  return ambientAudio;
}

export function AmbientAudioPlayer() {
  const [enabled, setEnabled] = useState(ambientStarted);
  const [playing, setPlaying] = useState(() => Boolean(ambientAudio && !ambientAudio.paused));
  const [volume, setVolume] = useState(initialVolume);

  async function playAmbient() {
    const audio = getAmbientAudio();

    audio.volume = volume;

    try {
      await audio.play();
      ambientStarted = true;
      setEnabled(true);
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }

  function pauseAmbient() {
    getAmbientAudio().pause();
    setPlaying(false);
  }

  function togglePlayback() {
    if (playing) {
      pauseAmbient();
      return;
    }

    void playAmbient();
  }

  function changeVolume(nextVolume: number) {
    const clampedVolume = Math.min(maxVolume, nextVolume);

    setVolume(clampedVolume);

    getAmbientAudio().volume = clampedVolume;
  }

  useEffect(() => {
    const audio = getAmbientAudio();

    audio.volume = volume;
    setPlaying(!audio.paused);
    setEnabled(ambientStarted);

    const syncPlaying = () => setPlaying(!audio.paused);

    audio.addEventListener('play', syncPlaying);
    audio.addEventListener('pause', syncPlaying);

    return () => {
      audio.removeEventListener('play', syncPlaying);
      audio.removeEventListener('pause', syncPlaying);
    };
  }, []);

  useEffect(() => {
    if (enabled) return;

    const startOnInteraction = () => {
      void playAmbient();
    };

    document.addEventListener('pointerdown', startOnInteraction);
    document.addEventListener('click', startOnInteraction);
    document.addEventListener('touchstart', startOnInteraction);
    document.addEventListener('keydown', startOnInteraction);

    return () => {
      document.removeEventListener('pointerdown', startOnInteraction);
      document.removeEventListener('click', startOnInteraction);
      document.removeEventListener('touchstart', startOnInteraction);
      document.removeEventListener('keydown', startOnInteraction);
    };
  }, [enabled, volume]);

  return (
    <div className="ambient-player" aria-label="Som ambiente">
      <button
        type="button"
        className="ambient-player-button"
        aria-label={playing ? 'Pausar som ambiente' : 'Tocar som ambiente'}
        title={playing ? 'Pausar' : 'Tocar'}
        onClick={togglePlayback}
      >
        <span className={playing ? 'ambient-icon-pause' : 'ambient-icon-play'} aria-hidden="true" />
      </button>
      <div className="ambient-player-marquee" aria-label={ambientTrack.name}>
        <span>{ambientTrack.name}</span>
      </div>
      <input
        className="ambient-player-volume"
        type="range"
        min="0"
        max={maxVolume}
        step="0.01"
        value={volume}
        aria-label="Volume do som ambiente"
        onChange={(event) => changeVolume(Number(event.target.value))}
      />
    </div>
  );
}
