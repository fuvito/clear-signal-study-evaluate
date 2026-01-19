
import { useState } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import { useNavigate } from 'react-router-dom'

// Mock Data Service (Replace with actual service later)
import reactQuestions from '../data/questions/react_exam_100_questions.json'
import javaQuestions from '../data/questions/java_exam_v1_200_questions.json'
import tsQuestions from '../data/questions/typescript_exam_v1.json'
import jsQuestions from '../data/questions/javascript_exam_100_questions.json'

interface SubjectOption {
    name: string;
    code: string;
    totalQuestions: number;
}

export default function Dashboard() {
    const navigate = useNavigate()
    const [selectedSubject, setSelectedSubject] = useState<SubjectOption | null>(null)
    const [questionCount, setQuestionCount] = useState<number>(10)

    // In a real app, we'd load these dynamically. For now, we map the JSONs we have.
    const subjects: SubjectOption[] = [
        { name: 'React', code: 'react', totalQuestions: reactQuestions.totalQuestions },
        { name: 'Java', code: 'java', totalQuestions: javaQuestions.totalQuestions },
        { name: 'TypeScript', code: 'typescript', totalQuestions: tsQuestions.totalQuestions },
        { name: 'JavaScript', code: 'javascript', totalQuestions: jsQuestions.totalQuestions },
    ]

    const handleStartExam = () => {
        if (selectedSubject) {
            navigate(`/exam/${selectedSubject.code}?count=${questionCount}`)
        }
    }

    return (
        <div className="flex flex-column gap-4">
            <div>
                <h1 className="text-3xl font-bold text-900 mb-2">Dashboard</h1>
                <p className="text-600 m-0">Welcome back! Ready to practice?</p>
            </div>

            <div className="grid">
                <div className="col-12 lg:col-6">
                    <Card className="shadow-2 border-round-xl h-full">
                        <div className="flex align-items-center mb-4">
                            <span className="flex align-items-center justify-content-center bg-indigo-100 text-indigo-500 border-round-lg mr-3" style={{ width: '3rem', height: '3rem' }}>
                                <i className="pi pi-play text-xl"></i>
                            </span>
                            <div>
                                <h2 className="text-xl font-bold m-0 text-900">Start New Exam</h2>
                                <span className="text-600 text-sm">Select a subject to begin</span>
                            </div>
                        </div>

                        <div className="flex flex-column gap-4">
                            <div className="flex flex-column gap-2">
                                <label htmlFor="subject" className="font-medium text-900">Subject</label>
                                <Dropdown
                                    id="subject"
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.value)}
                                    options={subjects}
                                    optionLabel="name"
                                    placeholder="Choose a Subject"
                                    className="w-full"
                                    pt={{
                                        root: { className: 'border-round-lg' }
                                    }}
                                />
                            </div>

                            {selectedSubject && (
                                <div className="flex flex-column gap-2">
                                    <label htmlFor="count" className="font-medium text-900">Questions</label>
                                    <InputNumber
                                        id="count"
                                        value={questionCount}
                                        onValueChange={(e) => setQuestionCount(e.value ?? 10)}
                                        min={1}
                                        max={selectedSubject.totalQuestions}
                                        showButtons
                                        buttonLayout="horizontal"
                                        incrementButtonIcon="pi pi-plus"
                                        decrementButtonIcon="pi pi-minus"
                                        className="w-full"
                                        inputClassName="text-center"
                                    />
                                    <small className="text-600">Max: {selectedSubject.totalQuestions}</small>
                                </div>
                            )}

                            <Button
                                label="Start Exam"
                                icon="pi pi-arrow-right"
                                iconPos="right"
                                disabled={!selectedSubject}
                                onClick={handleStartExam}
                                className="w-full mt-2 font-bold"
                            />
                        </div>
                    </Card>
                </div>

                <div className="col-12 lg:col-6">
                    <Card className="shadow-2 border-round-xl h-full bg-indigo-50 border-none">
                        <div className="flex flex-column h-full justify-content-center align-items-center text-center p-4">
                             <span className="flex align-items-center justify-content-center bg-white text-indigo-500 border-circle mb-4 shadow-1" style={{ width: '4rem', height: '4rem' }}>
                                <i className="pi pi-chart-line text-2xl"></i>
                            </span>
                            <h2 className="text-2xl font-bold text-900 mb-2">Your Progress</h2>
                            <p className="text-600 line-height-3 mb-4 max-w-20rem">
                                Track your performance and identify areas for improvement across different subjects.
                            </p>
                            <Button label="View History" outlined className="font-bold" onClick={() => navigate('/history')} />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
