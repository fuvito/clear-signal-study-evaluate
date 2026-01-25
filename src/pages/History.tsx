
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Tag } from 'primereact/tag'
import { format } from 'date-fns'

interface ExamRecord {
    id: string;
    subjectId: string;
    timestamp: string;
    totalQuestions: number;
    overallScore?: number;
    status: 'pending' | 'graded';
}

export default function History() {
    const [history] = useState<ExamRecord[]>(() => {
        try {
            const storedHistory = JSON.parse(localStorage.getItem('exam_history') || '[]')
            // Sort by timestamp descending
            return storedHistory.sort((a: ExamRecord, b: ExamRecord) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )
        } catch (e) {
            console.error('Failed to parse history:', e)
            return []
        }
    })

    const getScoreColor = (score?: number) => {
        if (score === undefined) return 'info';
        if (score >= 80) return 'success';
        if (score >= 60) return 'warning';
        return 'danger';
    }

    const scoreBodyTemplate = (rowData: ExamRecord) => {
        if (rowData.status === 'pending') {
            return <Tag value="Pending" severity="info" rounded />;
        }
        return (
            <Tag
                value={`${rowData.overallScore?.toFixed(0)}%`}
                severity={getScoreColor(rowData.overallScore)}
                rounded
            />
        );
    }

    const dateBodyTemplate = (rowData: ExamRecord) => {
        return format(new Date(rowData.timestamp), 'MMM d, yyyy HH:mm');
    }

    const subjectBodyTemplate = (rowData: ExamRecord) => {
        return <span className="capitalize font-semibold">{rowData.subjectId}</span>;
    }

    const actionBodyTemplate = (rowData: ExamRecord) => {
        return (
            <Link to={`/results/${rowData.id}`}>
                <Button label="View" icon="pi pi-eye" size="small" outlined />
            </Link>
        );
    }

    return (
        <div className="flex justify-content-center pb-8">
            <div className="w-full md:w-10 lg:w-8">
                <div className="flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="text-3xl font-bold m-0 text-700">Exam History</h1>
                        <p className="text-500 m-0">View your past attempts and progress</p>
                    </div>
                    <Link to="/dashboard">
                        <Button label="Back to Dashboard" icon="pi pi-arrow-left" text className="font-bold text-purple-600 hover:bg-purple-50"/>
                    </Link>
                </div>

                <Card className="shadow-2 border-round-xl">
                    {history.length === 0 ? (
                        <div className="text-center py-6">
                            <i className="pi pi-history text-4xl text-300 mb-3"></i>
                            <div className="text-700 font-medium text-xl mb-2">No History Yet</div>
                            <p className="text-500 mb-4">Start your first exam to see your progress here.</p>
                            <Link to="/dashboard">
                                <Button label="Start Exam" icon="pi pi-play" className="bg-purple-500 border-none hover:bg-purple-600" />
                            </Link>
                        </div>
                    ) : (
                        <DataTable value={history} stripedRows tableStyle={{ minWidth: '50rem' }} rowClassName={() => 'text-700'}>
                            <Column field="timestamp" header="Date" body={dateBodyTemplate} sortable className="text-700"></Column>
                            <Column field="subjectId" header="Subject" body={subjectBodyTemplate} sortable className="text-700"></Column>
                            <Column field="totalQuestions" header="Questions" sortable className="text-center text-700"></Column>
                            <Column field="overallScore" header="Score" body={scoreBodyTemplate} sortable className="text-center"></Column>
                            <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '8rem' }} className="text-right"></Column>
                        </DataTable>
                    )}
                </Card>
            </div>
        </div>
    )
}
