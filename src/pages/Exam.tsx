
import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { InputTextarea } from 'primereact/inputtextarea'
import { ProgressBar } from 'primereact/progressbar'
import { Dialog } from 'primereact/dialog'
import { questionService } from '../services/questionService'
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
function ExamSession({ subjectId, count }: { subjectId: string, count: number }) {
    const navigate = useNavigate()

    const [questions] = useState<Question[]>(() => {
        return questionService.getRandomQuestions(subjectId, count)
    })
    
    const [currentIndex, setCurrentIndex] = useState(0)
    const [currentAnswer, setCurrentAnswer] = useState('')
    const [answers, setAnswers] = useState<UserAnswer[]>([])
    const [showHint, setShowHint] = useState(false)
    const [hintUsedForCurrent, setHintUsedForCurrent] = useState(false)

    // Handle empty questions / redirect
    useEffect(() => {
        if (questions.length === 0) {
            alert('No questions found for this subject')
            navigate('/dashboard')
        }
    }, [questions, navigate])

    const handleNext = () => {
        const currentQ = questions[currentIndex]
        const newAnswer: UserAnswer = {
            questionId: currentQ.id,
            questionText: currentQ.question,
            userAnswer: currentAnswer,
            correctAnswer: currentQ.answer,
            hintUsed: hintUsedForCurrent
        }

        const newAnswers = [...answers, newAnswer]
        setAnswers(newAnswers)

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1)
            setCurrentAnswer('')
            setHintUsedForCurrent(false)
            setShowHint(false)
        } else {
            // Finish Exam
            finishExam(newAnswers)
        }
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

                <Card className="shadow-2 border-round-xl">
                    <div className="flex align-items-center mb-4 flex-wrap gap-2">
                        <span className="bg-indigo-50 text-indigo-600 font-bold border-round px-3 py-1 text-sm">
                            Q{currentIndex + 1}
                        </span>
                        <span className="bg-bluegray-50 text-bluegray-600 font-semibold border-round px-3 py-1 text-sm capitalize">
                            {subjectId}
                        </span>
                        {currentQuestion.category && (
                            <span className="bg-teal-50 text-teal-600 font-semibold border-round px-3 py-1 text-sm">
                                {currentQuestion.category}
                            </span>
                        )}
                    </div>
                    
                    <h2 className="text-xl font-medium mb-4 line-height-3 text-900 mt-0">
                        {currentQuestion.question}
                    </h2>

                    <div className="field mb-4">
                        <label htmlFor="answer" className="block mb-2 font-bold text-700">Your Answer</label>
                        <InputTextarea
                            id="answer"
                            value={currentAnswer}
                            onChange={(e) => setCurrentAnswer(e.target.value)}
                            rows={12}
                            className="w-full line-height-3 text-lg"
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
                            className="font-bold"
                            onClick={toggleHint}
                        />
                        <Button
                            label={currentIndex === questions.length - 1 ? "Finish Exam" : "Next Question"}
                            icon="pi pi-arrow-right"
                            iconPos="right"
                            onClick={handleNext}
                            disabled={!currentAnswer.trim()}
                            className="px-4 py-2 font-bold"
                        />
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

    if (!subjectId) {
        return <div>Invalid Subject</div>
    }

    // The key prop forces React to remount the component when subjectId or count changes,
    // which resets all internal state (currentIndex, answers, etc.) automatically.
    return (
        <ExamSession 
            key={`${subjectId}-${count}`}
            subjectId={subjectId} 
            count={count} 
        />
    )
}
