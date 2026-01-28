import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Helper function to get user's subscription plan
async function getUserPlan(supabaseAdmin: any, userId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('status, plan_type, expires_at')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return 'free';
  }

  const isActive = data.status === 'active' &&
    ['pro', 'class'].includes(data.plan_type) &&
    (!data.expires_at || new Date(data.expires_at) > new Date());

  return isActive ? data.plan_type : 'free';
}

// Helper to decode base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Retry helper with exponential backoff
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  maxRetries = 3,
  baseDelay = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Don't retry on client errors (4xx) except rate limits
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }
      
      // Retry on 5xx errors or rate limits
      if (response.status >= 500 || response.status === 429) {
        const errorJson = await response.json().catch(() => ({}));
        console.log(`Attempt ${attempt + 1}/${maxRetries} failed with ${response.status}:`, errorJson?.error?.message || 'Unknown error');
        
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
          console.log(`Retrying in ${Math.round(delay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Return the response on final attempt
        return new Response(JSON.stringify(errorJson), {
          status: response.status,
          headers: response.headers
        });
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt + 1}/${maxRetries} network error:`, lastError.message);
      
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
    if (!authHeader) throw new Error("Authorization required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client for user auth
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Admin client for storage and DB operations (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Invalid token");

    // Get user's subscription plan
    const userPlan = await getUserPlan(supabaseAdmin, user.id);
    console.log(`User ${user.id} has plan: ${userPlan}`);

    const body = await req.json().catch(() => ({}));
    const { prompt, language = 'en', contentId } = body;

    if (!prompt?.trim()) {
      throw new Error("No topic provided for podcast generation");
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("Gemini API key not configured");

    // Build the podcast dialogue prompt
    const languageInstruction = language === 'en' ? 'English' : 
                                language === 'ru' ? 'Russian' : 
                                language === 'hy' ? 'Armenian' : 
                                language === 'ko' ? 'Korean' : 'English';

    // Truncate prompt to avoid exceeding token limits
    const truncatedPrompt = prompt.substring(0, 4000);

    const dialoguePrompt = `You are creating an educational podcast dialogue between two speakers discussing the following topic. The conversation should be informative, engaging, and natural-sounding.

Topic: ${truncatedPrompt}

Instructions:
- Create a dialogue between Speaker 1 and Speaker 2
- Speaker 1 is the host/interviewer who asks insightful questions
- Speaker 2 is the expert who provides detailed explanations
- Make the conversation flow naturally with appropriate reactions and follow-up questions
- Include interesting facts, examples, and analogies to make the content accessible
- The dialogue should be 2-3 minutes when spoken
- Respond in ${languageInstruction}

Begin the podcast dialogue now:`;

    console.log(`Generating podcast for user ${user.id}, topic: ${truncatedPrompt.substring(0, 50)}...`);

    // Call Gemini TTS API with retry mechanism
    const ttsUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
    
    const ttsPayload = {
      contents: [{
        role: 'user',
        parts: [{ text: dialoguePrompt }]
      }],
      generationConfig: {
        temperature: 1,
        responseModalities: ['audio'],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              { 
                speaker: 'Speaker 1', 
                voiceConfig: { 
                  prebuiltVoiceConfig: { voiceName: 'Zephyr' } 
                } 
              },
              { 
                speaker: 'Speaker 2', 
                voiceConfig: { 
                  prebuiltVoiceConfig: { voiceName: 'Puck' } 
                } 
              }
            ]
          }
        }
      }
    };

    console.log('Calling Gemini TTS API with retry...');
    
    const ttsRes = await fetchWithRetry(ttsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ttsPayload),
    }, 3, 2000);

    console.log(`TTS Response status: ${ttsRes.status}`);

    if (!ttsRes.ok) {
      const errorText = await ttsRes.text();
      const errorJson = (() => {
        try {
          return JSON.parse(errorText);
        } catch {
          return { message: errorText };
        }
      })();
      const errorMessage = errorJson?.error?.message || errorJson?.message || `TTS API error (HTTP ${ttsRes.status})`;
      console.error('Gemini TTS error:', ttsRes.status, JSON.stringify(errorJson));
      
      // Return user-friendly error message
      if (ttsRes.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Podcast generation is temporarily unavailable due to high demand. Please try again in a few minutes.",
          retryable: true
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (ttsRes.status === 500) {
        return new Response(JSON.stringify({ 
          error: "The podcast service encountered a temporary issue. Please try again.",
          retryable: true
        }), {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(errorMessage);
    }

    const ttsJson = await ttsRes.json();
    console.log('TTS response received, checking for audio data...');
    console.log('Response structure:', JSON.stringify(ttsJson).substring(0, 1000));

    // Extract audio data from response - check multiple possible locations
    let audioPart = ttsJson?.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData?.mimeType?.startsWith('audio/')
    );

    // If not found in content.parts, check if audio is in a different structure
    if (!audioPart && ttsJson?.candidates?.[0]) {
      const candidate = ttsJson.candidates[0];
      console.log('Candidate structure:', JSON.stringify(candidate).substring(0, 500));
      
      // Try alternative paths
      if (candidate.content?.parts?.length > 0) {
        audioPart = candidate.content.parts.find((p: any) => p.data || p.inlineData?.data);
      }
    }

    if (!audioPart?.inlineData?.data) {
      console.error('No audio data found in TTS response');
      console.error('Full response:', JSON.stringify(ttsJson));
      throw new Error('No audio generated from TTS API - response structure unexpected');
    }

    const audioBase64 = audioPart.inlineData.data;
    const audioMimeType = audioPart.inlineData.mimeType || 'audio/wav';
    
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      console.error('Invalid audio data format:', typeof audioBase64);
      throw new Error('Audio data is invalid or empty');
    }
    
    console.log(`Audio data received, type: ${audioMimeType}, base64 length: ${audioBase64.length}`);
    
    // Decode base64 to bytes
    const audioBytes = base64ToUint8Array(audioBase64);
    console.log(`Audio size: ${audioBytes.length} bytes`);

    // Generate unique filename
    const timestamp = Date.now();
    const extension = audioMimeType.includes('wav') ? 'wav' : 'mp3';
    const filename = `${user.id}/${timestamp}.${extension}`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('podcasts')
      .upload(filename, audioBytes, {
        contentType: audioMimeType,
        upsert: true
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error('Failed to save podcast audio');
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('podcasts')
      .getPublicUrl(filename);

    const podcastUrl = urlData.publicUrl;
    console.log(`Podcast uploaded: ${podcastUrl}`);

    // Update user_content if contentId provided
    if (contentId) {
      // First get existing generation_status
      const { data: contentData } = await supabaseAdmin
        .from('user_content')
        .select('generation_status')
        .eq('id', contentId)
        .single();

      const existingStatus = contentData?.generation_status || {};
      
      const { error: updateError } = await supabaseAdmin
        .from('user_content')
        .update({
          podcast_url: podcastUrl,
          generation_status: {
            ...existingStatus,
            podcast: true
          }
        })
        .eq('id', contentId);

      if (updateError) {
        console.error('Error updating content:', updateError);
      } else {
        console.log(`Content ${contentId} updated with podcast URL`);
      }
    }

    // Log usage (fire and forget)
    supabaseAdmin.from("usage_logs").insert({
      user_id: user.id,
      action_type: "podcast_generation",
    }).then(({ error }) => {
      if (error) console.error("Error logging usage:", error);
    });

    // Return podcast URL
    return new Response(JSON.stringify({
      podcast_url: podcastUrl,
      success: true
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: unknown) {
    console.error("Podcast generation error:", err);
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
