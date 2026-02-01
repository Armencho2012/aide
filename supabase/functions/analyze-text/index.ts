import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.24.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Config Constants
const DAILY_LIMIT_FREE = 1;
const DAILY_LIMIT_PRO = 50;
const FLASHCARDS_COUNT = 10;/**
 * SUPABASE EDGE FUNCTION: educational-architect-2026
 * Description: PhD-level content analysis, quiz generation, and knowledge mapping.
 * Dependencies: @google/generative-ai, @supabase/supabase-js
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "https://esm.sh/@google/generative-ai@0.24.0";

// --- CONFIGURATION & CONSTANTS ---
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version',
  'Content-Type': 'application/json',
};

const LIMITS = {
  FREE: { DAILY: 2, QUIZ: 5, FLASHCARDS: 10, NODES: 6 },
  PRO: { DAILY: 50, QUIZ: 20, FLASHCARDS: 30, NODES: 15 },
};

// 2026 Model Prioritization
const MODEL_CANDIDATES = [
  "gemini-3-flash-preview", 
  "gemini-3-pro-preview",
  "gemini-2.5-flash"
];

// --- UTILITY TYPES ---
interface AnalysisRequest {
  text: string;
  media?: string; // Base64 or URL
  language?: string;
}

// --- CORE LOGIC ---

Deno.serve(async (req: Request) => {
  // 1. Handle Preflight CORS
  if (req.method === "OPTIONS") return new Response('ok', { headers: CORS_HEADERS });

  const startTime = Date.now();
  console.log("--- ANALYSIS START ---");

  try {
    // 2. Validate Environment
    const env = Deno.env.toObject();
    const { 
      SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY 
    } = env;

    if (!SUPABASE_URL || !GEMINI_API_KEY) {
      throw new Error("Critical Configuration Missing: API Keys not found in secrets.");
    }

    // 3. Authenticate User
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization Header");

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized: Invalid user session.");

    // 4. Parse & Sanitize Request
    const body: AnalysisRequest = await req.json().catch(() => ({}));
    const { text, language = 'en' } = body;
    if (!text || text.trim().length < 10) throw new Error("Content too short for analysis.");

    // 5. Subscription & Usage Check
    console.log(`Checking plan for User: ${user.id}`);
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('plan_type, status')
      .eq('user_id', user.id)
      .maybeSingle();

    const isPaid = sub?.status === 'active' && ['pro', 'class'].includes(sub.plan_type);
    const plan = isPaid ? 'PRO' : 'FREE';
    const config = isPaid ? LIMITS.PRO : LIMITS.FREE;

    // Daily limit check via RPC
    const { data: count, error: rpcError } = await supabase.rpc("get_daily_usage_count", { p_user_id: user.id });
    if (rpcError) console.error("RPC Usage Error:", rpcError);
    
    if (plan !== 'PRO' && (count || 0) >= config.DAILY) {
      return new Response(JSON.stringify({ 
        error: "DAILY_LIMIT_REACHED", 
        message: "You've used your free analysis for today. Upgrade to Pro for 50/day." 
      }), { status: 429, headers: CORS_HEADERS });
    }

    // 6. Gemini AI Initialization
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    let analysisResult = null;
    let successfulModel = "";

    // Retries across candidates
    for (const modelName of MODEL_CANDIDATES) {
      try {
        console.log(`Attempting analysis with: ${modelName}`);
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: { 
            responseMimeType: "application/json",
            // @ts-ignore: Native 2026 reasoning flag
            thinkingLevel: isPaid ? "high" : "medium" 
          }
        });

        const prompt = `
          You are a PhD-level Educational Architect. Analyze this content for a student.
          Target Language: ${language}
          
          REQUIRED JSON STRUCTURE:
          {
            "metadata": { "subject": "string", "complexity": "beginner|intermediate|advanced" },
            "summary": ["point 1", "point 2", "point 3"],
            "key_terms": [{ "term": "string", "definition": "string", "importance": "high|medium" }],
            "quiz": [{ "question": "string", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "string" }],
            "flashcards": [{ "front": "string", "back": "string" }],
            "knowledge_map": {
              "nodes": [{ "id": "n1", "label": "string", "category": "concept", "description": "string" }],
              "edges": [{ "source": "n1", "target": "n2", "label": "relation" }]
            }
          }

          Constraints:
          - Generate ${config.QUIZ} quiz questions.
          - Generate ${config.FLASHCARDS} flashcards.
          - Generate ${config.NODES} knowledge map nodes.
          - Use LaTeX for all math: $E=mc^2$.
        `;

        const result = await model.generateContent([
          { text: prompt },
          { text: `Content to process: ${text.substring(0, 20000)}` }
        ]);

        const rawText = result.response.text();
        analysisResult = JSON.parse(rawText);
        successfulModel = modelName;
        break; // Exit loop if successful
      } catch (err) {
        console.warn(`Model ${modelName} failed. Error:`, err.message);
        continue; // Try next model
      }
    }

    if (!analysisResult) throw new Error("AI failed to generate a valid response after multiple attempts.");

    // 7. Log Usage (Fire and Forget)
    supabaseAdmin.from("usage_logs").insert({ 
      user_id: user.id, 
      action_type: "text_analysis",
      model_used: successfulModel,
      processing_time_ms: Date.now() - startTime
    }).then(({ error }) => { if (error) console.error("Logging failed:", error); });

    // 8. Final Success Response
    console.log(`--- ANALYSIS COMPLETE in ${Date.now() - startTime}ms ---`);
    return new Response(JSON.stringify(analysisResult), { 
      status: 200, 
      headers: CORS_HEADERS 
    });

  } catch (err: any) {
    console.error("CRITICAL ERROR:", err.message);
    
    // Attempt to categorize error for the frontend
    const statusCode = err.message.includes("Unauthorized") ? 401 : 500;
    
    return new Response(JSON.stringify({ 
      error: "INTERNAL_SERVER_ERROR", 
      message: err.message,
      trace: Date.now() 
    }), { 
      status: statusCode, 
      headers: CORS_HEADERS 
    });
  }
});

const KNOWLEDGE_MAP_NODES_COUNT = 6;
const MAX_FLASHCARDS_FREE = 20;

Deno.serve(async (req: Request) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") return new Response('ok', { headers: corsHeaders });

  try {
    // 2. Auth & Environment Validation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization required");

    const env = Deno.env.toObject();
    const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY } = env;

    if (!SUPABASE_URL || !GEMINI_API_KEY) throw new Error("Missing environment variables");

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Invalid or expired token");

    // 3. Parse Request & Check Limits
    const { text, media, language = 'en' } = await req.json().catch(() => ({}));
    if (!text?.trim() && !media) throw new Error("No content provided");

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

    // 4. Gemini AI Integration (The "Brains")
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // Using gemini-3-flash-preview for the highest reasoning/speed ratio in 2026
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      // Forces the model to output valid JSON based on our prompt structure
      generationConfig: { 
        responseMimeType: "application/json",
        // @ts-ignore: 2026 reasoning parameter
        thinkingLevel: "medium" 
      }
    });

    const quizCount = isProOrClass ? 15 : 5;
    const contentContext = text.substring(0, 15000); // 2026 models handle larger context
    const mediaContext = media ? "\n[Analyzing attached visual media]" : "";

    const systemPrompt = `You are a world-class education engine. Respond in ${language}.
    Return a SINGLE JSON object exactly like this:
    {
      "metadata": {"language": "code", "subject_domain": "string", "complexity_level": "beginner|intermediate|advanced"},
      "three_bullet_summary": ["string", "string", "string"],
      "key_terms": [{"term": "string", "definition": "string", "importance": "high|medium|low"}],
      "lesson_sections": [{"title": "string", "summary": "string", "key_takeaway": "string"}],
      "quiz_questions": [{"question": "string", "options": ["A", "B", "C", "D"], "correct_answer_index": 0, "explanation": "string", "difficulty": "easy|medium|hard"}],
      "flashcards": [{"front": "string", "back": "string"}],
      "knowledge_map": {
        "nodes": [{"id": "n1", "label": "string", "category": "string", "description": "string"}],
        "edges": [{"source": "n1", "target": "n2", "label": "string", "strength": 5}]
      }
    }
    
    Stats: Create ${quizCount} quiz questions, ${FLASHCARDS_COUNT} flashcards, and ${KNOWLEDGE_MAP_NODES_COUNT} map nodes.
    Math: Use LaTeX notation like $x^2$.`;

    console.log(`Analyzing for user: ${user.id} (Plan: ${userPlan})`);

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: `Content: ${contentContext}${mediaContext}` }
    ]);

    // No need for regex parsing anymore!
    const analysis = JSON.parse(result.response.text());

    // Slice flashcards for free users if necessary
    if (!isProOrClass && analysis.flashcards) {
      analysis.flashcards = analysis.flashcards.slice(0, MAX_FLASHCARDS_FREE);
    }

    // 5. Async Logging & Final Response
    supabaseAdmin.from("usage_logs").insert({ user_id: user.id, action_type: "text_analysis" }).then();

    return new Response(JSON.stringify(analysis), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Critical Function Error:", err.message);
    return new Response(JSON.stringify({ error: err.message || "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

});
