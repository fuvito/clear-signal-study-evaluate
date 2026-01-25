
import { useState } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import { useNavigate } from 'react-router-dom'
import { questionService } from '../services/questionService'

interface SubjectOption {
    name: string;
    code: string;
    totalQuestions: number;
}

export default function Dashboard() {
    const navigate = useNavigate()
    const [selectedSubject, setSelectedSubject] = useState<SubjectOption | null>(null)
    const [questionCount, setQuestionCount] = useState<number>(10)
    const [strategy, setStrategy] = useState<string>('random')

    const subjects: SubjectOption[] = questionService.getSubjects();

    const strategyOptions = [
        { label: 'Random Mix', value: 'random' },
        { label: 'Not Answered Yet', value: 'not_answered' },
        { label: 'Least Answered', value: 'least_answered' }
    ];

    const handleStartExam = () => {
        if (selectedSubject) {
            navigate(`/exam/${selectedSubject.code}?count=${questionCount}&strategy=${strategy}`)
        }
    }

    return (
        <div className="surface-card border-round-xl p-4 md:p-5 shadow-1">
            <div className="flex flex-column gap-4">
            <div>
                <h1 className="text-3xl font-bold text-900 mb-2">Dashboard</h1>
                <p className="text-600 m-0">Welcome back! Ready to practice?</p>
            </div>

            <div className="grid">
                <div className="col-12 lg:col-4">
                    <Card className="shadow-2 border-round-xl h-full border-none surface-card">
                        <div className="flex align-items-center mb-4">
                            <span className="flex align-items-center justify-content-center icon-badge text-purple-600 border-circle mr-3" style={{ width: '3.5rem', height: '3.5rem' }}>
                                <i className="pi pi-play text-xl"></i>
                            </span>
                            <div>
                                <h2 className="text-xl font-bold m-0 text-700">Start New Exam</h2>
                                <span className="text-500 text-sm">Select a subject to begin</span>
                            </div>
                        </div>

                        <div className="flex flex-column gap-4">
                            <div className="flex flex-column gap-2">
                                <label htmlFor="subject" className="font-medium text-700">Subject</label>
                                <Dropdown
                                    id="subject"
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.value)}
                                    options={subjects}
                                    optionLabel="name"
                                    placeholder="Choose a Subject"
                                    className="w-full"
                                    pt={{
                                        root: { className: 'border-round-xl border-1 border-200 bg-white' },
                                        input: { className: 'text-700' }
                                    }}
                                />
                            </div>

                            <div className="flex flex-column gap-2">
                                <label htmlFor="strategy" className="font-medium text-700">Smart Question Selection</label>
                                <Dropdown
                                    id="strategy"
                                    value={strategy}
                                    onChange={(e) => setStrategy(e.value)}
                                    options={strategyOptions}
                                    className="w-full"
                                    pt={{
                                        root: { className: 'border-round-xl border-1 border-200 bg-white' },
                                        input: { className: 'text-700' }
                                    }}
                                />
                            </div>

                            {selectedSubject && (
                                <div className="flex flex-column gap-2">
                                    <label htmlFor="count" className="font-medium text-700">Questions</label>
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
                                        inputClassName="text-center bg-white border-1 border-200 text-700"
                                    />
                                    <small className="text-500">Max: {selectedSubject.totalQuestions}</small>
                                </div>
                            )}

                            <Button
                                label="Start Exam"
                                icon="pi pi-arrow-right"
                                iconPos="right"
                                disabled={!selectedSubject}
                                onClick={handleStartExam}
                                severity="help"
                                className="w-full mt-2 font-bold"
                                style={{ background: 'var(--primary-color)', borderColor: 'var(--primary-color)', color: 'var(--primary-color-text)' }}
                            />
                        </div>
                    </Card>
                </div>

                <div className="col-12 lg:col-4">
                    <Card className="shadow-2 border-round-xl h-full surface-card">
                        <div className="flex flex-column h-full justify-content-center align-items-center text-center p-4">
                             <span className="flex align-items-center justify-content-center icon-badge text-blue-600 border-circle mb-4" style={{ width: '4.5rem', height: '4.5rem' }}>
                                <i className="pi pi-history text-3xl"></i>
                            </span>
                            <h2 className="text-2xl font-bold text-700 mb-2">History</h2>
                            <p className="text-600 line-height-3 mb-4">
                                View your past exam attempts and check your scores.
                            </p>
                            <Button label="View History" outlined className="font-bold btn-outline-blue" onClick={() => navigate('/history')} />
                        </div>
                    </Card>
                </div>

                <div className="col-12 lg:col-4">
                    <Card className="shadow-2 border-round-xl h-full surface-card">
                        <div className="flex flex-column h-full justify-content-center align-items-center text-center p-4">
                             <span className="flex align-items-center justify-content-center icon-badge text-teal-600 border-circle mb-4" style={{ width: '4.5rem', height: '4.5rem' }}>
                                <i className="pi pi-chart-bar text-3xl"></i>
                            </span>
                            <h2 className="text-2xl font-bold text-700 mb-2">Report Card</h2>
                            <p className="text-600 line-height-3 mb-4">
                                Analyze your coverage and performance stats per subject.
                            </p>
                            <Button label="View Report Card" outlined className="font-bold btn-outline-teal" onClick={() => navigate('/report-card')} />
                        </div>
                    </Card>
                </div>
            </div>
            </div>
        </div>
    )
}
