/**
 * Sound Effects Manager for Back2Nokia Snake Game
 * Uses Web Audio API to generate retro-style game sounds programmatically
 */

const GameSounds = (function() {
  'use strict';

  // Audio context (created on first user interaction)
  let audioCtx = null;
  let isInitialized = false;
  let isMuted = false;
  let masterVolume = 0.5;

  // Background music elements
  let menuMusic = null;
  let gameMusic = null;
  let currentBgMusic = null;

  // Initialize audio context (must be called after user interaction)
  function init() {
    if (isInitialized) return true;
    
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      isInitialized = true;
      console.log('[GameSounds] Audio context initialized');
      
      // Create background music elements
      createBackgroundMusic();
      
      return true;
    } catch (e) {
      console.error('[GameSounds] Failed to initialize audio context:', e);
      return false;
    }
  }

  // Ensure audio context is running (for browsers that suspend it)
  function ensureContext() {
    if (!audioCtx) {
      init();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Create a simple oscillator-based sound
  function playTone(frequency, duration, type = 'square', volume = 0.3, attack = 0.01, decay = 0.1) {
    if (!isInitialized || isMuted) return;
    ensureContext();

    try {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

      // Envelope
      const now = audioCtx.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume * masterVolume, now + attack);
      gainNode.gain.linearRampToValueAtTime(volume * masterVolume * 0.7, now + attack + decay);
      gainNode.gain.linearRampToValueAtTime(0, now + duration);

      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch (e) {
      console.warn('[GameSounds] Error playing tone:', e);
    }
  }

  // Play a sequence of tones (for melodies)
  function playSequence(notes, baseVolume = 0.25) {
    if (!isInitialized || isMuted) return;
    ensureContext();

    let time = audioCtx.currentTime;
    notes.forEach(note => {
      const [freq, duration, type = 'square'] = note;
      setTimeout(() => {
        playTone(freq, duration, type, baseVolume);
      }, (time - audioCtx.currentTime) * 1000 + note[3] || 0);
      time += duration * 0.8;
    });
  }

  // ============ GAME SOUND EFFECTS ============

  // Food eat sound - satisfying pop/chomp
  function playEatSound() {
    if (!isInitialized || isMuted) return;
    ensureContext();

    try {
      // Pop sound - quick frequency sweep up
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.type = 'sine';
      osc2.type = 'square';
      
      const now = audioCtx.currentTime;
      
      // Frequency sweep for pop effect
      osc1.frequency.setValueAtTime(300, now);
      osc1.frequency.exponentialRampToValueAtTime(800, now + 0.05);
      osc1.frequency.exponentialRampToValueAtTime(400, now + 0.1);
      
      osc2.frequency.setValueAtTime(150, now);
      osc2.frequency.exponentialRampToValueAtTime(400, now + 0.05);
      
      // Volume envelope
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.4 * masterVolume, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.15);
      osc2.stop(now + 0.15);
    } catch (e) {
      console.warn('[GameSounds] Error playing eat sound:', e);
    }
  }

  // Correct answer sound - happy ascending notes
  function playCorrectSound() {
    if (!isInitialized || isMuted) return;
    ensureContext();

    try {
      const notes = [
        [523.25, 0.08], // C5
        [659.25, 0.08], // E5
        [783.99, 0.15], // G5
      ];
      
      let delay = 0;
      notes.forEach(([freq, dur]) => {
        setTimeout(() => playTone(freq, dur, 'square', 0.3), delay * 1000);
        delay += dur * 0.7;
      });
    } catch (e) {
      console.warn('[GameSounds] Error playing correct sound:', e);
    }
  }

  // Wrong answer sound - descending buzz
  function playWrongSound() {
    if (!isInitialized || isMuted) return;
    ensureContext();

    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.type = 'sawtooth';
      
      const now = audioCtx.currentTime;
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(150, now + 0.2);
      
      gain.gain.setValueAtTime(0.35 * masterVolume, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.25);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn('[GameSounds] Error playing wrong sound:', e);
    }
  }

  // Game start sound - energetic startup melody
  function playGameStartSound() {
    if (!isInitialized || isMuted) return;
    ensureContext();

    try {
      // Retro game start fanfare
      const notes = [
        [261.63, 0.1],  // C4
        [329.63, 0.1],  // E4
        [392.00, 0.1],  // G4
        [523.25, 0.15], // C5
        [659.25, 0.1],  // E5
        [783.99, 0.25], // G5
      ];
      
      let delay = 0;
      notes.forEach(([freq, dur]) => {
        setTimeout(() => playTone(freq, dur, 'square', 0.3), delay * 1000);
        delay += dur * 0.85;
      });
    } catch (e) {
      console.warn('[GameSounds] Error playing game start sound:', e);
    }
  }

  // Game over sound - sad descending melody
  function playGameOverSound() {
    if (!isInitialized || isMuted) return;
    ensureContext();

    try {
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.type = 'square';
      osc2.type = 'sawtooth';
      
      const now = audioCtx.currentTime;
      
      // Descending sad tone
      osc1.frequency.setValueAtTime(440, now);
      osc1.frequency.linearRampToValueAtTime(220, now + 0.3);
      osc1.frequency.linearRampToValueAtTime(110, now + 0.6);
      
      osc2.frequency.setValueAtTime(220, now);
      osc2.frequency.linearRampToValueAtTime(110, now + 0.3);
      osc2.frequency.linearRampToValueAtTime(55, now + 0.6);
      
      gain.gain.setValueAtTime(0.4 * masterVolume, now);
      gain.gain.linearRampToValueAtTime(0.2 * masterVolume, now + 0.3);
      gain.gain.linearRampToValueAtTime(0, now + 0.8);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.8);
      osc2.stop(now + 0.8);
    } catch (e) {
      console.warn('[GameSounds] Error playing game over sound:', e);
    }
  }

  // Countdown beep
  function playCountdownBeep(isLast = false) {
    if (!isInitialized || isMuted) return;
    ensureContext();

    const freq = isLast ? 880 : 440;
    const dur = isLast ? 0.3 : 0.15;
    playTone(freq, dur, 'square', 0.35);
  }

  // Button click sound
  function playClickSound() {
    if (!isInitialized || isMuted) return;
    ensureContext();
    playTone(800, 0.05, 'square', 0.2);
  }

  // ============ BACKGROUND MUSIC ============

  function createBackgroundMusic() {
    // Menu music - calm, looping ambient
    menuMusic = document.createElement('audio');
    menuMusic.loop = true;
    menuMusic.volume = 0.3 * masterVolume;
    
    // Game music - more energetic
    gameMusic = document.createElement('audio');
    gameMusic.loop = true;
    gameMusic.volume = 0.25 * masterVolume;

    // Try to load external music files if they exist
    menuMusic.src = 'audio/menu-music.mp3';
    gameMusic.src = 'audio/game-music.mp3';

    // Fallback: If files don't exist, we'll use generated music
    menuMusic.onerror = () => {
      console.log('[GameSounds] Menu music file not found, using generated music');
      menuMusic.src = 'audio/background-music.mp3'; // fallback to existing
    };
    
    gameMusic.onerror = () => {
      console.log('[GameSounds] Game music file not found, using menu music as fallback');
      gameMusic.src = 'audio/background-music.mp3'; // fallback to existing
    };
  }

  function playMenuMusic() {
    if (isMuted) return;
    stopAllMusic();
    
    if (menuMusic) {
      menuMusic.volume = 0.3 * masterVolume;
      menuMusic.play().catch(e => console.log('[GameSounds] Menu music autoplay blocked'));
      currentBgMusic = menuMusic;
    }
  }

  function playGameMusic() {
    if (isMuted) return;
    stopAllMusic();
    
    if (gameMusic) {
      gameMusic.volume = 0.25 * masterVolume;
      gameMusic.play().catch(e => console.log('[GameSounds] Game music autoplay blocked'));
      currentBgMusic = gameMusic;
    }
  }

  function stopAllMusic() {
    if (menuMusic) {
      menuMusic.pause();
      menuMusic.currentTime = 0;
    }
    if (gameMusic) {
      gameMusic.pause();
      gameMusic.currentTime = 0;
    }
    currentBgMusic = null;
  }

  function pauseMusic() {
    if (currentBgMusic) {
      currentBgMusic.pause();
    }
  }

  function resumeMusic() {
    if (currentBgMusic && !isMuted) {
      currentBgMusic.play().catch(e => {});
    }
  }

  // ============ VOLUME & MUTE CONTROLS ============

  function setVolume(vol) {
    masterVolume = Math.max(0, Math.min(1, vol));
    if (menuMusic) menuMusic.volume = 0.3 * masterVolume;
    if (gameMusic) gameMusic.volume = 0.25 * masterVolume;
    localStorage.setItem('gameSoundVolume', masterVolume);
  }

  function getVolume() {
    return masterVolume;
  }

  function toggleMute() {
    isMuted = !isMuted;
    if (isMuted) {
      pauseMusic();
    } else {
      resumeMusic();
    }
    localStorage.setItem('gameSoundMuted', isMuted);
    return isMuted;
  }

  function setMuted(muted) {
    isMuted = muted;
    if (isMuted) {
      pauseMusic();
    } else {
      resumeMusic();
    }
    localStorage.setItem('gameSoundMuted', isMuted);
  }

  function isSoundMuted() {
    return isMuted;
  }

  // Load saved preferences
  function loadPreferences() {
    const savedVolume = localStorage.getItem('gameSoundVolume');
    if (savedVolume !== null) {
      masterVolume = parseFloat(savedVolume);
    }
    
    const savedMuted = localStorage.getItem('gameSoundMuted');
    if (savedMuted !== null) {
      isMuted = savedMuted === 'true';
    }
  }

  // Initialize preferences on load
  loadPreferences();

  // Public API
  return {
    init,
    ensureContext,
    
    // Sound effects
    playEatSound,
    playCorrectSound,
    playWrongSound,
    playGameStartSound,
    playGameOverSound,
    playCountdownBeep,
    playClickSound,
    
    // Background music
    playMenuMusic,
    playGameMusic,
    stopAllMusic,
    pauseMusic,
    resumeMusic,
    
    // Volume controls
    setVolume,
    getVolume,
    toggleMute,
    setMuted,
    isSoundMuted,
    
    // State
    isInitialized: () => isInitialized
  };
})();

// Auto-initialize on first user interaction
document.addEventListener('click', function initOnClick() {
  GameSounds.init();
  document.removeEventListener('click', initOnClick);
}, { once: true });

document.addEventListener('keydown', function initOnKey() {
  GameSounds.init();
  document.removeEventListener('keydown', initOnKey);
}, { once: true });

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameSounds;
}
