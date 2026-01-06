import { corsHeaders } from "./_shared-index.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MIN_QUIZ_QUESTIONS = 5;
const MAX_QUIZ_QUESTIONS_FREE = 10;
const MAX_QUIZ_QUESTIONS_PRO = 80;
const MAX_FLASHCARDS_FREE = 15;
const MAX_FLASHCARDS_PRO = 100;
const DAILY_LIMIT = 5;
const MAX_TEXT_LENGTH = 50000;

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer_index: number;
  explanation: string;
}

interface LessonSection {
  title: string;
  summary: string;
}

interface Flashcard {
  front: string;
  back: string;
}

interface AnalysisResult {
  language_detected?: string;
  three_bullet_summary?: string[];
  key_terms?: string[];
  lesson_sections?: LessonSection[];
  quiz_questions?: QuizQuestion[];
  flashcards?: Flashcard[];
  quick_quiz_question?: QuizQuestion;
  error?: string;
}

Deno.serve(async (req: Request) => {
  console.log("Request received:", req.method);
  
  // --- 1. CORS Preflight Handler ---
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let responsePayload: AnalysisResult = {};
  
  try {
    // --- 2. Authentication & Authorization ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization header required" }), {
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
      console.error("Auth error:", authError?.message);
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log("Authenticated user:", user.id);

    // --- 3. Check if user has pro subscription ---
    const { data: isPro, error: proError } = await supabase.rpc('is_pro_user', {
      p_user_id: user.id
    });

    if (proError) {
      console.error("Pro check error:", proError.message);
      // Continue with free tier limits if check fails
    }

    const DAILY_LIMIT = isPro ? 999999 : 5; // Unlimited for pro users

    // Only check usage limit for free users
    if (!isPro) {
      const { data: usageCount, error: usageError } = await supabase.rpc('get_daily_usage_count', {
        p_user_id: user.id
      });

      if (usageError) {
        console.error("Usage check error:", usageError.message);
        return new Response(JSON.stringify({ error: "Failed to check usage limits" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (usageCount >= DAILY_LIMIT) {
        console.log(`User ${user.id} exceeded daily limit: ${usageCount}/${DAILY_LIMIT}`);
        return new Response(JSON.stringify({ error: "Daily analysis limit reached. Please upgrade or try again tomorrow." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // --- 4. Input Validation ---
    const body = await req.json().catch(() => ({}));
    const { text } = body;
    
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Text is required and must be non-empty" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return new Response(JSON.stringify({ error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error("❌ GEMINI_API_KEY missing in environment");
      return new Response(JSON.stringify({ error: "Server misconfigured: missing API key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // --- 5. Gemini API Call Function (with Retry Logic) ---
    const callGemini = async (promptText: string): Promise<AnalysisResult> => {
      const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
      const maxAttempts = 3;
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: promptText }] }],
                generationConfig: { temperature: 0.6 }
              })
            }
          );

          const result = await response.json().catch(() => ({}));
          
          if (!response.ok) {
            const errMsg = result?.error?.message || response.statusText;
            if (response.status === 429 && attempt < maxAttempts) {
              const delay = 500 * Math.pow(2, attempt - 1);
              console.log(`⏳ Rate limited, retrying in ${delay}ms...`);
              await sleep(delay);
              continue;
            }
            throw new Error(`Gemini API error ${response.status}: ${errMsg}`);
          }

          const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          
          // Clean the response - remove markdown code blocks if present
          let cleanedText = rawText.trim();
          if (cleanedText.startsWith("```json")) {
            cleanedText = cleanedText.slice(7);
          } else if (cleanedText.startsWith("```")) {
            cleanedText = cleanedText.slice(3);
          }
          if (cleanedText.endsWith("```")) {
            cleanedText = cleanedText.slice(0, -3);
          }
          cleanedText = cleanedText.trim();

          try {
            return JSON.parse(cleanedText);
          } catch {
            console.warn("Failed to parse Gemini response as JSON, returning empty object.");
            return {};
          }
        } catch (err) {
          const error = err as Error;
          console.error("Attempt failed:", error.message);
          if (attempt < maxAttempts) await sleep(500 * attempt);
        }
      }
      return {}; // fallback empty object
    };

    // --- 6. Prompt Definition ---
    const prompt = `You are an expert academic content analyst specializing in educational material structuring. Your task is to transform raw text into comprehensive, well-organized learning resources.

PERSONA:
- Academic and professional
- Detail-oriented and thorough
- Focused on educational value
- Ensures accuracy and clarity

OUTPUT CONSTRAINTS:
- All content MUST be in the SAME LANGUAGE as the input text
- Maintain academic tone appropriate to the subject matter
- Ensure all quiz questions are meaningful and test understanding, not just recall
- Flashcards should cover key concepts, not trivial details
- Lesson sections should be logically organized and comprehensive
- Knowledge map entities and relationships MUST be extracted ONLY from the provided text - do not add outside information or general knowledge

REQUIRED JSON STRUCTURE:
{
  "language_detected": "detected language code",
  "three_bullet_summary": ["point 1", "point 2", ...], // 3-7 comprehensive summary points
  "key_terms": ["term1", "term2", ...], // 6-10 essential terms with clear definitions
  "lesson_sections": [
    {"title": "section title", "summary": "detailed summary"},
    ...
  ], // 3-6 well-structured sections
  "quiz_questions": [
    {
      "question": "clear, meaningful question",
      "options": ["option A", "option B", "option C", "option D"], // exactly 4 options
      "correct_answer_index": 0, // 0-3
      "explanation": "detailed explanation of why this is correct"
    },
    ...
  ], // exactly 10 high-quality questions
  "flashcards": [
    {"front": "term or concept", "back": "clear definition/explanation"},
    ...
  ], // exactly 15 flashcards covering key concepts
  "quick_quiz_question": {same structure as first quiz_question},
  "knowledge_map": {
    "nodes": [
      {
        "id": "unique-id",
        "label": "Entity name from text",
        "category": "general",
        "connectedTo": ["other-node-id"]
      }
    ],
    "edges": [
      {
        "id": "edge-id",
        "source": "node-id-1",
        "target": "node-id-2"
      }
    ]
  }
}

CRITICAL: 
- Return ONLY valid JSON. No markdown formatting, no code blocks, no explanatory text. The JSON must be parseable.
- For knowledge_map: Extract key entities and relationships STRICTLY from the provided text. Do not add outside information, general knowledge, or concepts not mentioned in the text. Only include entities and relationships that are explicitly present in the provided text.

Text to analyze:
${text}`;

    const mainAnalysis = await callGemini(prompt);

    // --- 7. Normalization Functions ---
    const normalizeQuestion = (q: unknown): QuizQuestion | null => {
      if (!q || typeof q !== "object") return null;
      const questionObj = q as Record<string, unknown>;
      const { question, options, correct_answer_index, explanation } = questionObj;
      if (!question || !options || !explanation) return null;
      return {
        question: String(question),
        options: Array.isArray(options) ? options.slice(0, 4).map(String) : ["A", "B", "C", "D"],
        correct_answer_index: Number.isInteger(correct_answer_index) 
          ? Math.max(0, Math.min(3, correct_answer_index as number)) 
          : 0,
        explanation: String(explanation)
      };
    };

    const normalizeSections = (sections: unknown): LessonSection[] => {
      if (!Array.isArray(sections)) return [];
      return sections
        .map((s: unknown) => {
          if (!s || typeof s !== "object") return null;
          const section = s as Record<string, unknown>;
          if (section?.title && section?.summary) {
            return { title: String(section.title), summary: String(section.summary) };
          }
          return null;
        })
        .filter((s): s is LessonSection => s !== null);
    };

    const dedupeByQuestion = (arr: (QuizQuestion | null)[]): QuizQuestion[] => {
      const seen = new Set<string>();
      return arr.filter((q): q is QuizQuestion => {
        if (!q) return false;
        const key = q.question.trim().toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    // --- 8. Normalize and Filter Quiz Logic ---
    let quizQuestions = dedupeByQuestion(
      (mainAnalysis.quiz_questions || []).map(normalizeQuestion).filter(Boolean)
    );

    if (quizQuestions.length === 0 && mainAnalysis.quick_quiz_question) {
      const fallback = normalizeQuestion(mainAnalysis.quick_quiz_question);
      if (fallback) quizQuestions.push(fallback);
    }

    if (quizQuestions.length < MIN_QUIZ_QUESTIONS) {
      const base = quizQuestions[0] || {
        question: "Placeholder question",
        options: ["A", "B", "C", "D"],
        correct_answer_index: 0,
        explanation: "No quiz could be generated."
      };
      while (quizQuestions.length < MIN_QUIZ_QUESTIONS) {
        quizQuestions.push({
          ...base,
          question: `${base.question} (Variant ${quizQuestions.length + 1})`
        });
      }
    }

    // --- 9. Log usage after successful analysis ---
    const { error: logError } = await supabase
      .from('usage_logs')
      .insert({ user_id: user.id, action_type: 'text_analysis' });
    
    if (logError) {
      console.warn("Failed to log usage:", logError.message);
    }

    // --- 10. Final Response Payload ---
    const flashcards = Array.isArray((mainAnalysis as any).flashcards) 
      ? (mainAnalysis as any).flashcards.slice(0, MAX_FLASHCARDS_FREE) 
      : [];

    // Normalize knowledge map data
    const normalizeKnowledgeMap = (km: any) => {
      if (!km || typeof km !== 'object') return null;
      const nodes = Array.isArray(km.nodes) ? km.nodes.slice(0, 20) : [];
      const edges = Array.isArray(km.edges) ? km.edges.slice(0, 30) : [];
      return { nodes, edges };
    };

    responsePayload = {
      ...mainAnalysis,
      quiz_questions: quizQuestions.slice(0, MAX_QUIZ_QUESTIONS_FREE),
      flashcards,
      quick_quiz_question: quizQuestions[0],
      lesson_sections: normalizeSections(mainAnalysis.lesson_sections),
      knowledge_map: normalizeKnowledgeMap((mainAnalysis as any).knowledge_map)
    };

    console.log(`✅ Success: ${quizQuestions.length} quiz questions generated for user ${user.id}`);
  } catch (err) {
    const error = err as Error;
    console.error("❌ Error in analyze-text function:", error.message);
    responsePayload = { error: error.message };
  }

  // --- 11. Final HTTP Response ---
  return new Response(JSON.stringify(responsePayload), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
