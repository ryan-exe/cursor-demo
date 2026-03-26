import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = "gemini-3.1-flash-lite-preview";

function getClient() {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "";
  return new GoogleGenerativeAI(apiKey);
}

export interface Transcript {
  name: string;
  text: string;
}

export async function transcribeAudio(
  name: string,
  audioBase64: string,
  mimeType: string,
): Promise<string> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType,
        data: audioBase64,
      },
    },
    {
      text: `Transcribe this audio recording exactly as spoken. Rules:
- Only include words that were actually spoken in the audio.
- Do not invent, assume, or add anything that was not said.
- If the audio is silent, too quiet, or contains no speech, return exactly: [no audio]
- Remove filler words (um, uh, like, you know) but preserve everything else verbatim.
- Return only the transcribed text with no labels, prefixes, or explanation.`,
    },
  ]);

  return result.response.text().trim();
}

export async function generateSummary(
  transcripts: Transcript[],
): Promise<string> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const updates = transcripts
    .filter((t) => t.text.trim() !== '[no audio]' && t.text.trim().length > 0)
    .map((t) => `${t.name}: ${t.text}`)
    .join('\n\n');

  const skipped = transcripts
    .filter((t) => t.text.trim() === '[no audio]' || t.text.trim().length === 0)
    .map((t) => t.name);

  const skippedNote = skipped.length > 0
    ? `\n\nNote: ${skipped.join(', ')} did not record anything — do not include them in the summary.`
    : '';

  const result = await model.generateContent(`You are writing a daily standup summary to post in Slack so the team can catch up.

Here are the raw transcripts from each team member:
${updates}${skippedNote}

Write a clear, friendly Slack summary. Format:
- One bullet per person who spoke, with their name bolded: *Name* — what they said, paraphrased concisely in 1-2 sentences.
- Only include people who actually have a transcript above.
- End with a single line starting with "📋 " that gives the overall team status or highlights anything urgent.
- Do not add any header or intro sentence — start directly with the first bullet.`);

  return result.response.text().trim();
}
