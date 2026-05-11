import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

async function loadEnvFile(file) {
  try {
    const raw = await readFile(path.join(process.cwd(), file), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [rawKey, ...rest] = trimmed.split("=");
      const key = rawKey?.replace(/^\$env:/i, "");
      if (!key || process.env[key]) continue;
      process.env[key] = rest.join("=").trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    // Missing env files are fine; shell env still works.
  }
}

await loadEnvFile(".env.local");
await loadEnvFile(".env");

const apiKey = process.env.ELEVENLABS_API_KEY;
const voiceId = process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb";
const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
const outputDir = path.join(process.cwd(), "public", "tour");

const lines = [
  {
    file: "home-tour-1.mp3",
    text: "Welcome to The Card. This is the nightly sports board, built like a game. Tonight's slate becomes simple yes or no markets, where every price reads like a probability.",
  },
  {
    file: "home-tour-2.mp3",
    text: "There are five ways to play. Take the main Card, race the Blitz clock, call markets live, challenge a rival head to head, or build your long-term forecast record.",
  },
  {
    file: "home-tour-3.mp3",
    text: "Now chase the board. Save your watchlist, lock your card, compare against the crowd, climb the leaderboard, and take your shot at Perfect Ten.",
  },
];

if (!apiKey) {
  console.error("Missing ELEVENLABS_API_KEY. Set it in your shell before running this script.");
  process.exit(1);
}

await mkdir(outputDir, { recursive: true });

for (const line of lines) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: line.text,
        model_id: modelId,
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.8,
          style: 0.35,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`ElevenLabs failed for ${line.file}: ${response.status} ${message}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(path.join(outputDir, line.file), buffer);
  console.log(`wrote public/tour/${line.file}`);
}
