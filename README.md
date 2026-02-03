# Back2Nokia – A Fun Learning Snake Game for Kids

## Project Overview
Back2Nokia is an educational version of the classic Nokia Snake game designed especially for children. It combines nostalgia with learning, where the snake eats not just food items, but also educational elements such as numbers, alphabets, and multiplication tables.

The game includes:
- User login system
- Personalized leaderboard
- Score tracking based on correct selections
- Random sequence game mode (Eat 1 → 2 → 3 → ...)
- Database-based progress storage

---

## Problem Statement
Old keypad phones and their iconic games have almost disappeared. The challenge is to bring this concept back in a new, meaningful, and engaging way for today’s generation.

---

## Proposed Solution
We create a learning-based Snake game where children learn while playing:
- Snake eats the next correct number or item
- Score increases for correct items
- Score decreases for wrong items
- Progress is saved using a backend database
- Tables (2–10) and alphabet learning can be added as modes

This approach revives a classic game while turning it into a learning tool.

---

## Target Users
- Primary school children (Age group: 5–12 years)

---

## Learning Outcomes
- Counting numbers in order  
- Understanding sequences  
- Basic multiplication tables  
- Letter recognition  
- Improves focus and speed

---

## Expected Impact
- Brings old Nokia-style game nostalgia back
- Makes learning fun and interactive
- Easy to extend for more topics like shapes, quizzes, vocabulary, etc.

---

## Technologies Used
- Java (Servlets)
- HTML, CSS, JavaScript
- Canvas Rendering
- Web Audio API (Sound Effects)
- Tomcat Server
- Database (MySQL/PostgreSQL)
- JDBC for DB Connection

---

## 🔊 Sound System (New Feature!)

The game now includes a complete audio experience with retro-style sound effects and background music!

### Sound Effects
All sound effects are generated programmatically using the **Web Audio API** - no external sound files needed!

| Sound | Trigger | Description |
|-------|---------|-------------|
| 🍎 **Eat Sound** | Snake eats food | Satisfying pop/chomp sound |
| ✅ **Correct Sound** | Correct answer (learning modes) | Happy ascending melody |
| ❌ **Wrong Sound** | Wrong answer (learning modes) | Descending buzz |
| 🎮 **Game Start** | Press Start button | Energetic startup fanfare |
| 💀 **Game Over** | Snake hits wall/self | Sad descending melody |
| ⏱️ **Countdown Beep** | 3-2-1 countdown | Beep sounds before game starts |
| 🖱️ **Click Sound** | UI interactions | Button click feedback |

### Background Music
- **Menu Music** - Calm ambient music on menu/home screens
- **Game Music** - Energetic music during active gameplay
- Music automatically switches between states

### Audio Controls
The floating music player in the corner provides:
- 🎵 Music toggle (play/pause)
- 🔊 Sound effects toggle (on/off)
- 🔉 Volume slider (controls both music and SFX)
- Settings are saved to localStorage

---

## Project Structure

```
Back2NokiaSnakeGame/
├── README.md
├── audio/                          # Audio files
│   ├── background-music.mp3        # Main background music
│   ├── menu-music.mp3              # Menu screen music
│   └── game-music.mp3              # In-game music
├── build/                          # Build output
├── src/
│   └── main/
│       ├── java/                   # Java Servlets
│       │   └── com/back2nokia/
│       │       ├── LoginServlet.java
│       │       ├── RegisterServlet.java
│       │       ├── SaveScoreServlet.java
│       │       └── LeaderboardServlet.java
│       └── webapp/                 # Web application files
│           ├── index.html          # Main menu page
│           ├── login.html          # Login page
│           ├── register.html       # Registration page
│           ├── game.html           # Full game (logged in users)
│           ├── demo-game.html      # Demo game (no login needed)
│           ├── leaderboard.html    # Leaderboard page
│           ├── css/
│           │   ├── styles.css      # Main styles (neon terminal theme)
│           │   └── demo-game.css   # Game-specific styles
│           ├── js/
│           │   ├── game.js         # Main game logic (full version)
│           │   ├── game-demo.js    # Demo game logic
│           │   ├── sound-effects.js # 🆕 Sound effects system (Web Audio API)
│           │   ├── music-player.js # 🆕 Enhanced music player with SFX toggle
│           │   ├── welcome.js      # Welcome animations
│           │   └── notify.js       # Toast notifications
│           ├── images/             # Game images and logos
│           └── META-INF/
│               └── context.xml     # Tomcat context config
└── .settings/                      # IDE settings
```

---

## Game Modes

| Mode | Description |
|------|-------------|
| **Classic** | Traditional snake - eat food to grow |
| **Counting** | Eat numbers in sequence (1 → 2 → 3 → ...) |
| **Alphabets** | Eat letters in order (A → B → C → ...) |
| **Times Tables** | Practice multiplication (2×1, 2×2, 2×3...) |

---

## How to Run

### Quick Start (Development)
```bash
cd src/main/webapp
python3 -m http.server 8080
```
Then open http://localhost:8080/index.html in your browser.

### Production (Tomcat)
1. Build the WAR file
2. Deploy to Tomcat server
3. Access via configured URL

---

## Controls
- **Arrow Keys** - Move the snake (↑ ↓ ← →)
- **Start Button** - Begin game with 3-2-1 countdown
- **Pause Button** - Pause/Resume game
- **Reset Button** - Restart the game
- **Save Score** - Save your score (requires login)

---

## Future Enhancements
- Mobile touch controls
- More game modes (shapes, vocabulary, quiz)
- Multiplayer support
- Achievement badges
- Custom themes/skins

---

## Credits
- Original Nokia Snake game concept
- Built with ❤️ for educational purposes
- Sound effects generated using Web Audio API
