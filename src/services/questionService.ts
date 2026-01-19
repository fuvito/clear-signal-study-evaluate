
import {type Subject, type Question } from '../types'
import reactQuestions from '../data/questions/react_exam_100_questions.json'
import javaQuestions from '../data/questions/java_exam_v1_200_questions.json'
import tsQuestions from '../data/questions/typescript_exam_v1.json'
import jsQuestions from '../data/questions/javascript_exam_100_questions.json'

// Map of subject codes to their data
const subjectData: Record<string, Subject> = {
    'react': reactQuestions,
    'java': javaQuestions,
    'typescript': tsQuestions,
    'javascript': jsQuestions
}

export const questionService = {
    getSubject(subjectId: string): Subject | null {
        return subjectData[subjectId] as Subject || null;
    },

    getRandomQuestions(subjectId: string, count: number): Question[] {
        const subject = this.getSubject(subjectId);
        if (!subject) return [];

        // Flatten all questions from all categories with category name attached
        const allQuestions = subject.categories.flatMap(cat => 
            cat.questions.map(q => ({
                ...q,
                category: cat.title
            }))
        );

        // Shuffle and slice
        const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
}
