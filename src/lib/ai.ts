/// <reference types="vite/client" />
import type { AiNudgeResponse, MoodKey } from '@/types'
import { extractTags, detectSentiment } from './utils'

const CLAUDE_API = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

async function callClaude(system: string, user: string): Promise<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  const res = await fetch(CLAUDE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'x-api-key': apiKey } : {}),
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 200,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })
  if (!res.ok) throw new Error(`${res.status}`)
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

// Mood-aware local fallbacks — warm, personal, not robotic
const MOOD_NUDGES: Record<string, string[]> = {
  sad: [
    "Hey, I see you. It's okay to feel this way — you don't have to fix it right now. 🌧",
    "Sending you the biggest hug. You're not alone in this, I promise. 💙",
    "Heavy days are real. I'm right here with you — take your time. 🫂",
    "It's okay to just feel it. You're braver than you know for writing it out. 🌱",
  ],
  joy: [
    "Yay!! This makes me so happy for you! Hold onto this feeling. 🌟",
    "I love seeing you like this! What a beautiful moment to capture. ✨",
    "This joy is REAL and you deserve every bit of it! 🎉",
    "Okay this is making me smile too! You're glowing today. 🌻",
  ],
  calm: [
    "There's something so beautiful about peaceful days. You're doing well. 🍃",
    "This stillness suits you. Rest in it — you've earned it. 🌊",
    "Calm is underrated. I love that you're noticing it. 🌙",
  ],
  love: [
    "This warmth you're feeling? That's real connection. Cherish it. 💕",
    "Love looks good on you. I'm so glad you have people like this. 🌸",
    "The fact that you feel this deeply is one of your best qualities. 💖",
  ],
  fire: [
    "YES! That energy?! Channel it — you're unstoppable right now. 🔥",
    "I love when you're in this mode. What are you going to do with it? ⚡",
    "This is your moment. Don't let it slip — write it, feel it, own it. 🚀",
  ],
  dream: [
    "I love the way your mind wanders. Keep dreaming — it matters. 🌠",
    "You have such a beautiful inner world. Stay in it a little longer. 💫",
    "Dreams are just plans with feelings attached. This one feels important. ✨",
  ],
  default: [
    "Thank you for showing up for yourself today — that always counts. 🌿",
    "There's something worth noticing in every day. You found it. 💛",
    "Writing it out is always the right call. I'm glad you did. 📖",
  ],
}

function getLocalNudge(mood: MoodKey | null, content: string): AiNudgeResponse {
  const key = mood ?? 'default'
  const pool = MOOD_NUDGES[key] ?? MOOD_NUDGES.default
  const nudge = pool[Math.floor(Math.random() * pool.length)]
  return { nudge, tags: extractTags(content), sentiment: detectSentiment(content) }
}

export async function getAiNudge(content: string, mood: MoodKey | null): Promise<AiNudgeResponse> {
  const local = getLocalNudge(mood, content)
  try {
    const moodDesc: Record<string, string> = {
      joy: 'joyful and happy', calm: 'calm and peaceful', sad: 'sad or melancholy',
      love: 'loved and warm', fire: 'energized and motivated', dream: 'dreamy and imaginative',
    }
    const system = `You are Sprout — a warm, caring journaling companion. 
The writer just shared a journal entry. Their selected mood is: ${moodDesc[mood ?? ''] ?? 'neutral'}.

Write ONE short, heartfelt message (1-2 sentences, max 25 words) that:
- Feels like a warm friend responding, not a therapist
- Matches their mood: if sad → comfort and "I'm here"; if happy → celebrate with them; if calm → affirm the stillness; if energized → hype them up
- Uses natural casual language, maybe 1 emoji
- Never asks a question — just responds warmly to how they feel

Also return 1-3 hashtag tags from: #Gratitude #Dream #Vent #Joy #Anxiety #Work #Love #Family #Friends #Reflection #Rest #Growth

Return ONLY valid JSON: {"nudge": "...", "tags": ["#Tag"], "sentiment": "positive|neutral|negative"}
No markdown, no extra text.`

    const raw = await callClaude(system, `Entry:\n${content.slice(0, 500)}`)
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
    return {
      nudge:     parsed.nudge     ?? local.nudge,
      tags:      parsed.tags      ?? local.tags,
      sentiment: parsed.sentiment ?? local.sentiment,
    }
  } catch {
    return local
  }
}

export async function smartTag(content: string): Promise<string[]> {
  const localTags = extractTags(content)
  if (localTags.length >= 2) return localTags
  try {
    const system = `Return ONLY a JSON array of 1-4 tags from:
["#Gratitude","#Dream","#Vent","#Joy","#Anxiety","#Work","#Love","#Family","#Friends","#Reflection","#Rest","#Growth","#Nature","#Health","#Creative"]`
    const raw = await callClaude(system, content)
    return JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch {
    return localTags
  }
}
