import { corsHeaders } from "./_shared-index.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DAILY_LIMIT_FREE = 1;
const DAILY_LIMIT_PRO = 50;

// Reduced counts for speed
const QUIZ_QUESTIONS_COUNT = 5;
const FLASHCARDS_COUNT = 10;
const KNOWLEDGE_MAP_NODES_COUNT = 6;

const MAX_FLASHCARDS_FREE = 20;

interface AnalysisResult {
  metadata?: { language?: string; subject_domain?: string; complexity_level?: string };
  three_bullet_summary?: string[];
  key_terms?: Array<{ term: string; definition: string; importance: string }>;
  lesson_sections?: Array<{ title: string; summary: string; key_takeaway: string }>;
  quiz_questions?: Array<{ question: string; options: string[]; correct_answer_index: number; explanation: string; difficulty: string }>;
  flashcards?: Array<{ front: string; back: string }>;
  knowledge_map?: { nodes: Array<{ id: string; label: string; category: string; description: string }>; edges: Array<{ source: string; target: string; label: string; strength: number }> };
  study_plan?: unknown;
  error?: string;
}

function parseJSON(text: string): any {
  let t = text?.replace(/^\uFEFF/, "").trim() || "";
  const match = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (match) t = match[1];
  const first = t.indexOf("{"), last = t.lastIndexOf("}");
  if (first !== -1 && last > first) t = t.slice(first, last + 1);
  t = t.replace(/,\s*]/g, "]").replace(/,\s*}/g, "}");
  try { return JSON.parse(t); } catch { return null; }
}

// Parallel call using Lovable AI Gateway with 30s timeout
async function callLovableAI(apiKey: string, systemPrompt: string, userContent: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ],
        response_format: { type: "json_object" }
      }),
    });
    clearTimeout(timeout);
    
    if (!res.ok) {
      const errText = await res.text();
      console.error("Lovable AI error:", res.status, errText);
      return null;
    }
    
    const json = await res.json();
    return json?.choices?.[0]?.message?.content || null;
  } catch (e) {
    clearTimeout(timeout);
    console.error("Lovable AI call failed:", e);
    return null;
  }
}

async function getUserPlan(supabaseAdmin: any, userId: string): Promise<string> {
  const { data } = await supabaseAdmin.from('subscriptions').select('status, plan_type, expires_at').eq('user_id', userId).single();
  if (!data) return 'free';
  const isActive = data.status === 'active' && ['pro', 'class'].includes(data.plan_type) && (!data.expires_at || new Date(data.expires_at) > new Date());
  return isActive ? data.plan_type : 'free';
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: authHeader } } });
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const [userResult, body] = await Promise.all([supabase.auth.getUser(), req.json().catch(() => ({}))]);
    const { data: { user }, error: authError } = userResult;
    if (authError || !user) throw new Error("Invalid token");

    const { text, media, isCourse } = body;
    if (!text?.trim() && !media) throw new Error("No content provided");

    const userPlan = await getUserPlan(supabaseAdmin, user.id);
    const isProOrClass = userPlan === 'pro' || userPlan === 'class';

    // Check usage limit
    if (userPlan !== 'class') {
      const { data: usageCount } = await supabase.rpc("get_daily_usage_count", { p_user_id: user.id });
      const dailyLimit = userPlan === 'pro' ? DAILY_LIMIT_PRO : DAILY_LIMIT_FREE;
      if ((usageCount || 0) >= dailyLimit) {
        return new Response(JSON.stringify({ error: "Daily limit reached. Upgrade for more." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    console.log(`Processing analysis for user ${user.id}, plan: ${userPlan}`);

    const contentText = text || "Analyze the content.";
    
    // Include media info in prompt if present
    const mediaContext = media ? "\n[User has attached an image/document for analysis]" : "";

    // PARALLEL CALLS - 3 specialized fast calls
    const quizCount = isProOrClass ? 20 : QUIZ_QUESTIONS_COUNT;

    const [summaryResult, quizResult, mapResult] = await Promise.all([
      // Call 1: Summary, key terms, lesson sections
      callLovableAI(apiKey, `You are an education AI. Respond ONLY with valid JSON in the exact format specified. Analyze the content and respond in the same language as the input.`, 
        `Analyze this content and return JSON:
{"metadata":{"language":"detected language code","subject_domain":"topic area","complexity_level":"beginner|intermediate|advanced"},"three_bullet_summary":["summary point 1","summary point 2","summary point 3"],"key_terms":[{"term":"term name","definition":"definition","importance":"high|medium|low"}],"lesson_sections":[{"title":"section title","summary":"section content","key_takeaway":"main insight"}]}

Provide exactly 3 bullet points, 4-6 key terms, and 2-3 lesson sections. Be concise but informative.

Content to analyze:
${contentText.substring(0, 8000)}${mediaContext}`),

      // Call 2: Quiz + Flashcards
      callLovableAI(apiKey, `You are an education AI. Respond ONLY with valid JSON. Create quiz questions and flashcards in the same language as the input content.`,
        `Create educational materials and return JSON:
{"quiz_questions":[{"question":"question text","options":["option A","option B","option C","option D"],"correct_answer_index":0,"explanation":"why this is correct","difficulty":"easy|medium|hard"}],"flashcards":[{"front":"question or term","back":"answer or definition"}]}

Create ${quizCount} quiz questions (mix of easy, medium, hard) and ${FLASHCARDS_COUNT} flashcards.

Content:
${contentText.substring(0, 8000)}${mediaContext}`),

      // Call 3: Knowledge map
      callLovableAI(apiKey, `You are an education AI. Respond ONLY with valid JSON. Create a knowledge map in the same language as the input.`,
        `Create a knowledge map and return JSON:
{"knowledge_map":{"nodes":[{"id":"n1","label":"concept name","category":"category","description":"brief description"}],"edges":[{"source":"n1","target":"n2","label":"relationship","strength":5}]}}

Create ${KNOWLEDGE_MAP_NODES_COUNT} nodes representing main concepts and 8-10 edges showing relationships. Strength is 1-10.

Content:
${contentText.substring(0, 8000)}${mediaContext}`),
    ]);

    console.log(`All 3 parallel calls done (${Date.now() - startTime}ms)`);

    // Merge results
    const summary = parseJSON(summaryResult) || {};
    const quiz = parseJSON(quizResult) || {};
    const map = parseJSON(mapResult) || {};

    // Debug: log what we got
    if (!summaryResult) console.error("Summary call returned null");
    if (!quizResult) console.error("Quiz call returned null");
    if (!mapResult) console.error("Map call returned null");

    const analysis: AnalysisResult = {
      metadata: summary.metadata || { language: "en", subject_domain: "General", complexity_level: "intermediate" },
      three_bullet_summary: summary.three_bullet_summary || ["Content analyzed", "Key concepts identified", "Study materials generated"],
      key_terms: summary.key_terms || [],
      lesson_sections: summary.lesson_sections || [],
      quiz_questions: quiz.quiz_questions || [],
      flashcards: (quiz.flashcards || []).slice(0, MAX_FLASHCARDS_FREE),
      knowledge_map: map.knowledge_map || { nodes: [], edges: [] },
    };

    // Background: log usage (fire and forget)
    supabaseAdmin.from("usage_logs").insert({ user_id: user.id, action_type: "text_analysis" }).then(() => { });
    console.log(`Analysis complete: ${Date.now() - startTime}ms total`);

    return new Response(JSON.stringify(analysis), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("Analysis error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
