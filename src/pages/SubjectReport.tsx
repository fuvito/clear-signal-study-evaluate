import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card } from 'primereact/card'
import { Chart } from 'primereact/chart'
import { Button } from 'primereact/button'
import { format } from 'date-fns'
import { questionService } from '../services/questionService'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface ExamRecord {
    id: string;
    subjectId: string;
    timestamp: string;
    totalQuestions: number;
    overallScore?: number; // 0-100
    answers: { evaluation?: { score: number } }[];
}

export default function SubjectReport() {
    const { subjectId } = useParams()
    const [chartData, setChartData] = useState({})
    const [chartOptions, setChartOptions] = useState({})
    const [subjectName, setSubjectName] = useState('')
    const [averageScore, setAverageScore] = useState(0)
    const [totalAttempts, setTotalAttempts] = useState(0)

    useEffect(() => {
        if (!subjectId) return;

        // Get Subject Name
        const subject = questionService.getSubject(subjectId);
        setSubjectName(subject ? subject.subject : subjectId);

        // Get History
        const history: ExamRecord[] = JSON.parse(localStorage.getItem('exam_history') || '[]');
        
        // Filter for this subject and sort by date (oldest to newest)
        const subjectHistory = history
            .filter(h => h.subjectId === subjectId && h.overallScore !== undefined)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // Calculate Stats
        let totalCorrectPoints = 0;
        let totalMaxPoints = 0;
        
        // We calculate a "True Average" by summing all actual scores across all questions
        // vs just averaging the exam scores (which would weigh a 1-question exam same as 10-question exam)
        subjectHistory.forEach(exam => {
             // If individual answer scores exist, use them for more precision, 
             // otherwise fall back to exam.overallScore * exam.totalQuestions
             if (exam.answers && exam.answers.length > 0) {
                 exam.answers.forEach(ans => {
                     totalCorrectPoints += (ans.evaluation?.score || 0);
                     totalMaxPoints += 100;
                 });
             } else {
                 // Legacy fallback
                 totalCorrectPoints += (exam.overallScore || 0) * exam.totalQuestions;
                 totalMaxPoints += exam.totalQuestions * 100;
             }
        });

        setTotalAttempts(subjectHistory.length);
        setAverageScore(totalMaxPoints > 0 ? (totalCorrectPoints / totalMaxPoints) * 100 : 0);

        // Prepare Chart Data
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

        const data = {
            labels: subjectHistory.map(h => format(new Date(h.timestamp), 'MMM d HH:mm')),
            datasets: [
                {
                    label: 'Score (%)',
                    data: subjectHistory.map(h => h.overallScore),
                    fill: true,
                    borderColor: '#6366f1', // Indigo-500
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    tension: 0.4,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        };

        const options = {
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context: any) {
                            const index = context.dataIndex;
                            const exam = subjectHistory[index];
                            return `Questions: ${exam.totalQuestions}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder
                    }
                },
                y: {
                    min: 0,
                    max: 100,
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder
                    },
                    title: {
                        display: true,
                        text: 'Score % (Normalized)',
                        color: textColorSecondary
                    }
                }
            }
        };

        setChartData(data);
        setChartOptions(options);
    }, [subjectId]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-orange-500';
        return 'text-red-500';
    }

    if (!subjectId) return <div>Invalid Subject</div>;

    return (
        <div className="flex justify-content-center pb-8">
            <div className="w-full md:w-10 lg:w-8">
                <div className="flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="text-3xl font-bold m-0 text-700">{subjectName} Progress</h1>
                        <p className="text-500 m-0">Performance analytics over time</p>
                    </div>
                    <Link to="/report-card">
                        <Button label="Back to Report Card" icon="pi pi-arrow-left" text className="font-bold text-purple-600 hover:bg-purple-50"/>
                    </Link>
                </div>

                <div className="grid mb-4">
                    <div className="col-12 md:col-6">
                        <Card className="shadow-2 border-round-xl h-full bg-blue-50 border-none">
                            <div className="flex flex-column align-items-center justify-content-center text-center">
                                <span className="text-blue-600 font-medium mb-2 uppercase text-xs tracking-wider">Cumulative Average</span>
                                <span className={`text-5xl font-bold ${getScoreColor(averageScore)}`}>
                                    {averageScore.toFixed(1)}%
                                </span>
                                <span className="text-blue-500 text-sm mt-2">Weighted by number of questions</span>
                            </div>
                        </Card>
                    </div>
                    <div className="col-12 md:col-6">
                        <Card className="shadow-2 border-round-xl h-full bg-teal-50 border-none">
                             <div className="flex flex-column align-items-center justify-content-center text-center">
                                <span className="text-teal-600 font-medium mb-2 uppercase text-xs tracking-wider">Total Exams Taken</span>
                                <span className="text-5xl font-bold text-teal-700">
                                    {totalAttempts}
                                </span>
                                <span className="text-teal-500 text-sm mt-2">Sessions completed</span>
                            </div>
                        </Card>
                    </div>
                </div>

                <Card className="shadow-2 border-round-xl border-none">
                    <h2 className="text-xl font-bold text-700 mb-4">Performance Trend</h2>
                    {totalAttempts > 0 ? (
                        <div className="relative w-full" style={{ height: '400px' }}>
                            <Chart type="line" data={chartData} options={chartOptions} />
                        </div>
                    ) : (
                        <div className="text-center py-6 text-500">
                            No data available yet. Take an exam to see your trends!
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
}
