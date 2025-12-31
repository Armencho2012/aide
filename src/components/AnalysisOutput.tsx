import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Flashcards } from "./Flashcards";

type Language = 'en' | 'ru' | 'hy' | 'ko';

interface LessonSection {
  title: string;
  summary: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer_index: number;
  explanation: string;
}

interface Flashcard {
  front: string;
  back: string;
}

interface AnalysisData {
  language_detected: string;
  three_bullet_summary: string[];
  key_terms: string[];
  lesson_sections?: LessonSection[];
  quick_quiz_question?: QuizQuestion;
  quiz_questions?: QuizQuestion[];
  flashcards?: Flashcard[];
}

interface AnalysisOutputProps {
  data: AnalysisData;
  language: Language;
}

const uiLabels = {
  en: {
    summary: 'Key Summary',
    sections: 'Lesson Sections',
    terms: 'Key Terms',
    quiz: 'Practice Questions',
    questionPrefix: 'Question',
    checkAnswer: 'Check Answer',
    retry: 'Try Again',
    correct: 'Correct!',
    incorrect: 'Incorrect',
    explanation: 'Explanation'
  },
  ru: {
    summary: 'Ключевое Резюме',
    sections: 'Разделы урока',
    terms: 'Ключевые Термины',
    quiz: 'Практические вопросы',
    questionPrefix: 'Вопрос',
    checkAnswer: 'Проверить ответ',
    retry: 'Попробовать снова',
    correct: 'Правильно!',
    incorrect: 'Неправильно',
    explanation: 'Объяснение'
  },
  hy: {
    summary: 'Կարևոր Ամփոփում',
    sections: 'Դասի բաժիններ',
    terms: 'Հիմնական Տերմիններ',
    quiz: 'Փորձնական Հարցեր',
    questionPrefix: 'Հարց',
    checkAnswer: 'Ստուգել պատասխանը',
    retry: 'Կրկին փորձել',
    correct: 'Ճիշտ է!',
    incorrect: 'Սխալ',
    explanation: 'Բացատրություն'
  },
  ko: {
    summary: '주요 요약',
    sections: '수업 구성',
    terms: '주요 용어',
    quiz: '연습 문제',
    questionPrefix: '문항',
    checkAnswer: '답변 확인',
    retry: '다시 시도',
    correct: '정답입니다!',
    incorrect: '오답입니다',
    explanation: '설명'
  }
};

export const AnalysisOutput = ({ data, language }: AnalysisOutputProps) => {
  const [questionStates, setQuestionStates] = useState<{ selectedAnswer: number | null; showResult: boolean; }[]>([]);
  const labels = uiLabels[language];

  const lessonSections = useMemo(() => (data.lesson_sections && data.lesson_sections.length > 0 ? data.lesson_sections : []), [data.lesson_sections]);

  const quizQuestions = useMemo(
    () => (data.quiz_questions && data.quiz_questions.length > 0
      ? data.quiz_questions
      : data.quick_quiz_question
        ? [data.quick_quiz_question]
        : []),
    [data.quiz_questions, data.quick_quiz_question]
  );

  useEffect(() => {
    setQuestionStates(quizQuestions.map(() => ({ selectedAnswer: null, showResult: false })));
  }, [quizQuestions]);

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    setQuestionStates((prev) =>
      prev.map((state, idx) => (idx === questionIndex ? { ...state, selectedAnswer: optionIndex } : state))
    );
  };

  const handleCheckAnswer = (questionIndex: number) => {
    setQuestionStates((prev) =>
      prev.map((state, idx) => (idx === questionIndex ? { ...state, showResult: state.selectedAnswer !== null } : state))
    );
  };

  const handleRetry = (questionIndex: number) => {
    setQuestionStates((prev) =>
      prev.map((state, idx) => (idx === questionIndex ? { selectedAnswer: null, showResult: false } : state))
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4">
      <Card className="border-primary/20 shadow-md">
        <CardHeader>
          <CardTitle className="text-primary">{labels.summary}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {data.three_bullet_summary.map((point, index) => (
              <li key={index} className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {lessonSections.length > 0 && (
        <Card className="border-secondary/20 shadow-md">
          <CardHeader>
            <CardTitle className="text-secondary-foreground">{labels.sections}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lessonSections.map((section, index) => (
              <div key={index} className="space-y-2">
                <p className="font-semibold text-lg text-primary">{section.title}</p>
                <p className="text-muted-foreground leading-relaxed">{section.summary}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-accent/20 shadow-md">
        <CardHeader>
          <CardTitle className="text-accent">{labels.terms}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {data.key_terms.map((term, index) => (
              <Badge key={index} variant="secondary" className="px-4 py-2 text-base">
                {term}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {quizQuestions.length > 0 && (
        <Card className="border-primary/20 shadow-md">
          <CardHeader>
            <CardTitle className="text-primary">
              {labels.quiz} ({quizQuestions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {quizQuestions.map((question, questionIndex) => {
              const questionState = questionStates[questionIndex];
              const selectedAnswer = questionState?.selectedAnswer ?? null;
              const showResult = questionState?.showResult ?? false;
              const isCorrect = selectedAnswer !== null && selectedAnswer === question.correct_answer_index;

              return (
                <div key={questionIndex} className="space-y-4 border rounded-lg p-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      {labels.questionPrefix} {questionIndex + 1}
                    </span>
                    <p className="font-medium text-lg leading-relaxed">{question.question}</p>
                  </div>

                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <button
                        key={optionIndex}
                        onClick={() => !showResult && handleSelectOption(questionIndex, optionIndex)}
                        disabled={showResult}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          selectedAnswer === optionIndex
                            ? showResult
                              ? isCorrect
                                ? 'border-green-500 bg-green-50 dark:bg-green-950'
                                : 'border-red-500 bg-red-50 dark:bg-red-950'
                              : 'border-primary bg-secondary'
                            : 'border-border hover:border-primary/50'
                        } ${showResult && optionIndex === question.correct_answer_index ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option}</span>
                          {showResult && optionIndex === question.correct_answer_index && (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          )}
                          {showResult && selectedAnswer === optionIndex && !isCorrect && (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    {!showResult ? (
                      <Button
                        onClick={() => handleCheckAnswer(questionIndex)}
                        disabled={selectedAnswer === null}
                        className="w-full sm:flex-1"
                      >
                        {labels.checkAnswer}
                      </Button>
                    ) : (
                      <>
                        <div className={`w-full sm:flex-1 p-4 rounded-lg ${isCorrect ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
                          <p className={`font-bold mb-2 ${isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                            {isCorrect ? labels.correct : labels.incorrect}
                          </p>
                          <p className="text-sm leading-relaxed">
                            <strong>{labels.explanation}:</strong> {question.explanation}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleRetry(questionIndex)}
                          variant="outline"
                          className="w-full sm:flex-[0.4]"
                        >
                          {labels.retry}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Flashcards */}
      {data.flashcards && data.flashcards.length > 0 && (
        <Flashcards flashcards={data.flashcards} language={language} />
      )}
    </div>
  );
};
