import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DAILY_LIMIT_FREE = 1;
const DAILY_LIMIT_PRO = 50;
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
  error?: string;
}

function parseJSON(text: string): any {
  if (!text) return null;
  let t = text.replace(/^\uFEFF/, "").trim();
  const match = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (match) t = match[1];
  const first = t.indexOf("{"), last = t.lastIndexOf("}");
  if (first !== -1 && last > first) t = t.slice(first, last + 1);
  t = t.replace(/,\s*]/g, "]").replace(/,\s*}/g, "}");
  try { return JSON.parse(t); } catch { return null; }
}

async function callAIGateway(apiKey: string, systemPrompt: string, userContent: string): Promise<string | null> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ],
        stream: false
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return null;
      }
      if (response.status === 402) {
        console.error("Payment required");
        return null;
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return null;
    }

    const json = await response.json();
    return json?.choices?.[0]?.message?.content || null;
  } catch (e) {
    console.error("AI gateway call failed:", e);
    return null;
  }
}

async function getUserPlan(supabaseAdmin: any, userId: string): Promise<string> {
  try {
    const { data } = await supabaseAdmin.from('subscriptions').select('status, plan_type, expires_at').eq('user_id', userId).single();
    if (!data) return 'free';
    const isActive = data.status === 'active' && ['pro', 'class'].includes(data.plan_type) && (!data.expires_at || new Date(data.expires_at) > new Date());
    return isActive ? data.plan_type : 'free';
  } catch (err) {
    console.error("Error fetching plan:", err);
    return 'free';
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response('ok', { headers: corsHeaders });
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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;

    if (!supabaseUrl || !supabaseKey || !serviceRoleKey || !apiKey) {
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
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { text, media, language = 'en' } = body;

    if (!text?.trim() && !media) {
      return new Response(JSON.stringify({ error: "No content provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Check usage limits
    const userPlan = await getUserPlan(supabaseAdmin, user.id);
    const isProOrClass = userPlan === 'pro' || userPlan === 'class';

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

    const contentText = text || "Analyze the content.";
    const mediaContext = media ? "\n[User has attached an image/document for analysis]" : "";
    const quizCount = isProOrClass ? 20 : QUIZ_QUESTIONS_COUNT;

    const languageInstruction = {
      'en': 'Respond in English.',
      'ru': 'Отвечайте на русском языке.',
      'hy': 'Պատասխանեք հայերեն։',
      'ko': '한국어로 답변하세요.'
    }[language as string] || 'Respond in English.';

    console.log(`Processing analysis for user ${user.id}, plan: ${userPlan}, language: ${language}`);

    // Parallel AI calls
    const [summaryResult, quizResult, mapResult] = await Promise.all([
      callAIGateway(apiKey,
        `You are an education AI. Respond ONLY with valid JSON in the exact format specified. ${languageInstruction}`,
        `Analyze this content and return JSON:
{"metadata":{"language":"detected language code","subject_domain":"topic area","complexity_level":"beginner|intermediate|advanced"},"three_bullet_summary":["summary point 1","summary point 2","summary point 3"],"key_terms":[{"term":"term name","definition":"definition","importance":"high|medium|low"}],"lesson_sections":[{"title":"section title","summary":"section content","key_takeaway":"main insight"}]}

Provide exactly 3 bullet points, 4-6 key terms, and 2-3 lesson sections. Be concise but informative.

Content to analyze:
${contentText.substring(0, 8000)}${mediaContext}`),

      callAIGateway(apiKey,
        `You are an education AI. Respond ONLY with valid JSON. ${languageInstruction}`,
        `Create educational materials and return JSON:
{"quiz_questions":[{"question":"question text","options":["option A","option B","option C","option D"],"correct_answer_index":0,"explanation":"why this is correct","difficulty":"easy|medium|hard"}],"flashcards":[{"front":"question or term","back":"answer or definition"}]}

Create ${quizCount} quiz questions (mix of easy, medium, hard) and ${FLASHCARDS_COUNT} flashcards.

Content:
${contentText.substring(0, 8000)}${mediaContext}`),

      callAIGateway(apiKey,
        `You are an education AI. Respond ONLY with valid JSON. ${languageInstruction}`,
        `Create a knowledge map and return JSON:
{"knowledge_map":{"nodes":[{"id":"n1","label":"concept name","category":"category","description":"brief description"}],"edges":[{"source":"n1","target":"n2","label":"relationship","strength":5}]}}

Create ${KNOWLEDGE_MAP_NODES_COUNT} nodes representing main concepts and 8-10 edges showing relationships. Strength is 1-10.

Content:
${contentText.substring(0, 8000)}${mediaContext}`),
    ]);

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

    // Log usage (fire and forget)
    supabaseAdmin.from("usage_logs").insert({ user_id: user.id, action_type: "text_analysis" }).then(({ error }) => {
      if (error) console.error("Error logging usage:", error);
    });

    console.log(`Analysis complete for user ${user.id}`);

    return new Response(JSON.stringify(analysis), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Analysis error:", error.message);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});