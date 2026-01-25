
import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { InputTextarea } from 'primereact/inputtextarea'
import { ProgressBar } from 'primereact/progressbar'
import { Dialog } from 'primereact/dialog'
import { questionService, type QuestionStrategy } from '../services/questionService'
import type {Question} from '../types'

interface UserAnswer {
    questionId: number;
    questionText: string;
    userAnswer: string;
    correctAnswer: string; // stored for hint/reference
    hintUsed: boolean;
}

// Internal component that handles the active exam session
// We use a separate component so we can use the 'key' prop to reset state automatically
function ExamSession({ subjectId, count, strategy }: { subjectId: string, count: number, strategy: QuestionStrategy }) {
    const navigate = useNavigate()

    const [questions] = useState<Question[]>(() => {
        return questionService.getQuestions(subjectId, count, strategy)
    })
    
    const [currentIndex, setCurrentIndex] = useState(0)
    const [currentAnswer, setCurrentAnswer] = useState('')
    const [answersByIndex, setAnswersByIndex] = useState<(UserAnswer | null)[]>(() => Array(count).fill(null))
    const [showHint, setShowHint] = useState(false)
    const [hintUsedForCurrent, setHintUsedForCurrent] = useState(false)
    const [transition, setTransition] = useState<{ state: 'idle' | 'exiting' | 'entering'; direction: 'next' | 'prev' }>({ state: 'idle', direction: 'next' })

    // Handle empty questions / redirect
    useEffect(() => {
        if (questions.length === 0) {
            alert('No questions found for this subject')
            navigate('/dashboard')
        }
    }, [questions, navigate])

    const buildUserAnswerForIndex = (index: number): UserAnswer => {
        const q = questions[index]
        return {
            questionId: q.id,
            questionText: q.question,
            userAnswer: currentAnswer,
            correctAnswer: q.answer,
            hintUsed: hintUsedForCurrent
        }
    }

    const persistCurrentAnswer = () => {
        setAnswersByIndex(prev => {
            const next = [...prev]
            next[currentIndex] = buildUserAnswerForIndex(currentIndex)
            return next
        })
    }

    const goToIndexWithAnimation = (nextIndex: number, direction: 'next' | 'prev') => {
        if (transition.state !== 'idle') return

        setTransition({ state: 'exiting', direction })
        window.setTimeout(() => {
            setCurrentIndex(nextIndex)
            const saved = answersByIndex[nextIndex]
            setCurrentAnswer(saved?.userAnswer || '')
            setHintUsedForCurrent(saved?.hintUsed || false)
            setShowHint(false)
            setTransition({ state: 'entering', direction })

            window.setTimeout(() => {
                setTransition({ state: 'idle', direction })
            }, 220)
        }, 180)
    }

    const handleNext = () => {
        persistCurrentAnswer()

        if (currentIndex < questions.length - 1) {
            goToIndexWithAnimation(currentIndex + 1, 'next')
            return
        }

        // Finish Exam
        const finalAnswers = [...answersByIndex]
        finalAnswers[currentIndex] = buildUserAnswerForIndex(currentIndex)
        finishExam(finalAnswers.filter((a): a is UserAnswer => !!a))
    }

    const handlePrev = () => {
        if (currentIndex === 0) return

        persistCurrentAnswer()
        goToIndexWithAnimation(currentIndex - 1, 'prev')
    }

    const finishExam = (finalAnswers: UserAnswer[]) => {
        const examId = Date.now().toString()
        const result = {
            id: examId,
            subjectId,
            timestamp: new Date().toISOString(),
            answers: finalAnswers,
            totalQuestions: questions.length
        }

        // Save to local storage
        const history = JSON.parse(localStorage.getItem('exam_history') || '[]')
        history.push(result)
        localStorage.setItem('exam_history', JSON.stringify(history))

        // Navigate to results
        navigate(`/results/${examId}`)
    }

    const toggleHint = () => {
        setShowHint(true)
        setHintUsedForCurrent(true)
    }

    if (questions.length === 0) {
        return <div>Preparing exam...</div>
    }

    const currentQuestion = questions[currentIndex]
    const progress = ((currentIndex) / questions.length) * 100

    return (
        <div className="flex justify-content-center pb-8">
            <div className="w-full md:w-8 lg:w-6">
                <div className="mb-4">
                    <div className="flex justify-content-between mb-2 text-600 font-medium text-sm">
                        <span>Question {currentIndex + 1} of {questions.length}</span>
                        <span>{Math.round(progress)}% Completed</span>
                    </div>
                    <ProgressBar value={progress} showValue={false} style={{ height: '8px' }} className="border-round-lg"></ProgressBar>
                </div>

                <Card className={`shadow-2 border-round-xl question-transition question-transition--${transition.state} question-transition--${transition.direction}`}>
                    <div className="flex align-items-center mb-4 flex-wrap gap-2">
                        <span className="bg-blue-50 text-blue-600 font-bold border-round px-3 py-1 text-sm">
                            Q{currentIndex + 1}
                        </span>
                        <span className="bg-purple-50 text-purple-600 font-semibold border-round px-3 py-1 text-sm capitalize">
                            {subjectId}
                        </span>
                        {currentQuestion.category && (
                            <span className="bg-teal-50 text-teal-600 font-semibold border-round px-3 py-1 text-sm">
                                {currentQuestion.category}
                            </span>
                        )}
                    </div>
                    
                    <h2 className="text-xl font-medium mb-4 line-height-3 text-700 mt-0">
                        {currentQuestion.question}
                    </h2>

                    <div className="field mb-4">
                        <label htmlFor="answer" className="block mb-2 font-bold text-700">Your Answer</label>
                        <InputTextarea
                            id="answer"
                            value={currentAnswer}
                            onChange={(e) => setCurrentAnswer(e.target.value)}
                            rows={12}
                            className="w-full line-height-3 text-lg border-round-xl bg-gray-50 border-200"
                            placeholder="Type your answer here..."
                            autoResize
                            style={{ minHeight: '200px' }}
                        />
                    </div>

                    <div className="flex justify-content-between align-items-center pt-2">
                         <Button
                            label="Show Hint"
                            icon="pi pi-lightbulb"
                            severity="help"
                            text
                            className="font-bold text-purple-600 hover:bg-purple-50"
                            onClick={toggleHint}
                        />
                        <div className="flex gap-2">
                            <Button
                                label="Previous"
                                icon="pi pi-arrow-left"
                                onClick={handlePrev}
                                disabled={currentIndex === 0 || transition.state !== 'idle'}
                                outlined
                                className="px-4 py-2 font-bold"
                                style={{ borderColor: 'var(--surface-border)', color: 'var(--text-color)' }}
                            />
                            <Button
                                label={currentIndex === questions.length - 1 ? "Finish Exam" : "Next Question"}
                                icon="pi pi-arrow-right"
                                iconPos="right"
                                onClick={handleNext}
                                disabled={!currentAnswer.trim() || transition.state !== 'idle'}
                                className="px-4 py-2 font-bold"
                                style={{ background: 'var(--primary-color)', borderColor: 'var(--primary-color)', color: 'var(--primary-color-text)' }}
                            />
                        </div>
                    </div>
                </Card>

                <Dialog 
                    header="Hint / Answer Key" 
                    visible={showHint} 
                    onHide={() => setShowHint(false)} 
                    style={{ width: '50vw' }} 
                    breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                    contentClassName="line-height-3 text-lg text-700"
                >
                    <div className="p-3 surface-50 border-round">
                        {currentQuestion.answer}
                    </div>
                </Dialog>
            </div>
        </div>
    )
}

export default function Exam() {
    const { subjectId } = useParams()
    const [searchParams] = useSearchParams()
    
    // Default count to 10 if not provided
    const count = parseInt(searchParams.get('count') || '10')
    const strategy = (searchParams.get('strategy') || 'random') as QuestionStrategy

    if (!subjectId) {
        return <div>Invalid Subject</div>
    }

    // The key prop forces React to remount the component when subjectId or count changes,
    // which resets all internal state (currentIndex, answers, etc.) automatically.
    return (
        <ExamSession 
            key={`${subjectId}-${count}-${strategy}`}
            subjectId={subjectId} 
            count={count} 
            strategy={strategy}
        />
    )
}
