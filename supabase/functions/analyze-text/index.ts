import { corsHeaders } from "./_shared-index.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MIN_QUIZ_QUESTIONS = 10;
const MAX_QUIZ_QUESTIONS_FREE = 15;
const MAX_FLASHCARDS_FREE = 20;
const DAILY_LIMIT_FREE = 5;

interface AnalysisResult {
  metadata?: {
    language?: string;
    subject_domain?: string;
    complexity_level?: string;
  };
  language_detected?: string;
  three_bullet_summary?: string[];
  key_terms?: any[];
  lesson_sections?: any[];
  quiz_questions?: any[];
  flashcards?: any[];
  quick_quiz_question?: any;
  knowledge_map?: any;
  study_plan?: any;
  error?: string;
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
      global: { headers: { Authorization: authHeader } }
    });

    // Admin client for logging usage (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Invalid token");

    // Check daily usage limit BEFORE processing
    const { data: usageCount, error: usageError } = await supabase.rpc('get_daily_usage_count', {
      p_user_id: user.id
    });

    if (usageError) {
      console.error('Error checking usage:', usageError);
    }

    const currentUsage = usageCount || 0;
    if (currentUsage >= DAILY_LIMIT_FREE) {
      return new Response(JSON.stringify({ 
        error: `Daily limit of ${DAILY_LIMIT_FREE} analyses reached. Please upgrade for unlimited access.` 
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
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
CRITICAL: You MUST respond in the SAME LANGUAGE as the input text. If the input is in Russian, respond in Russian. If in Armenian, respond in Armenian. If in Korean, respond in Korean.

${isCourse ? `### COURSE MODE ENABLED
You are analyzing a set of related documents. 
1. Create a "Cross-Document Knowledge Map" that links concepts across all documents.
2. Generate a "7-Day Study Plan" based on complexity and prerequisites.` : ''}

### MULTIMODAL INSTRUCTIONS
- If an image or PDF is provided, perform high-accuracy OCR first.
- Extract all diagrams, formulas, and key concepts.

### KNOWLEDGE MAP (THE GRAPH ENGINE)
- Nodes: 15-25 nodes. Categories: 'Core Concept', 'Supporting Detail', 'Historical Context', 'Mathematical Formula', 'Related Entity'.
- Edges: descriptive 'label' (e.g., "inhibits", "derives from").
- Visuals: Assign a 'strength' 1-10 to edges.

### CRITICAL REQUIREMENTS:
1. Generate EXACTLY 10-15 quiz questions. This is MANDATORY. Do NOT generate fewer than 10 questions.
2. Generate EXACTLY 15-20 flashcards. This is MANDATORY.
3. Each flashcard should have substantial content (50-150 words on the back).
4. All content must be in the SAME LANGUAGE as the input text.

### OUTPUT JSON SCHEMA
{
  "metadata": { "language": "string", "subject_domain": "string", "complexity_level": "string" },
  "three_bullet_summary": ["string"],
  "key_terms": [{ "term": "string", "definition": "string", "importance": "string" }],
  "lesson_sections": [{ "title": "string", "summary": "string", "key_takeaway": "string" }],
  "quiz_questions": [{ "question": "string", "options": ["string","string","string","string"], "correct_answer_index": 0, "explanation": "string", "difficulty": "easy|medium|hard" }],
  "flashcards": [{ "front": "string", "back": "string (50-150 words detailed explanation)" }],
  "knowledge_map": { 
    "nodes": [{ "id": "string", "label": "string", "category": "string", "description": "string" }],
    "edges": [{ "source": "string", "target": "string", "label": "string", "strength": 5 }]
  }
  ${isCourse ? ', "study_plan": { "days": [{ "day": 1, "topics": ["string"], "tasks": ["string"] }] }' : ''}
}

REMINDER: You MUST generate at least 10 quiz_questions and 15 flashcards. This is a hard requirement.`;

    const promptText = `[INPUT]:\n${text || 'Multimodal content provided.'}\n${contextDocuments ? `\n[CONTEXT DOCUMENTS]:\n${contextDocuments.join('\n---\n')}` : ''}`;

    const parts: any[] = [{ text: promptText }];
    if (media) {
      parts.unshift({
        inlineData: {
          data: media.data,
          mimeType: media.mimeType
        }
      });
    }

    console.log(`Processing analysis for user ${user.id}, current usage: ${currentUsage}`);

    // Try a small set of known-good model IDs (Google occasionally deprecates older names)
    const modelsToTry = [
      "gemini-3-flash-preview",
      "gemini-2.5-flash",
      "gemini-2.0-flash-001",
    ];

    let result: any = null;
    let lastStatus = 0;

    for (const model of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      // v1beta supports systemInstruction + responseMimeType
      const payload: any = {
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
          maxOutputTokens: 8192, // Increased to accommodate 10+ questions and 15+ flashcards
        },
      };

      console.log(`Calling Gemini model: ${model}`);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      lastStatus = response.status;
      result = await response.json().catch(() => null);

      if (response.ok) {
        break;
      }

      console.error("Gemini API non-2xx:", model, lastStatus, JSON.stringify(result));

      // If responseMimeType isn't supported for this model/version, retry once without it.
      const msg = result?.error?.message as string | undefined;
      if (msg && msg.includes("responseMimeType")) {
        const retryPayload = {
          ...payload,
          generationConfig: { temperature: 0.2 },
        };
        const retryResponse = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(retryPayload),
        });

        lastStatus = retryResponse.status;
        result = await retryResponse.json().catch(() => null);

        if (retryResponse.ok) {
          break;
        }

        console.error("Gemini retry non-2xx:", model, lastStatus, JSON.stringify(result));
      }
    }

    // All attempts failed
    if (!result || result?.error) {
      const msg = result?.error?.message || `AI provider error (HTTP ${lastStatus})`;
      return new Response(JSON.stringify({ error: msg }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawContent = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) {
      console.error("Gemini API empty content:", JSON.stringify(result));
      throw new Error("Failed to generate analysis");
    }

    // Sanitize JSON: remove trailing commas before ] or } (common Gemini issue)
    let sanitizedContent = rawContent
      .replace(/,\s*]/g, ']')   // Remove trailing commas before ]
      .replace(/,\s*}/g, '}');  // Remove trailing commas before }

    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = sanitizedContent.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      sanitizedContent = jsonMatch[1];
    }
    
    // Remove any leading/trailing whitespace and potential BOM
    sanitizedContent = sanitizedContent.trim().replace(/^\uFEFF/, '');

    let analysis: AnalysisResult;
    try {
      analysis = JSON.parse(sanitizedContent);
    } catch (parseError) {
      console.error('JSON parse error, raw content:', rawContent.substring(0, 500));
      console.error('Parse error:', parseError);
      throw new Error("Failed to parse AI response. Please try again.");
    }

    // Filter flashcards for free tier
    if (analysis.flashcards) {
      analysis.flashcards = analysis.flashcards.slice(0, MAX_FLASHCARDS_FREE);
    }

    // Log usage with admin client (bypasses RLS)
    const { error: logError } = await supabaseAdmin
      .from('usage_logs')
      .insert({
        user_id: user.id,
        action_type: 'text_analysis'
      });

    if (logError) {
      console.error('Error logging usage:', logError);
      // Don't fail the request, just log the error
    } else {
      console.log(`Usage logged for user ${user.id}, new count: ${currentUsage + 1}`);
    }

    return new Response(JSON.stringify(analysis), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: unknown) {
    console.error('Analysis error:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
