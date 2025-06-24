# Cromestesia - Music Visualization Therapy App

An interactive web-based music visualization application designed specifically for music therapy sessions with students who have physical and learning disabilities.

## 🌟 Live Demo
**Try it now:** [https://magnatronic.github.io/cromestesia/](https://magnatronic.github.io/cromestesia/)

*Note: You'll need to grant microphone permission when prompted*

## 🎵 Features

### Real-Time Audio Processing
- **Live microphone input** for instruments, singing, and ambient playback
- **Web Audio API** with Fast Fourier Transform (FFT) analysis
- **Frequency band detection** to differentiate bass (drums), mid (vocals), and treble (cymbals, hi-hats)
- **Adjustable sensitivity** for different audio environments

### Visualization Modes
- **🥁 Drums Mode**: Activity-based visualization for percussion
  - Kick drums → Screen pulses
  - Snare → Radial ripples  
  - Hi-hats → Flickering sparks
- **🎤 Singing Mode**: Vocal-focused effects
  - High notes → Twinkling particles
  - Sustained notes → Flowing waves
  - Harmonics → Color gradients
- **🎵 Ambient Mode**: For background music and CDs
  - Classic graphic equalizer bars
  - Gentle waveform overlays

### Visual Themes
- **🌌 Space**: Starfields, solar flares, nebula ripples
- **🌊 Underwater**: Bubbles, current flows, shifting light rays
- **🌲 Forest**: Leaves, bioluminescent trails, dappled light patterns  
- **◐ Mono**: Clean black and white bars and curves for sensory-sensitive environments

### Accessibility Features
- **Tablet-optimized interface** with large, touch-friendly controls
- **High contrast mode** for users with visual impairments
- **Screen reader support** with ARIA labels and live regions
- **Keyboard navigation** for all interactive elements
- **Audio level indicators** for monitoring input levels
- **Non-verbal UI** with icon-based controls requiring minimal reading

## 🚀 Quick Start

### Prerequisites
- Modern web browser with microphone access
- Node.js 16+ (for development)

### Installation
```bash
# Clone or download the project
cd cromestesia

# Install dependencies
npm install

# Start development server
npm run dev
```

### Usage
1. **Grant microphone permission** when prompted by your browser
2. **Click "Start"** to begin audio capture and visualization
3. **Select a mode** based on your activity (Drums, Singing, or Ambient)
4. **Choose a theme** that fits your session environment
5. **Adjust settings** via the settings panel for optimal experience

## 🎛️ Controls

### Main Interface
- **Start/Stop**: Begin or end audio visualization
- **Mode Selection**: Choose visualization style based on musical activity
- **Theme Selection**: Pick visual environment and color scheme
- **Audio Level**: Monitor microphone input levels

### Settings Panel
- **High Contrast**: Enhanced visibility for users with visual impairments
- **Animation Speed**: Adjust visual motion intensity (0.1x to 2x speed)
- **Audio Sensitivity**: Control responsiveness to audio input (0.1x to 3x)

## 🔧 Technical Details

### Technology Stack
- **Frontend**: Vanilla JavaScript with Vite build tool
- **Audio**: Web Audio API with AnalyserNode for real-time frequency analysis
- **Graphics**: HTML5 Canvas 2D for smooth 60fps animations
- **Styling**: Modern CSS with CSS Grid, Flexbox, and CSS custom properties
- **Responsive**: Mobile-first design optimized for tablets and touch devices

### Browser Support
- Chrome 66+
- Firefox 55+
- Safari 11.1+
- Edge 79+

*Note: Microphone access requires HTTPS in production environments*

### Audio Analysis
- **FFT Size**: 1024 samples for balanced frequency resolution and performance
- **Frequency Ranges**: 
  - Bass: 20-80Hz (kick drums, bass instruments)
  - Mid: 80-500Hz (snare drums, vocals, most instruments)
  - Treble: 500Hz+ (hi-hats, cymbals, higher vocals)
- **Smoothing**: 0.8 time constant for stable visualizations

## 🎨 Customization

### Adding New Themes
Themes are defined in the `getThemeColor()` method in `main.js`. Each theme specifies colors for bass, mid, and treble frequencies:

```javascript
case 'your-theme':
  return {
    bass: 'rgba(r, g, b, 1)',    // Low frequencies
    mid: 'rgba(r, g, b, 1)',     // Mid frequencies  
    treble: 'rgba(r, g, b, 1)'   // High frequencies
  }[frequency];
```

### Adding New Modes
Visualization modes are implemented as methods in the `MusicVisualization` class:

```javascript
visualizeYourMode(frequencies) {
  // Custom visualization logic using:
  // - frequencies.bass, frequencies.mid, frequencies.treble
  // - this.particles, this.pulses, this.waves arrays
  // - Canvas drawing methods
}
```

## 🏥 Therapeutic Applications

### Designed For
- **Music therapy sessions** with individuals and groups
- **Sensory integration activities** combining auditory and visual stimuli
- **Creative expression** through music and visual arts

### Session Integration
- **Pre-session**: Set up theme and mode based on planned activities
- **During session**: Real-time visual feedback enhances musical engagement
- **Assessment**: Visual patterns can help therapists observe musical responses
- **Documentation**: Screenshots or recordings for progress tracking

## 🔒 Privacy & Security

- **No audio recording**: All audio processing happens locally in the browser
- **No data transmission**: Audio never leaves the user's device
- **No persistent storage**: No user data is saved or tracked
- **Microphone access**: Only active during visualization sessions

## 📱 Device Compatibility

### Recommended Setup
- **Tablet**: 10"+ screen for optimal visibility and touch interaction
- **Desktop**: Works well with mouse/keyboard for setup and configuration
- **Audio**: External microphone recommended for group sessions
- **Environment**: Minimize background noise for best frequency detection

## 🛠️ Development

### Project Structure
```
cromestesia/
├── src/
│   ├── main.js          # Main application logic
│   ├── styles.css       # Complete stylesheet
├── public/
│   ├── music-note.svg   # App icon
├── index.html           # Main HTML structure
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

### Build Commands
```bash
npm run dev      # Development server with hot reload
npm run build    # Production build
npm run preview  # Preview production build locally
```

### Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-theme`)
3. Commit changes (`git commit -am 'Add new underwater theme'`)
4. Push to branch (`git push origin feature/new-theme`)
5. Create a Pull Request

## 📄 License

This project is designed for educational and therapeutic use. Please ensure compliance with local regulations regarding audio capture and accessibility requirements.



---

*Built with ❤️ for music therapy communities*
