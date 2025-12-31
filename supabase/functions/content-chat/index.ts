import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const body = await req.json().catch(() => ({}));
    const { question, contentText, analysisData, language, chatHistory } = body;

    if (!question || !contentText) {
      return new Response(JSON.stringify({ error: "Question and content required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Build context from analysis
    const summaryContext = analysisData?.three_bullet_summary?.join('\n') || '';
    const termsContext = analysisData?.key_terms?.join(', ') || '';

    const languageInstruction = {
      'en': 'Respond in English.',
      'ru': 'Отвечайте на русском языке.',
      'hy': 'Պdelays delays delays delays:',
      'ko': '한국어로 답변하세요.'
    }[language as string] || 'Respond in English.';

    // Build chat history for context
    const historyContext = chatHistory
      ?.slice(-6) // Last 6 messages for context
      ?.map((msg: { role: string; content: string }) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      ?.join('\n') || '';

    const prompt = `You are a helpful study assistant. The user has analyzed the following educational content and has questions about it.

${languageInstruction}

--- ORIGINAL CONTENT ---
${contentText.substring(0, 5000)}

--- KEY POINTS ---
${summaryContext}

--- KEY TERMS ---
${termsContext}

--- PREVIOUS CONVERSATION ---
${historyContext}

--- USER'S QUESTION ---
${question}

Provide a helpful, clear answer based on the content above. Be concise but thorough. If the question cannot be answered from the provided content, say so politely.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7 }
        })
      }
    );

    const result = await response.json();
    const answer = result?.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response. Please try again.";

    return new Response(JSON.stringify({ answer }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    const error = err as Error;
    console.error("Content chat error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
