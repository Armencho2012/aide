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

// Ultra-fast parallel call with 12s timeout
async function callGemini(apiKey: string, systemPrompt: string, userContent: string, parts: any[] = []) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const allParts = [...parts, { text: userContent }];
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: allParts }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json", maxOutputTokens: 4000 },
      }),
    });
    clearTimeout(timeout);
    const json = await res.json();
    return json?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (e) {
    clearTimeout(timeout);
    console.error("Gemini call failed:", e);
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
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("API key not configured");

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

    console.log(`User ${user.id} plan: ${userPlan} (${Date.now() - startTime}ms)`);

    const contentText = text || "Analyze the content.";
    const mediaParts: any[] = media ? [{ inlineData: { data: media.data, mimeType: media.mimeType } }] : [];

    // PARALLEL CALLS - 3 specialized fast calls instead of 1 big slow call
    const quizCount = isProOrClass ? 20 : QUIZ_QUESTIONS_COUNT;

    const [summaryResult, quizResult, mapResult] = await Promise.all([
      // Call 1: Summary, key terms, lesson sections (fastest)
      callGemini(apiKey, `Respond in same language as input. Return JSON:
{"metadata":{"language":"string","subject_domain":"string","complexity_level":"beginner|intermediate|advanced"},"three_bullet_summary":["b1","b2","b3"],"key_terms":[{"term":"string","definition":"string","importance":"high|medium|low"}],"lesson_sections":[{"title":"string","summary":"string","key_takeaway":"string"}]}
3 bullets, 4 key terms, 3 sections. Be concise.`, contentText, mediaParts),

      // Call 2: Quiz + Flashcards
      callGemini(apiKey, `Respond in same language as input. Return JSON:
{"quiz_questions":[{"question":"string","options":["a","b","c","d"],"correct_answer_index":0,"explanation":"string","difficulty":"easy|medium|hard"}],"flashcards":[{"front":"string","back":"string"}]}
${quizCount} quiz questions, ${FLASHCARDS_COUNT} flashcards. Concise answers.`, contentText, mediaParts),

      // Call 3: Knowledge map
      callGemini(apiKey, `Respond in same language as input. Return JSON:
{"knowledge_map":{"nodes":[{"id":"n1","label":"string","category":"string","description":"string"}],"edges":[{"source":"n1","target":"n2","label":"string","strength":5}]}}
${KNOWLEDGE_MAP_NODES_COUNT} nodes, 8 edges. Short labels.`, contentText, mediaParts),
    ]);

    console.log(`All 3 parallel calls done (${Date.now() - startTime}ms)`);

    // Merge results
    const summary = parseJSON(summaryResult) || {};
    const quiz = parseJSON(quizResult) || {};
    const map = parseJSON(mapResult) || {};

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
