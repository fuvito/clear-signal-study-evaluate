
// Question Service - Manages subject data and exam generation
import {type Subject, type Question } from '../types'
import reactQuestions from '../data/questions/react_exam_100_questions.json'
import javaQuestions from '../data/questions/java_exam_v1_200_questions.json'
import tsQuestions from '../data/questions/typescript_exam_v1.json'
import jsQuestions from '../data/questions/javascript_exam_100_questions.json'
import springQuestions from '../data/questions/spring_hibernate_exam_100_questions.json'
import nodeQuestions from '../data/questions/nodejs_exam_100_questions.json'
import systemDesignQuestions from '../data/questions/system_design_exam_100_questions.json'
import restQuestions from '../data/questions/rest_exam_50_questions.json'
import architectQuestions from '../data/questions/software_architect_exam_100_questions.json'
import angularQuestions from '../data/questions/angular_exam_100_questions.json'

// Map of subject codes to their data
const subjectData: Record<string, Subject> = {
    'react': reactQuestions,
    'java': javaQuestions,
    'typescript': tsQuestions,
    'javascript': jsQuestions,
    'spring-hibernate': springQuestions,
    'nodejs': nodeQuestions,
    'system-design': systemDesignQuestions,
    'rest-api': restQuestions,
    'software-architect': architectQuestions,
    'angular': angularQuestions
}

export type QuestionStrategy = 'random' | 'not_answered' | 'least_answered';

interface ExamHistoryItem {
    answers: { questionId: number }[];
}

export const questionService = {
    getSubject(subjectId: string): Subject | null {
        return subjectData[subjectId] as Subject || null;
    },

    getSubjects(): { code: string; name: string; totalQuestions: number }[] {
        return [
            { name: 'React', code: 'react', totalQuestions: reactQuestions.totalQuestions },
            { name: 'Angular', code: 'angular', totalQuestions: angularQuestions.totalQuestions },
            { name: 'Java', code: 'java', totalQuestions: javaQuestions.totalQuestions },
            { name: 'TypeScript', code: 'typescript', totalQuestions: tsQuestions.totalQuestions },
            { name: 'JavaScript', code: 'javascript', totalQuestions: jsQuestions.totalQuestions },
            { name: 'Spring & Hibernate', code: 'spring-hibernate', totalQuestions: springQuestions.totalQuestions },
            { name: 'Node.js', code: 'nodejs', totalQuestions: nodeQuestions.totalQuestions },
            { name: 'System Design', code: 'system-design', totalQuestions: systemDesignQuestions.totalQuestions },
            { name: 'REST API', code: 'rest-api', totalQuestions: restQuestions.totalQuestions },
            { name: 'Software Architect', code: 'software-architect', totalQuestions: architectQuestions.totalQuestions },
        ];
    },

    getQuestions(subjectId: string, count: number, strategy: QuestionStrategy = 'random'): Question[] {
        const subject = this.getSubject(subjectId);
        if (!subject) return [];

        // Flatten all questions from all categories with category name attached
        const allQuestions = subject.categories.flatMap(cat => 
            cat.questions.map(q => ({
                ...q,
                category: cat.title
            }))
        );

        let selectedQuestions: Question[] = [];

        if (strategy === 'random') {
            selectedQuestions = [...allQuestions].sort(() => 0.5 - Math.random());
        } else {
            // Analyze history for usage
            const history: ExamHistoryItem[] = JSON.parse(localStorage.getItem('exam_history') || '[]');
            const questionCounts = new Map<number, number>();

            // Initialize counts to 0
            allQuestions.forEach(q => questionCounts.set(q.id, 0));

            // Count usage
            history.forEach(exam => {
                exam.answers.forEach(ans => {
                    const current = questionCounts.get(ans.questionId) || 0;
                    questionCounts.set(ans.questionId, current + 1);
                });
            });

            if (strategy === 'not_answered') {
                // Filter for count === 0
                const notAnswered = allQuestions.filter(q => (questionCounts.get(q.id) || 0) === 0);
                
                // If we have enough not answered, use them (shuffled)
                if (notAnswered.length > 0) {
                     const shuffledNotAnswered = notAnswered.sort(() => 0.5 - Math.random());
                     // Fill with not answered first
                     selectedQuestions = [...shuffledNotAnswered];
                     
                     // If we need more, fill with least answered
                     if (selectedQuestions.length < count) {
                         const remaining = allQuestions.filter(q => !selectedQuestions.includes(q));
                         const sortedRemaining = remaining.sort((a, b) => {
                             return (questionCounts.get(a.id) || 0) - (questionCounts.get(b.id) || 0);
                         });
                         selectedQuestions = [...selectedQuestions, ...sortedRemaining];
                     }
                } else {
                    // If all answered at least once, fallback to least answered
                     selectedQuestions = [...allQuestions].sort((a, b) => {
                        return (questionCounts.get(a.id) || 0) - (questionCounts.get(b.id) || 0);
                    });
                }
            } else if (strategy === 'least_answered') {
                 // Sort by count ascending, then random for ties
                 selectedQuestions = [...allQuestions].sort((a, b) => {
                    const countA = questionCounts.get(a.id) || 0;
                    const countB = questionCounts.get(b.id) || 0;
                    if (countA === countB) return 0.5 - Math.random();
                    return countA - countB;
                });
            }
        }

        return selectedQuestions.slice(0, count);
    },

    // Legacy support alias
    getRandomQuestions(subjectId: string, count: number): Question[] {
        return this.getQuestions(subjectId, count, 'random');
    }
}
