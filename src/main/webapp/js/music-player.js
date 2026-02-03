// Music player for Back2Nokia - Enhanced with GameSounds integration
document.addEventListener('DOMContentLoaded', function() {
  // Create music player HTML
  const musicPlayer = document.createElement('div');
  musicPlayer.className = 'music-player';
  musicPlayer.innerHTML = `
    <button id="playPauseBtn" class="music-btn" title="Toggle Music">♪</button>
    <button id="soundFxBtn" class="music-btn" title="Toggle Sound Effects" style="font-size: 14px;">🔊</button>
    <input type="range" id="volumeSlider" class="volume-slider" min="0" max="100" value="50" title="Volume">
  `;
  
  document.body.appendChild(musicPlayer);
  
  // Create audio element for background music
  const audio = new Audio();
  
  // Set audio source - menu/idle music
  audio.src = 'audio/background-music.mp3';
  audio.loop = true;
  audio.volume = 0.4;
  
  const playPauseBtn = document.getElementById('playPauseBtn');
  const soundFxBtn = document.getElementById('soundFxBtn');
  const volumeSlider = document.getElementById('volumeSlider');
  
  let isMusicPlaying = false;
  let isSoundFxEnabled = true;

  // Initialize GameSounds if available
  function initGameSounds() {
    if (typeof GameSounds !== 'undefined') {
      GameSounds.init();
      isSoundFxEnabled = !GameSounds.isSoundMuted();
      updateSoundFxButton();
    }
  }

  // Update sound effects button appearance
  function updateSoundFxButton() {
    if (soundFxBtn) {
      soundFxBtn.textContent = isSoundFxEnabled ? '🔊' : '🔇';
      soundFxBtn.title = isSoundFxEnabled ? 'Sound Effects: ON' : 'Sound Effects: OFF';
    }
  }

  // Try to autoplay menu music (modern browsers require user interaction)
  function tryAutoplay() {
    audio.play().then(() => {
      isMusicPlaying = true;
      playPauseBtn.classList.add('active');
      playPauseBtn.textContent = '⏸';
    }).catch(error => {
      console.log('Autoplay prevented. User needs to interact first.');
      isMusicPlaying = false;
      playPauseBtn.textContent = '♪';
    });
  }

  // Delay autoplay attempt slightly
  setTimeout(tryAutoplay, 500);
  
  // Play/Pause button for background music
  playPauseBtn.addEventListener('click', function() {
    initGameSounds();
    
    if (isMusicPlaying) {
      audio.pause();
      playPauseBtn.classList.remove('active');
      playPauseBtn.textContent = '♪';
    } else {
      audio.play().then(() => {
        playPauseBtn.classList.add('active');
        playPauseBtn.textContent = '⏸';
      }).catch(error => {
        alert('Please interact with the page first, then click play.');
      });
    }
    isMusicPlaying = !isMusicPlaying;
  });

  // Sound effects toggle button
  soundFxBtn.addEventListener('click', function() {
    initGameSounds();
    
    if (typeof GameSounds !== 'undefined') {
      isSoundFxEnabled = !GameSounds.toggleMute();
      updateSoundFxButton();
      
      // Play a click sound if enabled (to confirm it's working)
      if (isSoundFxEnabled) {
        GameSounds.playClickSound();
      }
    } else {
      isSoundFxEnabled = !isSoundFxEnabled;
      updateSoundFxButton();
    }
  });
  
  // Volume slider - controls both music and sound effects
  volumeSlider.addEventListener('input', function() {
    const volume = this.value / 100;
    audio.volume = volume * 0.8; // Music slightly quieter
    
    // Also update GameSounds volume
    if (typeof GameSounds !== 'undefined') {
      GameSounds.setVolume(volume);
    }
  });
  
  // Save volume preference to localStorage
  volumeSlider.addEventListener('change', function() {
    localStorage.setItem('gameVolume', this.value);
  });
  
  // Load saved volume
  const savedVolume = localStorage.getItem('gameVolume');
  if (savedVolume) {
    volumeSlider.value = savedVolume;
    audio.volume = (savedVolume / 100) * 0.8;
    
    if (typeof GameSounds !== 'undefined') {
      GameSounds.setVolume(savedVolume / 100);
    }
  }
  
  // Pause music when page is hidden
  document.addEventListener('visibilitychange', function() {
    if (document.hidden && isMusicPlaying) {
      audio.pause();
      playPauseBtn.classList.remove('active');
      playPauseBtn.textContent = '♪';
      isMusicPlaying = false;
    }
  });

  // Stop menu music when game starts (game.js will play game music)
  window.addEventListener('gameStarted', function() {
    audio.pause();
    isMusicPlaying = false;
    playPauseBtn.classList.remove('active');
    playPauseBtn.textContent = '♪';
  });

  // Resume menu music when game ends
  window.addEventListener('gameEnded', function() {
    if (!isMusicPlaying) {
      audio.currentTime = 0;
      audio.play().then(() => {
        isMusicPlaying = true;
        playPauseBtn.classList.add('active');
        playPauseBtn.textContent = '⏸';
      }).catch(() => {});
    }
  });

  // Initialize on first interaction
  document.addEventListener('click', initGameSounds, { once: true });
  document.addEventListener('keydown', initGameSounds, { once: true });
});