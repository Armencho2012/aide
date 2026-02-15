import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "./_shared-index.ts";

// Config Constants
const DAILY_LIMIT_FREE = 1;
const DAILY_LIMIT_PRO = 50;
const KNOWLEDGE_MAP_NODES_COUNT = 6;
const DEFAULT_QUIZ_COUNT = 5;
const DEFAULT_FLASHCARD_COUNT = 10;
const QUIZ_LIMITS = {
  free: { min: 1, max: 5 },
  pro: { min: 1, max: 15 },
  class: { min: 1, max: 50 }
};
const FLASHCARD_LIMITS = {
  free: { min: 1, max: 5 },
  pro: { min: 1, max: 20 },
  class: { min: 1, max: 40 }
};
const BASE_MAX_TOKENS = 8192;
const PRO_MAP_MAX_TOKENS = 12288;
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
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Auth & Environment Validation
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
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 3. Parse Request & Check Limits
    const body = await req.json().catch(() => ({}));
    const { text, media, language = 'en', generationOptions, n_questions, n_flashcards } = body;
    if (!text?.trim() && !media) {
      return new Response(JSON.stringify({ error: "No content provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan_type, status')
      .eq('user_id', user.id)
      .single();

    const userPlan = subscription?.status === 'active' ? (subscription.plan_type || 'free') : 'free';
    const isProOrClass = ['pro', 'class'].includes(userPlan);

    // Daily usage check via RPC
    if (userPlan !== 'class') {
      const { data: usageCount } = await supabase.rpc("get_daily_usage_count", { p_user_id: user.id });
      const dailyLimit = userPlan === 'pro' ? DAILY_LIMIT_PRO : DAILY_LIMIT_FREE;
      if ((usageCount || 0) >= dailyLimit) {
        return new Response(JSON.stringify({ error: "Daily limit reached. Upgrade for more." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // 4. AI Integration using Gemini API
    const contentContext = text.substring(0, 15000);
    const mediaContext = media ? "\n[Analyzing attached visual media]" : "";

    // Build conditional system prompt based on generation options
    const opts = {
      quiz: true,
      flashcards: true,
      map: false,
      course: false,
      podcast: false,
      ...(generationOptions || {})
    };

    const quizLimits = QUIZ_LIMITS[userPlan] || QUIZ_LIMITS.free;
    const flashcardLimits = FLASHCARD_LIMITS[userPlan] || FLASHCARD_LIMITS.free;
    const parseCount = (value: unknown, fallback: number) => {
      if (typeof value === "number" && Number.isFinite(value)) return value;
      if (typeof value === "string") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
      }
      return fallback;
    };
    const requestedQuizCount = parseCount(n_questions, parseCount(generationOptions?.n_questions, DEFAULT_QUIZ_COUNT));
    const requestedFlashcardCount = parseCount(n_flashcards, parseCount(generationOptions?.n_flashcards, DEFAULT_FLASHCARD_COUNT));
    const quizCount = opts.quiz
      ? Math.min(Math.max(requestedQuizCount, quizLimits.min), quizLimits.max)
      : 0;
    const flashcardCount = opts.flashcards
      ? Math.min(Math.max(requestedFlashcardCount, flashcardLimits.min), flashcardLimits.max)
      : 0;

    const sections = [];

    // Always include core sections
    sections.push(`"metadata": {"language": "${language}", "subject_domain": "string", "complexity_level": "beginner|intermediate|advanced"}`);
    sections.push(`"three_bullet_summary": ["string", "string", "string"]`);
    sections.push(`"key_terms": [{"term": "string", "definition": "string", "importance": "high|medium|low"}]`);
    sections.push(`"lesson_sections": [{"title": "string", "summary": "string", "key_takeaway": "string"}]`);

    // Conditional sections (only include if requested)
    if (opts.quiz) {
      sections.push(`"quiz_questions": [{"question": "string", "options": ["A", "B", "C", "D"], "correct_answer_index": 0, "explanation": "string", "difficulty": "easy|medium|hard"}]`);
    }

    if (opts.flashcards) {
      sections.push(`"flashcards": [{"front": "string", "back": "string"}]`);
    }

    if (opts.map) {
      sections.push(`"knowledge_map": {"nodes": [{"id": "n1", "label": "string", "category": "Concept|Problem|Technology|Science|History|Math|Language|Philosophy|Art|General", "description": "string", "source_snippet": "string", "is_high_yield": true}], "edges": [{"source": "n1", "target": "n2", "label": "string", "type": "enables|challenges|relates_to|is_a_type_of|essential_for", "direction": "uni|bi", "strength": 5}]}`);
    }

    const knowledgeMapInstruction = opts.map
      ? isProOrClass
        ? `Create exactly ${KNOWLEDGE_MAP_NODES_COUNT} knowledge map nodes with 2-4 sentence descriptions that are more detailed than the summary bullets, include concrete examples, and use clear categories. Each node must include a short source_snippet taken verbatim or near-verbatim from the input. Mark 1-2 nodes as is_high_yield: true. Include 8-12 edges with specific labels, types (enables, challenges, relates_to, is_a_type_of, essential_for), directions (uni or bi), and strengths from 1-5.`
        : `Create exactly ${KNOWLEDGE_MAP_NODES_COUNT} knowledge map nodes. Each node must include a source_snippet. Include 6-10 edges with labels, types, directions, and strengths.`
      : null;

    const systemPrompt = `You are a world-class education engine. Respond in ${language}.
Return a SINGLE JSON object exactly like this:
{
${sections.join(",\n")}
}

Math: Use LaTeX notation like $x^2$.
${opts.quiz ? `Create exactly ${quizCount} quiz questions.` : ''}
${opts.flashcards ? `Create exactly ${flashcardCount} flashcards.` : ''}
${knowledgeMapInstruction ?? ''}`.trim();

    const maxTokens = opts.map && isProOrClass ? PRO_MAP_MAX_TOKENS : BASE_MAX_TOKENS;

    console.log(`Analyzing for user: ${user.id} (Plan: ${userPlan}, Quiz: ${opts.quiz}, Flashcards: ${opts.flashcards}, Map: ${opts.map}, QuizCount: ${quizCount}, FlashcardsCount: ${flashcardCount})`);

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
          parts: [{ text: `Content: ${contentContext}${mediaContext}` }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: maxTokens,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      console.error("Gemini API error:", response.status, await response.text());
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw new Error("Gemini API error");
    }

    const responseData = await response.json();
    const jsonText = extractGeminiText(responseData);
    let analysis = parseGeminiJson(jsonText);

    // Validate and ensure all required fields exist
    if (!analysis.metadata) {
      analysis.metadata = { language, subject_domain: "general", complexity_level: "intermediate" };
    }
    if (!analysis.three_bullet_summary) {
      analysis.three_bullet_summary = ["Summary not available", "Unable to analyze content", "Please try again"];
    }
    if (!analysis.key_terms) analysis.key_terms = [];
    if (!analysis.lesson_sections) analysis.lesson_sections = [];
    if (!analysis.quiz_questions) analysis.quiz_questions = [];
    if (!analysis.flashcards) analysis.flashcards = [];
    if (!analysis.knowledge_map) {
      analysis.knowledge_map = { nodes: [], edges: [] };
    }
    if (!opts.quiz) analysis.quiz_questions = [];
    if (!opts.flashcards) analysis.flashcards = [];
    if (!opts.map) analysis.knowledge_map = { nodes: [], edges: [] };

    if (analysis.knowledge_map?.nodes && Array.isArray(analysis.knowledge_map.nodes)) {
      analysis.knowledge_map.nodes = analysis.knowledge_map.nodes.map((node: any, idx: number) => ({
        id: node?.id || `n${idx + 1}`,
        label: node?.label || 'Node',
        category: node?.category || 'General',
        description: node?.description || '',
        source_snippet: node?.source_snippet || '',
        is_high_yield: Boolean(node?.is_high_yield),
      }));
    } else {
      analysis.knowledge_map.nodes = [];
    }

    if (analysis.knowledge_map?.edges && Array.isArray(analysis.knowledge_map.edges)) {
      analysis.knowledge_map.edges = analysis.knowledge_map.edges.map((edge: any, idx: number) => ({
        id: edge?.id || `e${idx + 1}`,
        source: edge?.source,
        target: edge?.target,
        label: edge?.label || edge?.type || 'relates to',
        type: edge?.type || 'relates_to',
        direction: edge?.direction || 'uni',
        strength: edge?.strength ?? 3,
      })).filter((edge: any) => edge.source && edge.target);
    } else {
      analysis.knowledge_map.edges = [];
    }

    // 5. Async Logging & Final Response
    supabaseAdmin.from("usage_logs").insert({ user_id: user.id, action_type: "analysis" }).then();

    return new Response(JSON.stringify(analysis), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    const error = err as Error;
    console.error("Critical Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message || "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

