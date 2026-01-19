
import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { ProgressBar } from 'primereact/progressbar'
import { Accordion, AccordionTab } from 'primereact/accordion'
import { Tag } from 'primereact/tag'
import { Message } from 'primereact/message'
import { Toast } from 'primereact/toast'
import { evaluateAnswer, type EvaluationResult, type RubricDimensions } from '../services/aiService'

interface AnswerRecord {
    questionId: number;
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    hintUsed: boolean;
    evaluation?: EvaluationResult;
}

interface ExamRecord {
    id: string;
    subjectId: string;
    timestamp: string;
    answers: AnswerRecord[];
    totalQuestions: number;
    overallScore?: number;
    status: 'pending' | 'graded';
}

export default function Results() {
    const { examId } = useParams()
    const [exam, setExam] = useState<ExamRecord | null>(null)
    const [gradingProgress, setGradingProgress] = useState(0)
    const [isGrading, setIsGrading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const toast = useRef<Toast>(null)

    const hasStartedGrading = useRef(false)

    useEffect(() => {
        const history: ExamRecord[] = JSON.parse(localStorage.getItem('exam_history') || '[]')
        const foundExam = history.find((e) => e.id === examId)

        if (foundExam) {
            setExam(foundExam)
            // If exam is not graded yet, start grading automatically
            if (!foundExam.status || foundExam.status === 'pending') {
                 if (!hasStartedGrading.current) {
                    hasStartedGrading.current = true;
                    gradeExam(foundExam);
                 }
            }
        }
    }, [examId])

    const gradeExam = async (currentExam: ExamRecord, force: boolean = false) => {
        setIsGrading(true);
        setError(null);
        const gradedAnswers = [...currentExam.answers];
        let completed = 0;

        try {
            for (let i = 0; i < gradedAnswers.length; i++) {
                const answer = gradedAnswers[i];
                if (force || !answer.evaluation) {
                    // Call AI Service
                    const result = await evaluateAnswer(
                        answer.questionText,
                        answer.userAnswer,
                        answer.correctAnswer
                    );
                    gradedAnswers[i].evaluation = result;
                }
                completed++;
                setGradingProgress(Math.round((completed / gradedAnswers.length) * 100));
            }

            // Calculate overall average
            const totalScore = gradedAnswers.reduce((acc, curr) => acc + (curr.evaluation?.score || 0), 0);
            const averageScore = totalScore / gradedAnswers.length;

            const updatedExam: ExamRecord = {
                ...currentExam,
                answers: gradedAnswers,
                overallScore: averageScore,
                status: 'graded'
            };

            // Save to local storage
            const history: ExamRecord[] = JSON.parse(localStorage.getItem('exam_history') || '[]');
            const index = history.findIndex((e) => e.id === currentExam.id);
            if (index !== -1) {
                history[index] = updatedExam;
                localStorage.setItem('exam_history', JSON.stringify(history));
            }

            setExam(updatedExam);
            toast.current?.show({ severity: 'success', summary: 'Grading Complete', detail: 'Your exam has been successfully evaluated.', life: 3000 });

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError("Error during grading: " + errorMessage);
            toast.current?.show({ severity: 'error', summary: 'Grading Failed', detail: errorMessage, life: 5000 });
        } finally {
            setIsGrading(false);
        }
    };

    if (!exam) return <div className="p-4">Exam not found.</div>

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'success';
        if (score >= 60) return 'warning';
        return 'danger';
    }

    const renderDimensions = (dims: RubricDimensions) => {
        if (!dims) return null;
        const labels: Record<string, string> = {
            conceptualKnowledge: "Conceptual",
            accuracy: "Accuracy",
            depthAndReasoning: "Reasoning",
            practicalApplication: "Practical",
            edgeCases: "Edge Cases",
            clarity: "Clarity"
        };

        return (
            <div className="grid mt-2">
                {Object.entries(dims).map(([key, val]) => (
                    <div key={key} className="col-12 md:col-4 p-2">
                        <div className="text-xs text-500 mb-1">{labels[key] || key}</div>
                        <div className="flex align-items-center gap-2">
                            <ProgressBar value={(Number(val) / 5) * 100} showValue={false} style={{ height: '6px', width: '100%' }} color={Number(val) >= 4 ? '#22c55e' : Number(val) >= 2.5 ? '#f59e0b' : '#ef4444'} />
                            <span className="text-sm font-bold">{Number(val)}/5</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex justify-content-center pb-8">
            <Toast ref={toast} />
            <div className="w-full md:w-10 lg:w-8">
                <div className="flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="text-3xl font-bold m-0 text-900">Exam Results</h1>
                        <p className="text-600 m-0">Review your performance and AI feedback</p>
                    </div>
                    <div className="flex gap-2">
                         <Button 
                            label="Re-Evaluate" 
                            icon="pi pi-refresh" 
                            severity="warning" 
                            outlined 
                            onClick={() => exam && gradeExam(exam, true)}
                            disabled={isGrading}
                        />
                        <Link to="/dashboard">
                            <Button label="Back to Dashboard" icon="pi pi-arrow-left" text className="font-bold"/>
                        </Link>
                    </div>
                </div>

                {isGrading && (
                    <Card className="mb-4 shadow-2 border-round-xl">
                        <div className="text-center py-4">
                            <i className="pi pi-spin pi-cog text-4xl text-primary mb-3"></i>
                            <h3 className="mb-2 text-900">AI is Grading your exam...</h3>
                            <div className="w-full max-w-20rem mx-auto">
                                <ProgressBar value={gradingProgress} showValue={true}></ProgressBar>
                            </div>
                            <p className="text-sm text-600 mt-3">This may take a minute depending on the number of questions.</p>
                        </div>
                    </Card>
                )}

                {!isGrading && error && (
                    <Message severity="error" text={error} className="w-full mb-4" />
                )}

                {exam.status === 'graded' && (
                    <div className="grid mb-4">
                        <div className="col-12 md:col-4">
                            <div className="surface-card shadow-2 p-4 border-round-xl text-center h-full flex flex-column justify-content-center">
                                <span className="text-600 font-medium mb-2">Subject</span>
                                <span className="text-2xl font-bold text-900 capitalize">{exam.subjectId}</span>
                            </div>
                        </div>
                        <div className="col-12 md:col-4">
                             <div className="surface-card shadow-2 p-4 border-round-xl text-center h-full flex flex-column justify-content-center relative overflow-hidden">
                                <span className="text-600 font-medium mb-2">Average Score</span>
                                <span className={`text-5xl font-bold text-${getScoreColor(exam.overallScore || 0)}`}>
                                    {exam.overallScore?.toFixed(0)}<span className="text-2xl">%</span>
                                </span>
                            </div>
                        </div>
                        <div className="col-12 md:col-4">
                             <div className="surface-card shadow-2 p-4 border-round-xl text-center h-full flex flex-column justify-content-center">
                                <span className="text-600 font-medium mb-2">Total Questions</span>
                                <span className="text-2xl font-bold text-900">{exam.totalQuestions}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-column gap-4">
                    {exam.answers.map((answer, index) => (
                        <Card key={index} className="shadow-2 border-round-xl overflow-hidden">
                            <div className="flex flex-column md:flex-row justify-content-between align-items-start mb-4 gap-3">
                                <div className="flex-1">
                                    <div className="flex align-items-center mb-2">
                                        <span className="bg-primary text-primary-reverse font-bold border-round px-2 py-1 mr-2 text-sm">Q{index + 1}</span>
                                        <span className="text-500 text-sm">Question</span>
                                    </div>
                                    <h3 className="text-xl font-medium m-0 text-900 line-height-3">
                                        {answer.questionText}
                                    </h3>
                                </div>
                                {answer.evaluation && (
                                    <div className="flex flex-column align-items-end min-w-max">
                                        <Tag
                                            value={answer.evaluation.grade}
                                            severity={getScoreColor(answer.evaluation.score)}
                                            className="text-lg px-3 py-2 mb-1"
                                            rounded
                                        />
                                        <div className="text-600 font-medium text-sm">Score: {answer.evaluation.score}/100</div>
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <div className="text-xs font-bold text-500 uppercase tracking-wide mb-2">Your Answer</div>
                                <div className="p-3 surface-50 border-round-lg text-900 line-height-3" style={{ whiteSpace: 'pre-wrap' }}>
                                    {answer.userAnswer || <span className="text-500 font-italic">(No answer provided)</span>}
                                </div>
                            </div>

                            {answer.evaluation && (
                                <Accordion activeIndex={0} className="surface-border border-top-1 pt-3">
                                    <AccordionTab header={<span className="font-semibold">Detailed Evaluation</span>}>
                                        <div className="flex flex-column gap-4 pt-2">

                                            <div>
                                                <div className="font-bold text-900 mb-2">Rubric Breakdown</div>
                                                {renderDimensions(answer.evaluation.dimensions)}
                                            </div>

                                            <div>
                                                <div className="font-bold text-900 mb-2">Feedback</div>
                                                <p className="m-0 text-700 line-height-3 surface-50 p-3 border-round">{answer.evaluation.feedback}</p>
                                            </div>

                                            <div className="grid">
                                                <div className="col-12 md:col-6">
                                                    <div className="font-bold text-green-700 mb-2 flex align-items-center">
                                                        <i className="pi pi-thumbs-up mr-2"></i> Strengths
                                                    </div>
                                                    <ul className="m-0 pl-3 text-sm line-height-3 text-700">
                                                        {answer.evaluation.strengths.map((s, i) => (
                                                            <li key={i} className="mb-1">{s}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div className="col-12 md:col-6">
                                                    <div className="font-bold text-orange-700 mb-2 flex align-items-center">
                                                        <i className="pi pi-bolt mr-2"></i> Improvements
                                                    </div>
                                                    <ul className="m-0 pl-3 text-sm line-height-3 text-700">
                                                        {answer.evaluation.improvements.map((s, i) => (
                                                            <li key={i} className="mb-1">{s}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>

                                            {answer.hintUsed && (
                                                 <div className="flex align-items-center p-3 border-round bg-yellow-50 text-yellow-700 text-sm">
                                                    <i className="pi pi-info-circle mr-2 text-xl"></i>
                                                    <span>Hint was used for this question.</span>
                                                 </div>
                                            )}
                                        </div>
                                    </AccordionTab>
                                    <AccordionTab header={<span className="font-semibold text-indigo-700">Recommended Answer (Memorize this!)</span>}>
                                        <div className="surface-50 p-3 border-round text-900 line-height-3 border-left-3 border-indigo-500">
                                            {answer.evaluation.sampleAnswer || "No sample answer generated."}
                                        </div>
                                    </AccordionTab>
                                </Accordion>
                            )}
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
