# 🔥 ROAST REPO

**Where your GitHub reputation comes to die**

A futuristic React + Vite web app that delivers savage code critiques with terminal-style aesthetics and sea-green cyberpunk vibes.

## 🚀 Features

- **Non-scrollable Single Page Design**: Full viewport experience with smooth state transitions
- **Futuristic Terminal UI**: Sea-green/teal color scheme with glowing effects
- **Interactive Loading Animations**: ASCII art and progress bars with particle effects
- **Smart GitHub Input**: Accepts usernames or full GitHub URLs with real-time validation
- **Typewriter Roast Display**: Variable-speed typing animation with cursor effects
- **Matrix Background**: Animated grid pattern with floating particles

## 🎨 Design Highlights

### Color Palette
- **Primary**: Sea green/teal (#00CEC9, #00B894)
- **Secondary**: Darker teals (#00A085, #008B75)  
- **Accent**: Bright cyan (#00FFFF)
- **Background**: Dark navy/black (#0D1117, #161B22)
- **Text**: Light cyan/white (#E6FFFA, #FFFFFF)

### Typography
- **Font**: JetBrains Mono (monospace)
- **Effects**: Text glow, border glow, pulse animations
- **Style**: Terminal/command-line aesthetics

## 🛠 Tech Stack

- **React 18+** with hooks (useState, useEffect)
- **Vite** for build tooling and dev server
- **Tailwind CSS** for styling with custom extensions
- **TypeScript** for type safety
- **CSS3** for advanced animations and effects

## 📱 Component Architecture

### `App.tsx`
Main application component managing three states:
- `loading` - Initial 3-second site load
- `input` - GitHub username input form  
- `processing` - 6-second roast generation
- `roast` - Typewriter display of roast text

### `LoadingAnimation.jsx`
Handles both initial loading and processing states:
- ASCII art logo animation
- Progress bar with percentage
- Cycling loading messages
- Floating particle effects

### `GitHubInput.jsx`
Terminal-style input form:
- Real-time GitHub URL/username validation
- Glowing focus effects
- Terminal window styling
- Enter key submission

### `TypewriterText.jsx`
Animated text display:
- Variable typing speeds
- Cursor blink animation
- Restart functionality
- Terminal-style formatting

### `extractUsername.js`
Utility functions:
- Extract username from various GitHub URL formats
- Validate GitHub username format
- Handle edge cases and sanitization

## 🎯 Usage Examples

The app accepts various GitHub input formats:
- `octocat`
- `github.com/octocat`
- `https://github.com/octocat/Hello-World`

## 🔧 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## ⚡ Performance Features

- **No Scrolling**: Fixed viewport design prevents layout shifts
- **Optimized Animations**: CSS3 transforms and transitions
- **Lazy Effects**: Particles and backgrounds use efficient CSS animations
- **Smart State Management**: Minimal re-renders with proper React hooks

## 🎭 Roast Mechanics

The app generates different roast styles based on username characteristics:
- **Short usernames** (<5 chars): "Minimalist" roasts
- **Long usernames** (>10 chars): "Prolific developer" roasts  
- **Standard usernames**: General developer roasts

## ⚠️ Disclaimer

This app is for entertainment purposes only. No actual GitHub data is accessed. All roasts are generated client-side using username characteristics only.

---

**Built with ❤️ and maximum sass**
