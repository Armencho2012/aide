import { corsHeaders } from "./_shared-index.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MIN_QUIZ_QUESTIONS = 5;
const MAX_QUIZ_QUESTIONS_FREE = 10;
const MAX_FLASHCARDS_FREE = 15;
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
  study_plan?: any; // New for Course Mode
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
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Invalid token");

    const body = await req.json().catch(() => ({}));
    const { text, media, isCourse, contextDocuments } = body;

    // isCourse: boolean, contextDocuments: string[] (array of previous texts)

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("API key not configured");

    const systemInstruction = `### ROLE: SENIOR PEDAGOGICAL ARCHITECT & MULTIMODAL KNOWLEDGE ENGINEER
You are an expert system designed to deconstruct complex info (text, images, PDFs) into structured educational modules.

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

### OUTPUT JSON SCHEMA
{
  "metadata": { "language": "string", "subject_domain": "string", "complexity_level": "string" },
  "three_bullet_summary": ["string"],
  "key_terms": [{ "term": "string", "definition": "string", "importance": "string" }],
  "lesson_sections": [{ "title": "string", "summary": "string", "key_takeaway": "string" }],
  "quiz_questions": [{ "question": "string", "options": ["string"], "correct_answer_index": 0, "explanation": "string", "difficulty": "string" }],
  "flashcards": [{ "front": "string", "back": "string" }],
  "knowledge_map": { 
    "nodes": [{ "id": "string", "label": "string", "category": "string", "description": "string" }],
    "edges": [{ "source": "string", "target": "string", "label": "string", "strength": 5 }]
  }
  ${isCourse ? ', "study_plan": { "days": [{ "day": 1, "topics": ["string"], "tasks": ["string"] }] }' : ''}
}`;

    const promptText = `[INPUT]:\n${text || 'Multimodal content provided.'}\n${contextDocuments ? `\n[CONTEXT DOCUMENTS]:\n${contextDocuments.join('\n---\n')}` : ''}`;

    const parts: any[] = [{ text: promptText }];
    if (media) {
      parts.unshift({
        inlineData: {
          data: media.data, // base64
          mimeType: media.mimeType
        }
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: "user", parts }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json"
          }
        })
      }
    );

    const result = await response.json();
    const rawContent = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) throw new Error("Failed to generate analysis");

    const analysis = JSON.parse(rawContent);

    // Filter flashcards for free tier if needed (simplified)
    if (analysis.flashcards) analysis.flashcards = analysis.flashcards.slice(0, MAX_FLASHCARDS_FREE);

    return new Response(JSON.stringify(analysis), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
