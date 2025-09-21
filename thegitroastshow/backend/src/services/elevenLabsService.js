// Import the entire elevenlabs package
const elevenlabs = require("@elevenlabs/elevenlabs-js");
const axios = require("axios");
const FormData = require("form-data");

class ElevenLabsService {
  constructor() {
    // this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.model = "eleven_flash_v2_5";
    this.baseUrl = "https://api.elevenlabs.io/v1";

    if (!this.apiKey) {
      console.warn(
        "ElevenLabs API key not found. TTS service will not be available."
      );
    } else {
      console.log("🗣️ ElevenLabs TTS service initialized");
    }
  }

  /**
   * Check if the ElevenLabs service is available
   * @returns {boolean} True if the service is configured and ready
   */
  isAvailable() {
    return !!this.apiKey;
  }

  /**
   * Generate audio from text using ElevenLabs TTS
   * @param {string} text - The text to convert to speech
   * @param {Object} options - Options for TTS generation
   * @param {string} options.voiceId - Voice ID to use (defaults to Rachel)
   * @param {number} options.stability - Voice stability (0.0-1.0)
   * @param {number} options.similarityBoost - Similarity boost (0.0-1.0)
   * @param {number} options.style - Style exaggeration (0.0-1.0)
   * @param {boolean} options.useSpeakerBoost - Whether to use speaker boost
   * @returns {Promise<Buffer>} Audio buffer
   */
  async textToSpeech(text, options = {}) {
    if (!this.isAvailable()) {
      throw new Error(
        "ElevenLabs service is not available. Check API key configuration."
      );
    }

    if (!text || typeof text !== "string") {
      throw new Error("Text must be a non-empty string");
    }

    // Clean the text - remove sound cues and formatting
    const cleanText = this.cleanTextForSpeech(text);

    if (!cleanText.trim()) {
      throw new Error("No speakable text found after cleaning");
    }

    try {
      const {
        voiceId = "2EiwWnXFnvU5JabPnv8n", // Rachel voice ID
        stability = 0.5,
        similarityBoost = 0.8,
        style = 0.0,
        useSpeakerBoost = true,
      } = options;

      console.log(
        `Generating TTS for text: "${cleanText.substring(0, 100)}..."`
      );
      console.log(`Using voice ID: ${voiceId}, model: ${this.model}`);

      // Call ElevenLabs API directly with timeout
      const url = `${this.baseUrl}/text-to-speech/${voiceId}?optimize_streaming_latency=0`;
      const response = await axios({
        method: "POST",
        url: url,
        data: {
          text: cleanText,
          model_id: this.model,
          voice_settings: {
            stability,
            similarity_boost: similarityBoost,
            style,
            use_speaker_boost: useSpeakerBoost,
          },
        },
        headers: {
          Accept: "audio/mpeg",
          "xi-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
        timeout: 10000, // 10 second timeout
        validateStatus: (status) => status === 200, // Only treat 200 as success
      });

      if (!response.data || response.data.length === 0) {
        throw new Error("Received empty response from ElevenLabs API");
      }

      const audioBuffer = Buffer.from(response.data);
      console.log(`Generated audio buffer of ${audioBuffer.length} bytes`);

      // Basic validation of audio format - MP3 files start with ID3 or have MPEG frame sync
      const isValidAudio =
        audioBuffer.length > 4 &&
        ((audioBuffer[0] === 0x49 &&
          audioBuffer[1] === 0x44 &&
          audioBuffer[2] === 0x33) || // ID3
          (audioBuffer[0] === 0xff && (audioBuffer[1] & 0xe0) === 0xe0)); // MPEG frame sync

      if (!isValidAudio) {
        throw new Error("Received invalid audio data from ElevenLabs API");
      }

      return audioBuffer;
    } catch (error) {
      console.error("ElevenLabs TTS error:", error.message);

      // Enhanced error logging
      if (error.response) {
        console.error("Response status:", error.response.status);

        // Try to parse error data if it's not a binary response
        if (error.response.data) {
          try {
            if (typeof error.response.data === "string") {
              console.error("Response data:", error.response.data);
            } else if (error.response.data instanceof Buffer) {
              // If it's a buffer, try to parse as UTF-8 string
              console.error(
                "Response data (buffer):",
                error.response.data.toString("utf8").substring(0, 500)
              );
            } else {
              console.error(
                "Response data (object):",
                JSON.stringify(error.response.data).substring(0, 500)
              );
            }
          } catch (parseError) {
            console.error("Could not parse error response data");
          }
        }
      } else if (error.request) {
        // Request was made but no response received
        console.error("No response received from ElevenLabs API");
        if (error.code === "ECONNABORTED") {
          throw new Error("ElevenLabs API request timed out");
        }
      }

      throw new Error(`Failed to generate speech: ${error.message}`);
    }
  }

  /**
   * Clean text for speech synthesis
   * Removes sound cues like *adjusts mic*, *applause*, etc.
   * @param {string} text - Raw text to clean
   * @returns {string} Cleaned text suitable for TTS
   */
  cleanTextForSpeech(text) {
    if (!text) return "";

    return (
      text
        // Remove sound cues in asterisks
        .replace(/\*[^*]*\*/g, "")
        // Remove parenthetical sound cues
        .replace(/\([^)]*\)/g, "")
        // Remove brackets sound cues
        .replace(/\[[^\]]*\]/g, "")
        // Remove emoji sequences
        .replace(
          /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
          ""
        )
        // Clean up multiple spaces and newlines
        .replace(/\s+/g, " ")
        // Remove leading/trailing whitespace
        .trim()
    );
  }

  /**
   * Get available voices from ElevenLabs
   * @returns {Promise<Array>} Array of available voices
   */
  async getVoices() {
    if (!this.isAvailable()) {
      throw new Error("ElevenLabs service is not available");
    }

    try {
      const response = await axios({
        method: "GET",
        url: `${this.baseUrl}/voices`,
        headers: {
          "xi-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
      });

      return response.data.voices || [];
    } catch (error) {
      console.error("Error fetching voices:", error.message);
      throw new Error(`Failed to fetch voices: ${error.message}`);
    }
  }

  /**
   * Get information about the current model
   * @returns {Object} Model information
   */
  getModelInfo() {
    return {
      model: this.model,
      description:
        "ElevenLabs Flash v2.5 - Fast, high-quality text-to-speech model",
      features: [
        "Low latency",
        "High quality",
        "Multiple voices",
        "Voice settings customization",
      ],
    };
  }
}

// Export singleton instance
module.exports = new ElevenLabsService();
