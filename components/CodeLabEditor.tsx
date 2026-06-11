'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { executeCode, runTests, getStarterCode } from '@/lib/services/labService';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface CodeLabEditorProps {
    labId: string;
    title: string;
    description: string;
    language: 'python' | 'sql' | 'pyspark' | 'scala';
    starterCode?: string;
    userId?: string;
}

interface ExecutionState {
    isLoading: boolean;
    output: string;
    error: string | null;
    executionTime: number;
}

interface TestState {
    isRunning: boolean;
    results: any[];
    summary: any | null;
    score: number;
    feedback: string;
}

const languageColors: Record<string, string> = {
    python: '#3776ab',
    sql: '#cc2927',
    pyspark: '#e25243',
    scala: '#dc322f'
};

const languageIcons: Record<string, string> = {
    python: '🐍',
    sql: '🗄️',
    pyspark: '⚡',
    scala: '🎯'
};

export default function CodeLabEditor({
    labId,
    title,
    description,
    language,
    starterCode: initialCode = '',
    userId
}: CodeLabEditorProps) {
    const [code, setCode] = useState(initialCode);
    const [executionState, setExecutionState] = useState<ExecutionState>({
        isLoading: false,
        output: '',
        error: null,
        executionTime: 0
    });

    const [testState, setTestState] = useState<TestState>({
        isRunning: false,
        results: [],
        summary: null,
        score: 0,
        feedback: ''
    });

    const [activeTab, setActiveTab] = useState<'output' | 'tests'>('output');
    const [submissionId, setSubmissionId] = useState<string | null>(null);
    const [showSolution, setShowSolution] = useState(false);

    // Charger le starter code
    useEffect(() => {
        if (!initialCode && labId) {
            getStarterCode(labId).then(code => {
                if (code) setCode(code);
            });
        }
    }, [labId, initialCode]);

    // Exécuter le code
    const handleRun = async () => {
        if (!code.trim()) {
            setExecutionState({
                isLoading: false,
                output: 'Please write some code first',
                error: 'Empty code',
                executionTime: 0
            });
            return;
        }

        setExecutionState({
            isLoading: true,
            output: 'Executing...',
            error: null,
            executionTime: 0
        });

        setActiveTab('output');

        const startTime = performance.now();
        const result = await executeCode(labId, code, language, userId);
        const executionTime = performance.now() - startTime;

        if (result.success) {
            setExecutionState({
                isLoading: false,
                output: result.output || 'No output',
                error: null,
                executionTime: Math.round(executionTime)
            });

            // Store submission ID for testing
            if (result.submissionId) {
                setSubmissionId(result.submissionId);
            }
        } else {
            setExecutionState({
                isLoading: false,
                output: '',
                error: result.error || 'Execution failed',
                executionTime: Math.round(executionTime)
            });
        }
    };

    // Exécuter les tests
    const handleRunTests = async () => {
        if (!submissionId) {
            setTestState(prev => ({
                ...prev,
                feedback: 'Please run your code first'
            }));
            return;
        }

        setTestState(prev => ({
            ...prev,
            isRunning: true,
            feedback: 'Running tests...'
        }));

        setActiveTab('tests');

        const result = await runTests(submissionId, labId, code, language);

        setTestState({
            isRunning: false,
            results: result.results || [],
            summary: result.summary,
            score: result.score || 0,
            feedback: result.feedback || 'Tests completed'
        });
    };

    // Reset code
    const handleReset = () => {
        setCode(initialCode);
        setExecutionState({
            isLoading: false,
            output: '',
            error: null,
            executionTime: 0
        });
        setTestState({
            isRunning: false,
            results: [],
            summary: null,
            score: 0,
            feedback: ''
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full"
        >
            {/* Header */}
            <Card className="mb-6">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{languageIcons[language]}</span>
                        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                        <span
                            className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: languageColors[language] }}
                        >
                            {language.toUpperCase()}
                        </span>
                    </div>
                    <p className="text-slate-600">{description}</p>
                </div>
            </Card>

            {/* Editor & Output Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Editor */}
                <Card>
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-900">Code Editor</h3>
                            <div className="flex gap-2">
                                <Button size="sm" variant="secondary" onClick={handleReset}>
                                    Reset
                                </Button>
                            </div>
                        </div>

                        <textarea
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            className="flex-1 p-4 font-mono text-sm bg-slate-900 text-slate-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Write your code here..."
                            spellCheck="false"
                            style={{
                                fontFamily: "'Courier New', monospace",
                                lineHeight: '1.5',
                                tabSize: 2
                            }}
                        />

                        <div className="p-4 border-t border-slate-200 flex gap-2 justify-end">
                            <Button variant="secondary" onClick={handleRun} disabled={executionState.isLoading}>
                                {executionState.isLoading ? 'Running...' : 'Run Code'}
                            </Button>
                            <Button onClick={handleRunTests} disabled={testState.isRunning || !submissionId}>
                                {testState.isRunning ? 'Testing...' : 'Run Tests'}
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Output */}
                <Card>
                    <div className="flex flex-col h-full">
                        {/* Tabs */}
                        <div className="p-4 border-b border-slate-200 flex gap-4">
                            <button
                                onClick={() => setActiveTab('output')}
                                className={`pb-2 px-2 text-sm font-medium transition-colors ${activeTab === 'output'
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                Output
                            </button>
                            <button
                                onClick={() => setActiveTab('tests')}
                                className={`pb-2 px-2 text-sm font-medium transition-colors ${activeTab === 'tests'
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                Tests
                                {testState.summary && (
                                    <span className="ml-2 text-xs font-bold">
                                        ({testState.summary.passed}/{testState.summary.total})
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Output Content */}
                        {activeTab === 'output' && (
                            <div className="flex-1 overflow-auto p-4 bg-slate-50">
                                {executionState.error ? (
                                    <div className="text-red-600 font-mono text-sm">
                                        <div className="text-red-700 font-bold mb-2">Error:</div>
                                        {executionState.error}
                                    </div>
                                ) : executionState.output ? (
                                    <div className="text-slate-900 font-mono text-sm whitespace-pre-wrap break-words">
                                        {executionState.output}
                                    </div>
                                ) : (
                                    <div className="text-slate-400 text-sm">Run your code to see output...</div>
                                )}

                                {executionState.executionTime > 0 && (
                                    <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-600">
                                        Executed in {executionState.executionTime}ms
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tests Content */}
                        {activeTab === 'tests' && (
                            <div className="flex-1 overflow-auto p-4 bg-slate-50">
                                {testState.results.length === 0 ? (
                                    <div className="text-slate-400 text-sm">Run tests to see results...</div>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Score */}
                                        {testState.summary && (
                                            <motion.div
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="p-3 rounded-lg bg-white border-2"
                                                style={{
                                                    borderColor: testState.score >= 80 ? '#10b981' : '#f59e0b'
                                                }}
                                            >
                                                <div className="text-center">
                                                    <div className="text-3xl font-bold" style={{ color: testState.score >= 80 ? '#10b981' : '#f59e0b' }}>
                                                        {testState.score}%
                                                    </div>
                                                    <div className="text-xs text-slate-600 mt-1">
                                                        {testState.summary.passed}/{testState.summary.total} tests passed
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Feedback */}
                                        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                                            <p className="text-sm text-blue-900">{testState.feedback}</p>
                                        </div>

                                        {/* Test Results */}
                                        {testState.results.map((result, idx) => (
                                            <motion.div
                                                key={result.testId}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className={`p-3 rounded-lg border-l-4 text-sm ${result.passed
                                                        ? 'bg-green-50 border-green-500'
                                                        : 'bg-red-50 border-red-500'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-2">
                                                    <span className="text-lg mt-0.5">
                                                        {result.passed ? '✅' : '❌'}
                                                    </span>
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-slate-900">
                                                            {result.testName}
                                                        </div>
                                                        <div className={`text-xs mt-1 ${result.passed ? 'text-green-700' : 'text-red-700'}`}>
                                                            {result.message}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Solution & Hints */}
            {testState.score >= 80 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6"
                >
                    <Button
                        variant="secondary"
                        onClick={() => setShowSolution(!showSolution)}
                    >
                        {showSolution ? 'Hide Solution' : 'View Solution'}
                    </Button>

                    {showSolution && (
                        <Card className="mt-4">
                            <div className="p-6">
                                <h3 className="font-bold text-slate-900 mb-3">Solution</h3>
                                <div className="bg-slate-900 p-4 rounded-lg text-slate-100 font-mono text-sm overflow-auto max-h-64">
                                    <pre>{initialCode}</pre>
                                </div>
                            </div>
                        </Card>
                    )}
                </motion.div>
            )}
        </motion.div>
    );
}
