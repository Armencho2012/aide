const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })

const extractText = (data: any) => {
  const parts = data?.candidates?.[0]?.content?.parts
  if (!Array.isArray(parts)) return ''
  return parts.map((part: any) => part?.text).filter(Boolean).join('')
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    const elevenKey = Deno.env.get('ELEVEN_LABS_API_KEY')
    const voiceId = Deno.env.get('ELEVEN_LABS_VOICE_ID')

    if (!geminiKey || !elevenKey) {
      return jsonResponse({ error: 'Missing API keys' }, 500)
    }

    if (!voiceId) {
      return jsonResponse({ error: 'Missing ElevenLabs voice ID' }, 500)
    }

    const body = await req.json().catch(() => ({}))
    const topic = body?.topic?.trim() || body?.knowledgeGap?.trim()

    if (!topic) {
      return jsonResponse({ error: 'Topic or knowledgeGap is required' }, 400)
    }

    const prompt = `Create a concise, engaging 1-minute podcast-style script for a student about: ${topic}. Keep it clear, energetic, and focused on the key insight. End with a one-sentence takeaway.`

    const geminiRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiKey
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 400 }
        })
      }
    )

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text().catch(() => '')
      return jsonResponse(
        { error: 'Gemini generation failed', status: geminiRes.status, detail: errorText },
        geminiRes.status
      )
    }

    const geminiJson = await geminiRes.json().catch(() => null)
    const script = extractText(geminiJson).trim()

    if (!script) {
      return jsonResponse({ error: 'Gemini returned empty script' }, 502)
    }

    const ttsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: 'audio/mpeg',
          'xi-api-key': elevenKey
        },
        body: JSON.stringify({
          text: script,
          model_id: 'eleven_multilingual_v2'
        })
      }
    )

    if (!ttsRes.ok) {
      const errorText = await ttsRes.text().catch(() => '')
      return jsonResponse(
        { error: 'ElevenLabs TTS failed', status: ttsRes.status, detail: errorText },
        ttsRes.status
      )
    }

    const contentType = ttsRes.headers.get('content-type') || 'audio/mpeg'
    return new Response(ttsRes.body, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': contentType }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return jsonResponse({ error: message }, 500)
  }
})
