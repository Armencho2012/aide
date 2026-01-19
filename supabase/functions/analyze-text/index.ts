import { corsHeaders } from "./_shared-index.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DAILY_LIMIT_FREE = 1;
const DAILY_LIMIT_PRO = 50;
// Class tier has unlimited (no limit check)

const QUIZ_QUESTIONS_COUNT = 10;
const FLASHCARDS_COUNT = 15;
const KNOWLEDGE_MAP_NODES_COUNT = 15;

const MAX_FLASHCARDS_FREE = 20; // hard safety cap

const MAX_OUTPUT_TOKENS = 16384;

interface AnalysisResult {
  metadata?: {
    language?: string;
    subject_domain?: string;
    complexity_level?: string;
  };
  language_detected?: string;
  three_bullet_summary?: string[];
  key_terms?: Array<{ term: string; definition: string; importance: string }>;
  lesson_sections?: Array<{ title: string; summary: string; key_takeaway: string }>;
  quiz_questions?: Array<{
    question: string;
    options: string[];
    correct_answer_index: number;
    explanation: string;
    difficulty: "easy" | "medium" | "hard";
  }>;
  flashcards?: Array<{ front: string; back: string }>;
  quick_quiz_question?: unknown;
  knowledge_map?: {
    nodes: Array<{ id: string; label: string; category: string; description: string }>;
    edges: Array<{ source: string; target: string; label: string; strength: number }>;
  };
  study_plan?: unknown;
  error?: string;
}

function shortenForLog(text: string, max = 1400) {
  if (!text) return text;
  if (text.length <= max) return text;
  const head = Math.floor(max * 0.7);
  const tail = max - head;
  return `${text.slice(0, head)}\n...<truncated>...\n${text.slice(-tail)}`;
}

function stripCodeFences(text: string) {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return match ? match[1] : text;
}

function extractJsonObject(text: string) {
  // Sometimes the model returns leading commentary; try to isolate the JSON object.
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) return text.slice(first, last + 1);
  return text;
}

function removeTrailingCommas(text: string) {
  return text
    .replace(/,\s*]/g, "]")
    .replace(/,\s*}/g, "}");
}

function escapeControlCharsInsideStrings(text: string) {
  // Gemini sometimes emits literal newlines inside JSON strings => JSON.parse throws
  // "Unterminated string in JSON". We only escape control chars when inside strings.
  let out = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (!inString) {
      if (ch === '"') inString = true;
      out += ch;
      continue;
    }

    // inString
    if (escaped) {
      escaped = false;
      out += ch;
      continue;
    }

    if (ch === "\\") {
      escaped = true;
      out += ch;
      continue;
    }

    if (ch === "\n") {
      out += "\\n";
      continue;
    }

    if (ch === "\r") {
      out += "\\r";
      continue;
    }

    if (ch === "\t") {
      out += "\\t";
      continue;
    }

    if (ch === '"') {
      inString = false;
      out += ch;
      continue;
    }

    out += ch;
  }

  return out;
}

function normalizeJsonText(rawText: string) {
  let t = rawText ?? "";
  t = t.replace(/^\uFEFF/, "").trim();
  t = stripCodeFences(t);
  t = extractJsonObject(t);
  t = removeTrailingCommas(t.trim());
  t = escapeControlCharsInsideStrings(t);
  return t.trim();
}

function parseAnalysisOrThrow(rawText: string): AnalysisResult {
  const normalized = normalizeJsonText(rawText);

  try {
    return JSON.parse(normalized) as AnalysisResult;
  } catch (e1) {
    // Second try: sometimes there are stray backslashes; escape them.
    try {
      const safer = normalized.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
      return JSON.parse(safer) as AnalysisResult;
    } catch (e2) {
      console.error("Failed to parse AI JSON.");
      console.error("Normalized (debug):", shortenForLog(normalized));
      console.error("Parse error #1:", e1);
      console.error("Parse error #2:", e2);
      throw new Error("Failed to parse AI response. Please try again.");
    }
  }
}

async function callGeminiGenerateContent(opts: {
  apiKey: string;
  model: string;
  systemInstruction: string;
  parts: any[];
  temperature: number;
}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:generateContent?key=${opts.apiKey}`;

  const payload: any = {
    systemInstruction: { parts: [{ text: opts.systemInstruction }] },
    contents: [{ role: "user", parts: opts.parts }],
    generationConfig: {
      temperature: opts.temperature,
      responseMimeType: "application/json",
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, json };
}

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

    // Admin client for logging usage (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Invalid token");

    // Get user's subscription plan
    const userPlan = await getUserPlan(supabaseAdmin, user.id);
    console.log(`User ${user.id} has plan: ${userPlan}`);

    // Check daily usage limit BEFORE processing (skip for class tier - unlimited)
    if (userPlan !== 'class') {
      const { data: usageCount, error: usageError } = await supabase.rpc(
        "get_daily_usage_count",
        {
          p_user_id: user.id,
        },
      );

      if (usageError) {
        console.error("Error checking usage:", usageError);
      }

      const currentUsage = usageCount || 0;
      const dailyLimit = userPlan === 'pro' ? DAILY_LIMIT_PRO : DAILY_LIMIT_FREE;
      
      if (currentUsage >= dailyLimit) {
        const message = userPlan === 'free' 
          ? `Daily limit of ${DAILY_LIMIT_FREE} analyses reached. Please upgrade for more access.`
          : `Monthly limit of ${DAILY_LIMIT_PRO} analyses reached. Upgrade to Class for unlimited access.`;
        
        return new Response(
          JSON.stringify({ error: message }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    const body = await req.json().catch(() => ({}));
    const { text, media, isCourse, contextDocuments } = body;

    if (!text?.trim() && !media) {
      throw new Error("No content provided for analysis");
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("API key not configured");

    const systemInstruction = `### ROLE: SENIOR PEDAGOGICAL ARCHITECT & MULTIMODAL KNOWLEDGE ENGINEER
You are an expert system designed to deconstruct complex info (text, images, PDFs) into structured educational modules.
CRITICAL: You MUST respond in the SAME LANGUAGE as the input text.

${isCourse ? `### COURSE MODE ENABLED
You are analyzing a set of related documents.
1. Create a \"Cross-Document Knowledge Map\" that links concepts across all documents.
2. Generate a \"7-Day Study Plan\" based on complexity and prerequisites.` : ""}

### MULTIMODAL INSTRUCTIONS
- If an image or PDF is provided, perform high-accuracy OCR first.
- Extract all diagrams, formulas, and key concepts.

### CRITICAL REQUIREMENTS
1. Generate EXACTLY ${QUIZ_QUESTIONS_COUNT} quiz questions.
2. Generate EXACTLY ${FLASHCARDS_COUNT} flashcards.
3. Each flashcard back must be detailed but not overly long (50-90 words).
4. All content must be in the SAME LANGUAGE as the input text.
5. IMPORTANT JSON RULE: ALL string values must be single-line. Do NOT include literal newlines inside JSON strings. If needed, use \\n.

### KNOWLEDGE MAP
- Nodes: EXACTLY ${KNOWLEDGE_MAP_NODES_COUNT} nodes.
- Edges: 20-30 edges with descriptive labels.

### OUTPUT JSON SCHEMA
{
  \"metadata\": { \"language\": \"string\", \"subject_domain\": \"string\", \"complexity_level\": \"string\" },
  \"three_bullet_summary\": [\"string\"],
  \"key_terms\": [{ \"term\": \"string\", \"definition\": \"string\", \"importance\": \"string\" }],
  \"lesson_sections\": [{ \"title\": \"string\", \"summary\": \"string\", \"key_takeaway\": \"string\" }],
  \"quiz_questions\": [{ \"question\": \"string\", \"options\": [\"string\",\"string\",\"string\",\"string\"], \"correct_answer_index\": 0, \"explanation\": \"string\", \"difficulty\": \"easy|medium|hard\" }],
  \"flashcards\": [{ \"front\": \"string\", \"back\": \"string\" }],
  \"knowledge_map\": {
    \"nodes\": [{ \"id\": \"string\", \"label\": \"string\", \"category\": \"string\", \"description\": \"string\" }],
    \"edges\": [{ \"source\": \"string\", \"target\": \"string\", \"label\": \"string\", \"strength\": 5 }]
  }
  ${isCourse ? ', \"study_plan\": { \"days\": [{ \"day\": 1, \"topics\": [\"string\"], \"tasks\": [\"string\"] }] }' : ""}
}

Return ONLY valid JSON. No markdown, no commentary.`;

    const promptText = `[INPUT]:\n${text || "Multimodal content provided."}\n${contextDocuments ? `\n[CONTEXT DOCUMENTS]:\n${contextDocuments.join("\n---\n")}` : ""}`;

    const parts: any[] = [{ text: promptText }];
    if (media) {
      parts.unshift({
        inlineData: {
          data: media.data,
          mimeType: media.mimeType,
        },
      });
    }

    console.log(
      `Processing analysis for user ${user.id}, plan: ${userPlan}`,
    );

    // Newest Gemini family (per docs): gemini-3-flash-preview
    const modelsToTry = [
      "gemini-3-flash-preview",
      "gemini-3-pro-preview",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
    ];

    let lastStatus = 0;
    let lastProviderError: string | null = null;
    let lastParseError: string | null = null;

    let analysis: AnalysisResult | null = null;

    for (const model of modelsToTry) {
      for (const temperature of [0.3, 0.0]) {
        console.log(`Calling Gemini model: ${model} (temperature=${temperature})`);

        const { ok, status, json } = await callGeminiGenerateContent({
          apiKey,
          model,
          systemInstruction,
          parts,
          temperature,
        });

        lastStatus = status;

        if (!ok) {
          const msg = json?.error?.message || `AI provider error (HTTP ${status})`;
          lastProviderError = msg;
          console.error(
            "Gemini API non-2xx:",
            model,
            status,
            shortenForLog(JSON.stringify(json)),
          );

          // If responseMimeType isn't supported for this model/version, retry once without it.
          // (Kept for backward compatibility; Gemini 3 should support it.)
          if (typeof msg === "string" && msg.includes("responseMimeType")) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const retryPayload: any = {
              systemInstruction: { parts: [{ text: systemInstruction }] },
              contents: [{ role: "user", parts }],
              generationConfig: {
                temperature: 0.0,
                maxOutputTokens: MAX_OUTPUT_TOKENS,
              },
            };

            const retryRes = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(retryPayload),
            });

            const retryJson = await retryRes.json().catch(() => null);
            lastStatus = retryRes.status;

            if (!retryRes.ok) {
              const retryMsg =
                retryJson?.error?.message ||
                `AI provider error (HTTP ${retryRes.status})`;
              lastProviderError = retryMsg;
              console.error(
                "Gemini retry non-2xx:",
                model,
                retryRes.status,
                shortenForLog(JSON.stringify(retryJson)),
              );
              continue;
            }

            const retryRaw =
              retryJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            try {
              analysis = parseAnalysisOrThrow(retryRaw);
              break;
            } catch (e) {
              lastParseError = e instanceof Error ? e.message : String(e);
              continue;
            }
          }

          continue;
        }

        const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
          console.error("Gemini API empty content:", shortenForLog(JSON.stringify(json)));
          lastProviderError = "Empty content returned";
          continue;
        }

        try {
          analysis = parseAnalysisOrThrow(rawText);
          break;
        } catch (e) {
          lastParseError = e instanceof Error ? e.message : String(e);
          console.error("Parse failed for model", model, "temp", temperature);
          continue;
        }
      }

      if (analysis) break;
    }

    if (!analysis) {
      const msg = lastProviderError
        ? lastProviderError
        : lastParseError
          ? lastParseError
          : `AI provider error (HTTP ${lastStatus})`;

      return new Response(JSON.stringify({ error: msg }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Safety cap for free tier
    if (analysis.flashcards) {
      analysis.flashcards = analysis.flashcards.slice(0, MAX_FLASHCARDS_FREE);
    }

    // Log usage with admin client (bypasses RLS)
    const { error: logError } = await supabaseAdmin.from("usage_logs").insert({
      user_id: user.id,
      action_type: "text_analysis",
    });

    if (logError) {
      console.error("Error logging usage:", logError);
      // Don't fail the request, just log the error
    } else {
      console.log(`Usage logged for user ${user.id}`);
    }

    return new Response(JSON.stringify(analysis), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("Analysis error:", err);
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
