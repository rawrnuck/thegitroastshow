# Sound Effects for RoastRepo

This directory contains the 8 predefined sound effects used in the roast show format.

## Required Sound Files

Download these 8 sound files and place them in this directory:

### 1. **crowd_laugh.mp3**

- **Usage**: Triggered by: laugh, laughs, laughter, chuckle, giggle
- **Description**: Crowd laughing sound
- **Emoji**: 😂
- **Suggested Sources**:
  - [Freesound.org](https://freesound.org/search/?q=crowd+laugh)
  - [Pixabay](https://pixabay.com/sound-effects/search/crowd-laugh/)

### 2. **crowd_gasp.mp3**

- **Usage**: Triggered by: gasp, gasps, shock, surprised
- **Description**: Crowd gasping in surprise
- **Emoji**: 😱
- **Suggested Sources**:
  - [Freesound.org](https://freesound.org/search/?q=crowd+gasp)
  - [Pixabay](https://pixabay.com/sound-effects/search/gasp/)

### 3. **applause.mp3**

- **Usage**: Triggered by: applause, clap, claps, cheer, whoop, whoops
- **Description**: Crowd applauding and cheering
- **Emoji**: 👏
- **Suggested Sources**:
  - [Freesound.org](https://freesound.org/search/?q=applause)
  - [Pixabay](https://pixabay.com/sound-effects/search/applause/)

### 4. **crickets.mp3**

- **Usage**: Triggered by: cricket, crickets, silence, awkward
- **Description**: Crickets chirping (awkward silence)
- **Emoji**: 🦗
- **Suggested Sources**:
  - [Freesound.org](https://freesound.org/search/?q=crickets)
  - [Pixabay](https://pixabay.com/sound-effects/search/crickets/)

### 5. **boo.mp3**

- **Usage**: Triggered by: boo, boos, hiss, disapproval
- **Description**: Crowd booing in disapproval
- **Emoji**: 👎
- **Suggested Sources**:
  - [Freesound.org](https://freesound.org/search/?q=crowd+boo)
  - [Pixabay](https://pixabay.com/sound-effects/search/boo/)

### 6. **rimshot.mp3**

- **Usage**: Triggered by: rimshot, drum, ba dum tss, joke
- **Description**: Drum rimshot for punchlines
- **Emoji**: 🥁
- **Suggested Sources**:
  - [Freesound.org](https://freesound.org/search/?q=rimshot)
  - [Pixabay](https://pixabay.com/sound-effects/search/rimshot/)

### 7. **mic_drop.mp3**

- **Usage**: Triggered by: mic drop, drops mic, mic, microphone
- **Description**: Microphone dropping sound
- **Emoji**: 🎤
- **Suggested Sources**:
  - [Freesound.org](https://freesound.org/search/?q=mic+drop)
  - [Pixabay](https://pixabay.com/sound-effects/search/mic-drop/)

### 8. **air_horn.mp3**

- **Usage**: Triggered by: air horn, horn, dramatic, epic
- **Description**: Air horn for dramatic moments
- **Emoji**: 📯
- **Suggested Sources**:
  - [Freesound.org](https://freesound.org/search/?q=air+horn)
  - [Pixabay](https://pixabay.com/sound-effects/search/air-horn/)

## File Requirements

- **Format**: MP3 (preferred) or WAV
- **Duration**: 2-5 seconds recommended
- **Quality**: Good quality but not too large (under 500KB each)
- **Volume**: Normalized levels across all files

## Quick Download Links

For convenience, here are some specific free sound effects you can download:

### Recommended Free Sources:

1. **Pixabay**: https://pixabay.com/sound-effects/ (No attribution required)
2. **Freesound**: https://freesound.org/ (Check licensing, many CC0)
3. **Zapsplat**: https://zapsplat.com/ (Free with account)

## Testing

Once you've downloaded all 8 files:

1. Place them in this `/public/sounds/` directory
2. Test a roast to ensure sound cues trigger correctly
3. Check browser console for any loading errors

## Implementation Notes

The sound effects are automatically mapped based on keywords in the LLM's stage directions. For example:

- `*crowd laughs*` → triggers `crowd_laugh.mp3`
- `*awkward silence*` → triggers `crickets.mp3`
- `*drops mic*` → triggers `mic_drop.mp3`

The fallback sound is `crickets.mp3` if no keywords match.
