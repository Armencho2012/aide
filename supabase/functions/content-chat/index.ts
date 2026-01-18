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
    const { question, contentText, analysisData, language, chatHistory, activeNodeContext } = body;

    if (!question || !contentText) {
      return new Response(JSON.stringify({ error: "Question and content required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Build context from analysis
    const summaryContext = analysisData?.three_bullet_summary?.join('\n') || '';
    const termsContext = analysisData?.key_terms?.join(', ') || '';

    // CONTEXTUAL INJECTION: Add selected node context if provided
    const nodeContext = activeNodeContext
      ? `\n--- ACTIVE NODE CONTEXT ---\nFocused Node: ${activeNodeContext.label}\nDescription: ${activeNodeContext.description}\nCategory: ${activeNodeContext.category}\nPlease prioritize this context in your explanation if relevant.`
      : '';

    const languageInstruction = {
      'en': 'Respond in English.',
      'ru': 'Отвечайте на русском языке.',
      'hy': 'Պdelays delays delays:',
      'ko': '한국어로 답변하세요.'
    }[language as string] || 'Respond in English.';

    // Build chat history for context
    const historyContext = chatHistory
      ?.slice(-6) // Last 6 messages for context
      ?.map((msg: { role: string; content: string }) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      ?.join('\n') || '';

    const systemPrompt = `You are a powerful education engine. Help the student understand the material.

OUTPUT CONSTRAINTS:
1. ${languageInstruction}
2. Structure your answer using markdown.
3. FACT-CHECKING: When making a specific claim based on the provided content, append a source tag like [[source:Snippet of text]] at the end of the sentence.
4. If you use math, use LaTeX format like $x^2$.

--- ORIGINAL CONTENT ---
${contentText.substring(0, 10000)}
${nodeContext}

--- PREVIOUS CONVERSATION ---
${historyContext}`;

    // Use Lovable AI Gateway with streaming
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ],
        stream: true
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    // Proxy the stream back to the client
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    (async () => {
      const reader = response.body?.getReader();
      if (!reader) {
        await writer.close();
        return;
      }

      try {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;
            
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const data = JSON.parse(jsonStr);
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                await writer.write(encoder.encode(content));
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
        
        // Process remaining buffer
        if (buffer.trim() && buffer.startsWith('data: ')) {
          const jsonStr = buffer.slice(6).trim();
          if (jsonStr !== '[DONE]') {
            try {
              const data = JSON.parse(jsonStr);
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                await writer.write(encoder.encode(content));
              }
            } catch (e) {
              // Ignore
            }
          }
        }
      } catch (e) {
        console.error("Streaming error:", e);
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
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
