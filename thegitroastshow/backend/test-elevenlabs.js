const elevenlabs = require("@elevenlabs/elevenlabs-js");

// Log available functions
console.log("Available methods and properties:");
console.log(Object.keys(elevenlabs));

// Try to initialize with API key
const API_KEY = "test-key";

try {
  console.log("Testing API key setup:");
  // First attempt with direct initialization
  console.log("Trying direct initialization...");
  const voice = "21m00Tcm4TlvDq8ikWAM"; // Rachel
  const model = "eleven_flash_v2_5";

  console.log("Using API:", elevenlabs.api);
  console.log("API key property:", Object.keys(elevenlabs).includes("apiKey"));

  if (typeof elevenlabs.api === "object") {
    console.log("API key setting options:", Object.keys(elevenlabs.api));
  }

  // Try different ways to set the API key
  console.log("Setting API key...");

  if (typeof elevenlabs.api === "object") {
    elevenlabs.api.apiKey = API_KEY;
    console.log("Set API key via api.apiKey property");
  } else if (typeof elevenlabs.init === "function") {
    elevenlabs.init(API_KEY);
    console.log("Set API key via init() function");
  } else if (typeof elevenlabs.configure === "function") {
    elevenlabs.configure({ apiKey: API_KEY });
    console.log("Set API key via configure() function");
  } else {
    console.log("Could not find way to set API key");
  }
} catch (error) {
  console.error("Error:", error);
}
