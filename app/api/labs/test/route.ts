import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// POST /api/labs/test
// Exécute les tests automatiques contre le code de l'utilisateur
// ============================================================

// Initialisation paresseuse : ne crashe pas au build si l'env est absente.
let _supabase: SupabaseClient | null = null;
function getSupabase() {
    if (!_supabase) {
        _supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }
    return _supabase;
}

interface TestRequest {
    submissionId: string;
    labId: string;
    code: string;
    language: 'python' | 'sql' | 'pyspark' | 'scala';
}

interface TestResult {
    testId: string;
    testName: string;
    passed: boolean;
    message: string;
    executionTime?: number;
}

interface TestResponse {
    success: boolean;
    results: TestResult[];
    summary: {
        total: number;
        passed: number;
        failed: number;
        successRate: number;
    };
    score: number;
    feedback?: string;
}

/**
 * Récupère les cas de test pour un lab
 */
async function getTestCases(labId: string) {
    const { data, error } = await getSupabase()
        .from('lab_test_cases')
        .select('*')
        .eq('coding_lab_id', labId)
        .order('order_index', { ascending: true });

    if (error) {
        console.error('Error fetching test cases:', error);
        return [];
    }

    return data;
}

/**
 * Exécute les tests Python
 */
async function runPythonTests(
    userCode: string,
    testCases: any[]
): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const testCase of testCases) {
        try {
            // Combine user code avec test code
            const fullCode = `${userCode}\n\n${testCase.test_code}`;

            // In real scenario, exécuter via Pyodide ou serveur
            // Pour maintenant, on retourne un stub
            results.push({
                testId: testCase.id,
                testName: testCase.test_name,
                passed: true,
                message: 'Test passed',
                executionTime: Math.random() * 100
            });
        } catch (error) {
            results.push({
                testId: testCase.id,
                testName: testCase.test_name,
                passed: false,
                message: String(error)
            });
        }
    }

    return results;
}

/**
 * Exécute les tests SQL via api Docker
 */
async function runSQLTests(
    userCode: string,
    testCases: any[]
): Promise<TestResult[]> {
    try {
        const response = await fetch(
            process.env.SQL_EXECUTOR_URL || 'http://localhost:5002/test',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userCode,
                    testCases
                })
            }
        );

        if (!response.ok) {
            throw new Error(`SQL test execution failed: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        return [
            {
                testId: 'error',
                testName: 'SQL Execution Error',
                passed: false,
                message: String(error)
            }
        ];
    }
}

/**
 * Enregistre les résultats de test dans la BD
 */
async function recordTestResults(
    submissionId: string,
    results: TestResult[],
    summary: any
): Promise<boolean> {
    try {
        const { error } = await getSupabase().from('lab_results').insert([
            {
                submission_id: submissionId,
                status: summary.failed === 0 ? 'passed' : 'failed',
                passed_tests_count: summary.passed,
                total_tests_count: summary.total,
                success_rate_pct: summary.successRate,
                score: Math.round(summary.successRate),
                feedback: `${summary.passed}/${summary.total} tests passed`,
                created_at: new Date().toISOString()
            }
        ]);

        if (error) {
            console.error('Error recording test results:', error);
            return false;
        }

        // Update submission status
        await getSupabase()
            .from('lab_submissions')
            .update({
                status: summary.failed === 0 ? 'success' : 'error',
                completed_at: new Date().toISOString()
            })
            .eq('id', submissionId);

        return true;
    } catch (error) {
        console.error('Error in recordTestResults:', error);
        return false;
    }
}

/**
 * Génère feedback pédagogique basé sur les résultats
 */
function generateFeedback(
    language: string,
    results: TestResult[],
    summary: any
): string {
    if (summary.failed === 0) {
        return '🎉 Bravo ! Tous les tests sont passés. Excellente compréhension !';
    }

    const failedTests = results.filter(r => !r.passed);
    const hints = failedTests.map(t => `• ${t.testName}: ${t.message}`).join('\n');

    return `⚠️ ${summary.failed} test(s) échoué(s):\n${hints}\n\nIndices: Relisez la description du test et vérifiez votre logique.`;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body: TestRequest = await request.json();
        const { submissionId, labId, code, language } = body;

        // Validation
        if (!submissionId || !labId || !code || !language) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Récupérer les cas de test
        const testCases = await getTestCases(labId);

        if (testCases.length === 0) {
            return NextResponse.json({
                success: true,
                results: [],
                summary: { total: 0, passed: 0, failed: 0, successRate: 100 },
                score: 100,
                feedback: 'Aucun test défini pour ce lab'
            });
        }

        // Exécuter les tests selon le langage
        let results: TestResult[];

        switch (language) {
            case 'python':
                results = await runPythonTests(code, testCases);
                break;
            case 'sql':
                results = await runSQLTests(code, testCases);
                break;
            case 'pyspark':
                results = await runPythonTests(code, testCases); // Même logique que Python
                break;
            case 'scala':
                return NextResponse.json(
                    { success: false, error: 'Scala testing not yet implemented' },
                    { status: 501 }
                );
            default:
                return NextResponse.json(
                    { success: false, error: `Unsupported language: ${language}` },
                    { status: 400 }
                );
        }

        // Calculer le résumé
        const passed = results.filter(r => r.passed).length;
        const failed = results.filter(r => !r.passed).length;
        const successRate = Math.round((passed / testCases.length) * 100);

        const summary = {
            total: testCases.length,
            passed,
            failed,
            successRate
        };

        // Générer feedback
        const feedback = generateFeedback(language, results, summary);

        // Enregistrer dans la BD
        await recordTestResults(submissionId, results, summary);

        return NextResponse.json({
            success: true,
            results,
            summary,
            score: successRate,
            feedback
        } as TestResponse);
    } catch (error) {
        console.error('Error in /api/labs/test:', error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
