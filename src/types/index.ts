export interface Question {
  id: number;
  question: string;
  answer: string;
  category?: string;
}

export interface Category {
  id: string;
  title: string;
  questions: Question[];
}

export interface Subject {
  subject: string;
  version: string;
  totalQuestions: number;
  categories: Category[];
}

export interface ExamConfig {
  subjectId: string;
  questionCount: number;
}
