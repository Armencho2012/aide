import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function getUserPlan(supabaseAdmin: any, userId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('status, plan_type, expires_at')
    .eq('user_id', userId)
    .single();

  if (error || !data) return 'free';

  const isActive = data.status === 'active' &&
    ['pro', 'class'].includes(data.plan_type) &&
    (!data.expires_at || new Date(data.expires_at) > new Date());

  return isActive ? data.plan_type : 'free';
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  maxRetries = 3,
  baseDelay = 2000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }
      
      if (response.status >= 500 || response.status === 429) {
        const errorJson = await response.json().catch(() => ({}));
        console.log(`Attempt ${attempt + 1}/${maxRetries} failed: ${response.status}`);
        
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw new Error(`API failed: ${errorJson?.error?.message || response.status}`);
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!supabaseUrl || !apiKey || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing environment variables" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const userPlan = await getUserPlan(supabaseAdmin, user.id);

    if (userPlan === 'free') {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const startOfDay = today.toISOString();

      const { count } = await supabaseAdmin
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('action_type', 'podcast_generation')
        .gte('created_at', startOfDay);

      if (count && count >= 5) {
        return new Response(JSON.stringify({
          error: 'Daily podcast generation limit reached. Upgrade to Pro for unlimited access.',
          limit_reached: true
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    const body = await req.json().catch(() => ({}));
    const { prompt, language = 'en', contentId } = body;

    if (!prompt?.trim()) {
      return new Response(JSON.stringify({ error: "No topic provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const languageInstruction = language === 'en' ? 'English' : 
                                language === 'ru' ? 'Russian' : 
                                language === 'hy' ? 'Armenian' : 
                                language === 'ko' ? 'Korean' : 'English';

    const truncatedPrompt = prompt.substring(0, 4000);

    const dialoguePrompt = `Create an educational podcast dialogue between Speaker 1 (host) and Speaker 2 (expert) about: ${truncatedPrompt}

Make it 2-3 minutes when spoken. Respond in ${languageInstruction}. Format:
Speaker 1: ...
Speaker 2: ...`;

    console.log(`Generating dialogue for user ${user.id}...`);

    // Use gemini-2.0-flash for dialogue generation
    const dialogueUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const dialoguePayload = {
      contents: [{
        role: "user",
        parts: [{ text: dialoguePrompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000
      }
    };

    const dialogueRes = await fetchWithRetry(dialogueUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dialoguePayload)
    });

    if (!dialogueRes.ok) {
      const errorText = await dialogueRes.text();
      console.error('Dialogue error:', dialogueRes.status, errorText);
      throw new Error(`Dialogue generation failed: ${dialogueRes.status}`);
    }

    const dialogueJson = await dialogueRes.json();
    const dialogueText = dialogueJson?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!dialogueText) {
      console.error('No dialogue in response:', JSON.stringify(dialogueJson));
      throw new Error("Failed to generate dialogue");
    }

    console.log('Dialogue generated, length:', dialogueText.length);

    // Generate TTS using gemini-2.5-flash-preview-tts
    console.log('Generating audio...');

    const ttsUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
    
    const ttsPayload = {
      contents: [{
        role: 'user',
        parts: [{ text: dialogueText }]
      }],
      generationConfig: {
        temperature: 1,
        responseModalities: ['audio'],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              { speaker: 'Speaker 1', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
              { speaker: 'Speaker 2', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
            ]
          }
        }
      }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    let ttsRes: Response;
    try {
      ttsRes = await fetchWithRetry(ttsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ttsPayload),
        signal: controller.signal
      }, 3, 3000);
    } finally {
      clearTimeout(timeoutId);
    }

    if (!ttsRes.ok) {
      const errorText = await ttsRes.text();
      console.error('TTS error:', ttsRes.status, errorText);
      return new Response(JSON.stringify({
        error: "Audio generation failed",
        dialogue_text: dialogueText,
        retryable: ttsRes.status === 429
      }), {
        status: ttsRes.status === 429 ? 429 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const ttsJson = await ttsRes.json();
    console.log('TTS response received');

    let audioPart = ttsJson?.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData?.mimeType?.startsWith('audio/')
    );

    if (!audioPart) {
      audioPart = ttsJson?.candidates?.[0]?.content?.parts?.find((p: any) => 
        p.inlineData?.mimeType?.startsWith('audio/') && p.inlineData?.data
      );
    }

    if (!audioPart?.inlineData?.data) {
      console.error('No audio data, response:', JSON.stringify(ttsJson).substring(0, 500));
      return new Response(JSON.stringify({
        error: "No audio data generated",
        dialogue_text: dialogueText,
        retryable: true
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const audioBase64 = audioPart.inlineData.data;
    const audioMimeType = audioPart.inlineData.mimeType;
    
    console.log(`Audio: ${audioMimeType}, base64 length: ${audioBase64.length}`);

    const audioBytes = base64ToUint8Array(audioBase64);
    console.log(`Audio size: ${audioBytes.length} bytes`);

    const timestamp = Date.now();
    const extension = audioMimeType.includes('wav') ? 'wav' : 'mp3';
    const filename = `${user.id}/${timestamp}.${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('podcasts')
      .upload(filename, audioBytes, {
        contentType: audioMimeType,
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to save audio');
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('podcasts')
      .getPublicUrl(filename);

    const podcastUrl = urlData.publicUrl;
    console.log(`Podcast: ${podcastUrl}`);

    if (contentId) {
      const { data: contentData } = await supabaseAdmin
        .from('user_content')
        .select('generation_status')
        .eq('id', contentId)
        .single();

      const existingStatus = contentData?.generation_status || {};
      
      await supabaseAdmin
        .from('user_content')
        .update({
          podcast_url: podcastUrl,
          generation_status: { ...existingStatus, podcast: true }
        })
        .eq('id', contentId);
    }

    supabaseAdmin.from("usage_logs").insert({
      user_id: user.id,
      action_type: "podcast_generation",
    }).catch((err: any) => console.error("Usage log error:", err));

    return new Response(JSON.stringify({
      podcast_url: podcastUrl,
      success: true
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

