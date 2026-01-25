import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Card } from 'primereact/card'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { ProgressBar } from 'primereact/progressbar'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { Toast } from 'primereact/toast'
import { questionService } from '../services/questionService'

interface SubjectStats {
    code: string;
    name: string;
    totalQuestionsInBank: number;
    questionsAnsweredUnique: number;
    totalAttempts: number;
    coverage: number;
}

interface ExamHistoryItem {
    id: string; // Ensure ID is present for deduplication
    subjectId: string;
    answers: { questionId: number }[];
    timestamp: string;
    // ... other fields
}

export default function ReportCard() {
    const [stats, setStats] = useState<SubjectStats[]>([])
    const [importDialogVisible, setImportDialogVisible] = useState(false)
    const [currentImportSubject, setCurrentImportSubject] = useState<string | null>(null)
    const [importedData, setImportedData] = useState<ExamHistoryItem[]>([])
    
    const toast = useRef<Toast>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const refreshStats = () => {
        // 1. Get all subjects
        const subjects = questionService.getSubjects();

        // 2. Get history
        const history: ExamHistoryItem[] = JSON.parse(localStorage.getItem('exam_history') || '[]');

        // 3. Aggregate
        // Map<SubjectCode, { uniqueIds: Set<number>, attempts: number }>
        const statsMap = new Map<string, { uniqueIds: Set<number>, attempts: number }>();

        // Initialize map
        subjects.forEach(sub => {
            statsMap.set(sub.code, { uniqueIds: new Set(), attempts: 0 });
        });

        // Process history
        history.forEach(exam => {
            const subStats = statsMap.get(exam.subjectId);
            // If we have stats for this subject (e.g. it hasn't been removed from the system)
            if (subStats) {
                if (exam.answers && Array.isArray(exam.answers)) {
                    exam.answers.forEach(ans => {
                        subStats.uniqueIds.add(ans.questionId);
                        subStats.attempts++;
                    });
                }
            }
        });

        // Format for display
        const finalStats: SubjectStats[] = subjects.map(sub => {
            const data = statsMap.get(sub.code) || { uniqueIds: new Set(), attempts: 0 };
            const uniqueCount = data.uniqueIds.size;
            
            return {
                code: sub.code,
                name: sub.name,
                totalQuestionsInBank: sub.totalQuestions,
                questionsAnsweredUnique: uniqueCount,
                totalAttempts: data.attempts,
                coverage: sub.totalQuestions > 0 ? (uniqueCount / sub.totalQuestions) * 100 : 0
            };
        });

        setStats(finalStats);
    }

    useEffect(() => {
        refreshStats();
    }, [])

    const handleExport = (subjectCode: string) => {
        try {
            const history: ExamHistoryItem[] = JSON.parse(localStorage.getItem('exam_history') || '[]');
            const subjectHistory = history.filter(h => h.subjectId === subjectCode);

            if (subjectHistory.length === 0) {
                toast.current?.show({ severity: 'warn', summary: 'No Data', detail: 'No history found for this subject to export.', life: 3000 });
                return;
            }

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(subjectHistory, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `exam_history_${subjectCode}_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(downloadAnchorNode); // required for firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            
            toast.current?.show({ severity: 'success', summary: 'Export Successful', detail: `Exported ${subjectHistory.length} records.`, life: 3000 });
        } catch (error) {
            console.error("Export failed", error);
            toast.current?.show({ severity: 'error', summary: 'Export Failed', detail: 'An error occurred during export.', life: 3000 });
        }
    }

    const triggerImport = (subjectCode: string) => {
        setCurrentImportSubject(subjectCode);
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset
            fileInputRef.current.click();
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                
                if (!Array.isArray(json)) {
                    throw new Error("Invalid format: Root must be an array");
                }

                // Basic validation
                const validRecords = json.filter((item: any) => 
                    item.id && item.subjectId && Array.isArray(item.answers)
                );

                if (validRecords.length === 0) {
                    throw new Error("No valid exam records found in file");
                }

                // Subject mismatch warning check
                const mismatches = validRecords.filter((item: any) => item.subjectId !== currentImportSubject);
                if (mismatches.length > 0) {
                    // We could block it, or just warn. For now, let's filter strict or allow? 
                    // Requirement: "export subject based". Import probably expects same subject.
                    // Let's filter to only keep records for the selected subject to be safe/clean.
                }

                const relevantRecords = validRecords.filter((item: any) => item.subjectId === currentImportSubject);

                if (relevantRecords.length === 0) {
                    toast.current?.show({ severity: 'error', summary: 'Invalid Subject', detail: `No records found for subject: ${currentImportSubject}`, life: 4000 });
                    return;
                }

                setImportedData(relevantRecords);
                setImportDialogVisible(true);

            } catch (err) {
                console.error(err);
                toast.current?.show({ severity: 'error', summary: 'Import Failed', detail: 'Invalid JSON file.', life: 3000 });
            }
        };
        reader.readAsText(file);
    }

    const confirmImport = (mode: 'override' | 'add') => {
        try {
            const currentHistory: ExamHistoryItem[] = JSON.parse(localStorage.getItem('exam_history') || '[]');
            let newHistory = [...currentHistory];

            if (mode === 'override') {
                // Remove all records for this subject
                newHistory = newHistory.filter(h => h.subjectId !== currentImportSubject);
                // Add imported
                newHistory.push(...importedData);
            } else {
                // Add mode: Append but avoid duplicates by ID
                const existingIds = new Set(newHistory.map(h => h.id));
                const toAdd = importedData.filter(h => !existingIds.has(h.id));
                newHistory.push(...toAdd);
                
                if (toAdd.length === 0) {
                     toast.current?.show({ severity: 'info', summary: 'No New Data', detail: 'All records already exist.', life: 3000 });
                     setImportDialogVisible(false);
                     return;
                }
            }

            localStorage.setItem('exam_history', JSON.stringify(newHistory));
            refreshStats();
            setImportDialogVisible(false);
            toast.current?.show({ severity: 'success', summary: 'Import Complete', detail: `Successfully imported ${importedData.length} records (${mode}).`, life: 3000 });

        } catch (err) {
            console.error(err);
            toast.current?.show({ severity: 'error', summary: 'Save Failed', detail: 'Could not update history.', life: 3000 });
        }
    }

    const coverageBodyTemplate = (rowData: SubjectStats) => {
        return (
            <div className="flex align-items-center gap-2">
                <div style={{ width: '100px' }}>
                    <ProgressBar value={rowData.coverage} showValue={false} style={{ height: '8px' }} color={rowData.coverage === 100 ? '#22c55e' : '#6366f1'}></ProgressBar>
                </div>
                <span className="text-sm text-600">{Math.round(rowData.coverage)}%</span>
            </div>
        );
    }

    const actionBodyTemplate = (rowData: SubjectStats) => {
        return (
            <div className="flex gap-2">
                <Button 
                    icon="pi pi-download" 
                    rounded 
                    text 
                    severity="help" 
                    tooltip="Export History"
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => handleExport(rowData.code)} 
                />
                 <Button 
                    icon="pi pi-upload" 
                    rounded 
                    text 
                    severity="warning" 
                    tooltip="Import History"
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => triggerImport(rowData.code)} 
                />
                <Link to={`/report-card/${rowData.code}`}>
                    <Button icon="pi pi-chart-line" rounded text severity="secondary" tooltip="View Analytics" tooltipOptions={{ position: 'top' }} />
                </Link>
            </div>
        );
    }

    const nameBodyTemplate = (rowData: SubjectStats) => {
        return (
            <Link to={`/report-card/${rowData.code}`} className="text-900 no-underline hover:text-primary transition-colors">
                {rowData.name}
            </Link>
        );
    }

    return (
        <div className="flex justify-content-center">
            <Toast ref={toast} />
            {/* Hidden file input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".json" 
                onChange={handleFileChange}
            />

            <div className="w-full md:w-10 lg:w-8">
                <div className="mb-4">
                    <h1 className="text-3xl font-bold m-0 text-700">Report Card</h1>
                    <p className="text-500 m-0">Detailed breakdown of your practice coverage.</p>
                </div>

                <Card className="shadow-2 border-round-xl">
                    <DataTable value={stats} stripedRows tableStyle={{ minWidth: '50rem' }} rowClassName={() => 'text-700'}>
                        <Column field="name" header="Subject" body={nameBodyTemplate} sortable className="font-bold text-700"></Column>
                        <Column field="totalQuestionsInBank" header="Total Questions" sortable className="text-center text-600"></Column>
                        <Column field="questionsAnsweredUnique" header="Answered (Unique)" sortable className="text-center font-semibold text-purple-600"></Column>
                        <Column field="totalAttempts" header="Total Attempts" sortable className="text-center text-600"></Column>
                        <Column field="coverage" header="Coverage" body={coverageBodyTemplate} sortable></Column>
                        <Column body={actionBodyTemplate} style={{ minWidth: '10rem' }}></Column>
                    </DataTable>
                </Card>
            </div>

            <Dialog 
                header="Import Options" 
                visible={importDialogVisible} 
                style={{ width: '30vw' }} 
                onHide={() => setImportDialogVisible(false)}
                footer={
                    <div>
                        <Button label="Cancel" icon="pi pi-times" onClick={() => setImportDialogVisible(false)} className="p-button-text" />
                    </div>
                }
            >
                <div className="flex flex-column gap-3">
                    <p className="m-0">
                        Found <strong>{importedData.length}</strong> records for <strong>{currentImportSubject}</strong>.
                        How would you like to import them?
                    </p>
                    <div className="flex gap-2 justify-content-center mt-2">
                        <Button 
                            label="Add (Merge)" 
                            icon="pi pi-plus" 
                            severity="success" 
                            onClick={() => confirmImport('add')} 
                            tooltip="Keep existing records, add new ones"
                        />
                        <Button 
                            label="Override" 
                            icon="pi pi-refresh" 
                            severity="danger" 
                            onClick={() => confirmImport('override')} 
                            tooltip="Delete current history for this subject and replace"
                        />
                    </div>
                </div>
            </Dialog>
        </div>
    )
}
