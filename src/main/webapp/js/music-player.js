// Music player for Back2Nokia
document.addEventListener('DOMContentLoaded', function() {
  // Create music player HTML
  const musicPlayer = document.createElement('div');
  musicPlayer.className = 'music-player';
  musicPlayer.innerHTML = `
    <button id="playPauseBtn" class="music-btn">♪</button>
    <input type="range" id="volumeSlider" class="volume-slider" min="0" max="100" value="50">
  `;
  
  document.body.appendChild(musicPlayer);
  
  // Create audio element
  const audio = new Audio();
  
  // Set audio source - you need to add your own music file
  // For now, using a placeholder. Replace with your actual music file
  audio.src = 'background-music.mp3'; // Add your music file in audio folder
  audio.loop = true;
  audio.volume = 0.8; // Start at 50% volume
  
  const playPauseBtn = document.getElementById('playPauseBtn');
  const volumeSlider = document.getElementById('volumeSlider');
  
  let isPlaying = false;
  
  // Try to autoplay (modern browsers require user interaction)
  audio.play().then(() => {
    isPlaying = true;
    playPauseBtn.classList.add('active');
    playPauseBtn.textContent = '⏸';
  }).catch(error => {
    console.log('Autoplay prevented. User needs to interact first.');
    isPlaying = false;
    playPauseBtn.textContent = '♪';
  });
  
  // Play/Pause button
  playPauseBtn.addEventListener('click', function() {
    if (isPlaying) {
      audio.pause();
      playPauseBtn.classList.remove('active');
      playPauseBtn.textContent = '♪';
    } else {
      audio.play().then(() => {
        playPauseBtn.classList.add('active');
        playPauseBtn.textContent = '⏸';
      }).catch(error => {
        // If play fails, show message
        alert('Please interact with the page first, then click play.');
      });
    }
    isPlaying = !isPlaying;
  });
  
  // Volume slider
  volumeSlider.addEventListener('input', function() {
    audio.volume = this.value / 100;
  });
  
  // Save volume preference to localStorage
  volumeSlider.addEventListener('change', function() {
    localStorage.setItem('gameVolume', this.value);
  });
  
  // Load saved volume
  const savedVolume = localStorage.getItem('gameVolume');
  if (savedVolume) {
    volumeSlider.value = savedVolume;
    audio.volume = savedVolume / 100;
  }
  
  // Pause music when page is hidden
  document.addEventListener('visibilitychange', function() {
    if (document.hidden && isPlaying) {
      audio.pause();
      playPauseBtn.classList.remove('active');
      playPauseBtn.textContent = '♪';
      isPlaying = false;
    }
  });
});