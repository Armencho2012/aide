import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "./_shared-index.ts";

const GEMINI_MODEL = "gemini-2.0-flash";

const extractGeminiText = (payload: any): string => {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
    .join("");
};

const parseGeminiJson = (rawText: string): any => {
  const trimmed = rawText.trim();
  if (!trimmed) return {};
  const cleaned = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  return JSON.parse(cleaned);
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!supabaseUrl || !apiKey || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing environment variables" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const body = await req.json().catch(() => ({}));
    const { text, knowledge_map, language = "en" } = body;
    if (!text?.trim() || !knowledge_map) {
      return new Response(JSON.stringify({ error: "Missing text or knowledge_map" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const systemPrompt = `You are an expert study assistant.
Compare the knowledge map to the original text and identify 3 missing key concepts.
Return a SINGLE JSON object exactly like this:
{
  "ghost_nodes": [
    {"id": "g1", "label": "string", "category": "Concept|Problem|Technology|Science|History|Math|Language|Philosophy|Art|General", "description": "string", "source_snippet": "string", "is_high_yield": false, "is_ghost": true}
  ],
  "ghost_edges": [
    {"source": "g1", "target": "n2", "label": "string", "type": "enables|challenges|relates_to|is_a_type_of|essential_for", "direction": "uni|bi", "strength": 3}
  ]
}

Rules:
- Use content from the original text to justify each ghost node via source_snippet.
- Keep ghost_nodes to 3 items.
- Use types and directions that match the relationship.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [{
          role: "user",
          parts: [{ text: `Original Text:\n${text}\n\nKnowledge Map:\n${JSON.stringify(knowledge_map)}` }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      console.error("Gemini API error:", response.status, await response.text());
      return new Response(JSON.stringify({ error: "Gemini API error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const responseData = await response.json();
    const parsed = parseGeminiJson(extractGeminiText(responseData));

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    const error = err as Error;
    console.error("scan-knowledge-map error:", error.message);
    return new Response(JSON.stringify({ error: error.message || "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
