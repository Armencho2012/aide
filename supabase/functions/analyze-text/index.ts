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

interface KnowledgeMapNode {
  id: string;
  label: string;
  category: string;
  description?: string;
}

interface KnowledgeMapEdge {
  id?: string;
  source: string;
  target: string;
  label?: string;
  strength?: string | number;
}

interface KnowledgeMap {
  nodes: KnowledgeMapNode[];
  edges: KnowledgeMapEdge[];
}

interface AnalysisResult {
  metadata?: {
    language?: string;
    subject_domain?: string;
    complexity_level?: string;
  };
  language_detected?: string;
  three_bullet_summary?: string[];
  key_terms?: string[] | Array<{ term: string; definition: string; importance?: string }>;
  lesson_sections?: LessonSection[];
  quiz_questions?: QuizQuestion[];
  flashcards?: Flashcard[];
  quick_quiz_question?: QuizQuestion;
  knowledge_map?: KnowledgeMap;
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
      console.error("GEMINI_API_KEY missing in environment");
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // --- 5. Gemini API Call Function (with Retry Logic) ---
    const callGemini = async (promptText: string, systemInstructionText: string): Promise<AnalysisResult> => {
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
                systemInstruction: {
                  parts: [{ text: systemInstructionText }]
                },
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

    // --- 6. Prompt Definition with System Instructions ---
    const systemInstruction = `### ROLE: SENIOR PEDAGOGICAL ARCHITECT & KNOWLEDGE ENGINEER
You are an expert system designed to deconstruct complex information into structured, machine-readable educational modules. Your intelligence combines the accuracy of a research scientist with the clarity of a master educator. You specialize in "Concept Mapping" and "Semantic Interoperability."

### MANDATE
Your objective is to ingest the [INPUT TEXT] and synthesize it into a highly sophisticated JSON object. You must act as a bridge between the raw text and the user's need for a comprehensive understanding of the subject.

### CORE OPERATIONAL PRINCIPLES
1.  **Linguistic Mirroring:** You MUST detect the primary language of the [INPUT TEXT] and generate every single string within the JSON in that EXACT language. Do not translate terms unless they are industry standard in English (e.g., specific scientific or technical terms).
2.  **The "Expert-in-the-Loop" Logic (External Knowledge):** You are NOT limited to the provided text. You must use your internal global training data to enhance the output. If the text mentions a concept that requires prerequisite knowledge to understand, you are AUTHORIZED and ENCOURAGED to inject "Contextual Nodes" and "Bridge Explanations" to ensure the learner has a complete picture.
3.  **No-Chat Constraint:** You are a pure JSON engine. Do not provide greetings, markdown code fences (\`\`\`json), or post-processing commentary. Return only the raw, minified string.

### KNOWLEDGE MAP (THE GRAPH ENGINE) SPECIFICATIONS
The 'knowledge_map' is the most critical part of this task. You must create a "Semantic Web" of the topic.
-   **Node Density:** Aim for a high density of nodes (15-25 nodes). 
-   **Categories:** Categorize nodes as 'Core Concept', 'Supporting Detail', 'Historical Context', 'Mathematical Formula', or 'Related Entity'.
-   **Edge Intelligence:** Edges must not be generic. Every edge requires a 'label' that defines the semantic relationship (e.g., "inhibits", "derives from", "quantifies", "contradicts", "precedes").
-   **Network Connectivity:** Avoid "islands." Ensure the graph is logically interconnected. Use your internal logic to create connections that might be implied but not explicitly stated in the text.

### DETAILED CONTENT REQUIREMENTS
-   **Three-Bullet Summary:** These must be "Mega-Bullets." Each point should be a 2-3 sentence synthesis of a major theme, focusing on the "Why" and "How," not just the "What."
-   **Key Terms:** Provide 10 terms. The definition must be sophisticated, including the term's significance in the broader field.
-   **Lesson Sections:** Create a narrative flow. Divide the content into 5-6 logical modules. Each summary should be roughly 150-200 words of high-value instructional content.
-   **Quiz Questions:** 10 questions of varying difficulty. 
    - 3 Recall (Factual)
    - 4 Application (Scenario-based)
    - 3 Analysis (Relational logic)
-   **Flashcards:** 15 cards. Use the "Active Recall" style. The front should be a provocative question or a key term, and the back should be a concise, "memory-anchoring" explanation.

### JSON SCHEMA STRUCTURE (STRICT ADHERENCE REQUIRED)
{
  "metadata": {
    "language": "string",
    "subject_domain": "string",
    "complexity_level": "Beginner|Intermediate|Advanced"
  },
  "three_bullet_summary": [
    "Comprehensive synthesis point 1",
    "Comprehensive synthesis point 2",
    "..."
  ],
  "key_terms": [
    {
      "term": "string",
      "definition": "string",
      "importance": "string"
    }
  ],
  "lesson_sections": [
    {
      "order": 1,
      "title": "string",
      "summary": "minimum 3-5 sentence detailed instructional text",
      "key_takeaway": "string"
    }
  ],
  "quiz_questions": [
    {
      "question_id": 1,
      "question": "string",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer_index": 0,
      "explanation": "Detailed pedagogical explanation of why the answer is correct and why distractors are wrong.",
      "difficulty": "Easy|Medium|Hard"
    }
  ],
  "flashcards": [
    {
      "front": "string",
      "back": "string"
    }
  ],
  "quick_quiz_question": {
    "question": "string",
    "options": ["A", "B", "C", "D"],
    "correct_answer_index": 0,
    "explanation": "string"
  },
  "knowledge_map": {
    "nodes": [
      {
        "id": "node_001",
        "label": "string",
        "category": "string",
        "description": "Short 1-sentence context for the node"
      }
    ],
    "edges": [
      {
        "source": "node_001",
        "target": "node_002",
        "label": "descriptive relationship verb/phrase",
        "strength": "1-10"
      }
    ]
  }
}

### FINAL INSTRUCTION
Analyze the input text below. Apply your expert knowledge. Construct the map efficiently. Output only the JSON.`;

    const prompt = `[INPUT TEXT TO ANALYZE]:\n${text}`;

    const mainAnalysis = await callGemini(prompt, systemInstruction);

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
            return { 
              title: String(section.title), 
              summary: String(section.summary) 
            };
          }
          return null;
        })
        .filter((s): s is LessonSection => s !== null)
        .sort((a, b) => {
          // Sort by order if available, otherwise by title
          const aOrder = (a as any).order ?? 0;
          const bOrder = (b as any).order ?? 0;
          return aOrder - bOrder;
        });
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

    // Normalize knowledge map data - handle new structure with label and strength on edges
    const normalizeKnowledgeMap = (km: any): KnowledgeMap | undefined => {
      if (!km || typeof km !== 'object') return undefined;
      const nodes = Array.isArray(km.nodes) 
        ? km.nodes.slice(0, 25).map((node: any) => ({
            id: node.id || String(Math.random()),
            label: node.label || '',
            category: node.category || 'general',
            description: node.description || ''
          }))
        : [];
      const edges = Array.isArray(km.edges) 
        ? km.edges.slice(0, 30).map((edge: any, index: number) => ({
            id: edge.id || `${edge.source}-${edge.target}-${index}`,
            source: edge.source || '',
            target: edge.target || '',
            label: edge.label || '',
            strength: edge.strength || '5'
          }))
        : [];
      return { nodes, edges };
    };

    // Handle new metadata structure
    const metadata = (mainAnalysis as any).metadata || {};
    const language_detected = metadata.language || (mainAnalysis as any).language_detected || 'en';
    
    // Normalize key_terms - handle both old format (string[]) and new format (object[])
    const normalizeKeyTerms = (terms: any): string[] => {
      if (!Array.isArray(terms)) return [];
      return terms.map((term: any) => {
        if (typeof term === 'string') return term;
        if (term && typeof term === 'object' && term.term) return term.term;
        return String(term);
      }).filter(Boolean);
    };

    responsePayload = {
      ...mainAnalysis,
      language_detected,
      three_bullet_summary: mainAnalysis.three_bullet_summary || [],
      key_terms: normalizeKeyTerms(mainAnalysis.key_terms),
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
