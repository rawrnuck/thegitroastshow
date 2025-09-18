const express = require("express");
const router = express.Router();
const elevenLabsService = require("../services/elevenLabsService");

/**
 * POST /api/tts/generate
 * Generate speech from text using ElevenLabs
 */
router.post("/generate", async (req, res) => {
  try {
    const { text, voice_id, voice_settings } = req.body;

    // Validate input
    if (!text) {
      return res.status(400).json({
        success: false,
        error: "Text is required",
      });
    }

    if (typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Text must be a non-empty string",
      });
    }

    // Check if ElevenLabs service is available
    if (!elevenLabsService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: "Text-to-speech service is currently unavailable",
        fallback: true,
      });
    }

    // If text is too long, reject it to avoid API issues
    if (text.length > 1000) {
      console.warn(
        `TTS request rejected: Text too long (${text.length} chars)`
      );
      return res.status(413).json({
        success: false,
        error: "Text is too long, must be 1000 characters or less",
        fallback: true,
      });
    }

    // Check ElevenLabs API connectivity with DNS lookup before making request
    try {
      const dns = require("dns");
      const apiConnectivity = await new Promise((resolve) => {
        dns.lookup("api.elevenlabs.io", (err) => {
          resolve(!err);
        });
      });

      if (!apiConnectivity) {
        console.warn("ElevenLabs API unreachable: DNS lookup failed");
        return res.status(503).json({
          success: false,
          error: "ElevenLabs API is currently unreachable",
          details: "DNS resolution failed",
          fallback: true,
        });
      }
    } catch (dnsError) {
      console.warn("DNS check error:", dnsError.message);
      // Continue even if the DNS check fails
    }

    // Prepare TTS options
    const ttsOptions = {
      voiceId: voice_id,
      ...(voice_settings && {
        stability: voice_settings.stability,
        similarityBoost: voice_settings.similarity_boost,
        style: voice_settings.style,
        useSpeakerBoost: voice_settings.use_speaker_boost,
      }),
    };

    console.log(
      `TTS request - Text length: ${text.length}, Voice ID: ${
        voice_id || "default"
      }`
    );

    // Generate speech
    const audioBuffer = await elevenLabsService.textToSpeech(text, ttsOptions);

    // Set appropriate headers for audio response
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.length,
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
    });

    // Send audio buffer
    res.status(200).send(audioBuffer);
  } catch (error) {
    console.error("TTS generation error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to generate speech",
      details: error.message,
      fallback: true,
    });
  }
});

/**
 * GET /api/tts/voices
 * Get available voices from ElevenLabs
 */
router.get("/voices", async (req, res) => {
  try {
    if (!elevenLabsService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: "Text-to-speech service is currently unavailable",
        voices: [],
      });
    }

    const voices = await elevenLabsService.getVoices();

    res.json({
      success: true,
      voices: voices.map((voice) => ({
        voice_id: voice.voice_id,
        name: voice.name,
        category: voice.category,
        description: voice.description,
        preview_url: voice.preview_url,
        available_for_tiers: voice.available_for_tiers,
        settings: voice.settings,
      })),
    });
  } catch (error) {
    console.error("Error fetching voices:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch voices",
      details: error.message,
      voices: [],
    });
  }
});

/**
 * GET /api/tts/status
 * Check TTS service status
 */
router.get("/status", (req, res) => {
  const isAvailable = elevenLabsService.isAvailable();
  const modelInfo = elevenLabsService.getModelInfo();

  res.json({
    success: true,
    available: isAvailable,
    service: "ElevenLabs",
    model: modelInfo,
    features: {
      realtime: false,
      cached: true,
      voice_cloning: false,
      voice_settings: true,
      multiple_voices: true,
    },
  });
});

/**
 * POST /api/tts/clean-text
 * Clean text for speech (utility endpoint)
 */
router.post("/clean-text", (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({
        success: false,
        error: "Text is required and must be a string",
      });
    }

    const cleanedText = elevenLabsService.cleanTextForSpeech(text);

    res.json({
      success: true,
      original_text: text,
      cleaned_text: cleanedText,
      original_length: text.length,
      cleaned_length: cleanedText.length,
    });
  } catch (error) {
    console.error("Text cleaning error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clean text",
      details: error.message,
    });
  }
});

module.exports = router;
