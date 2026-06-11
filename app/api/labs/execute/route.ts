import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// POST /api/labs/execute
// Exécute du code (Python, SQL, PySpark, Scala)
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

interface ExecuteRequest {
    labId: string;
    code: string;
    language: 'python' | 'sql' | 'pyspark' | 'scala' | 'javascript' | 'bash';
    userId?: string;
}

interface ExecuteResponse {
    success: boolean;
    output?: string;
    error?: string;
    executionTime?: number;
    submissionId?: string;
}

/**
 * Exécute Python localement via Pyodide (côté client)
 * Cette fonction retourne une réponse indiquant au client d'exécuter Pyodide
 */
async function executePython(code: string): Promise<ExecuteResponse> {
    // Python est exécuté côté client avec Pyodide
    // Cette API route retourne juste un signal
    return {
        success: true,
        output: 'Python will be executed in browser with Pyodide'
    };
}

/**
 * Exécute SQL via sql.js (côté client)
 */
async function executeSQL(code: string): Promise<ExecuteResponse> {
    // SQL est exécuté côté client avec sql.js
    return {
        success: true,
        output: 'SQL will be executed in browser with sql.js'
    };
}

/**
 * Exécute PySpark via API Docker
 */
async function executePySpark(code: string): Promise<ExecuteResponse> {
    try {
        const response = await fetch(process.env.SPARK_EXECUTOR_URL || 'http://localhost:5000/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, language: 'pyspark' })
        });

        if (!response.ok) {
            return {
                success: false,
                error: `Spark execution failed: ${response.statusText}`
            };
        }

        const result = await response.json();
        return {
            success: true,
            output: result.output,
            executionTime: result.executionTime
        };
    } catch (error) {
        return {
            success: false,
            error: `Failed to connect to Spark executor: ${String(error)}`
        };
    }
}

/**
 * Exécute Scala via API Docker
 */
async function executeScala(code: string): Promise<ExecuteResponse> {
    try {
        const response = await fetch(process.env.SCALA_EXECUTOR_URL || 'http://localhost:5001/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, language: 'scala' })
        });

        if (!response.ok) {
            return {
                success: false,
                error: `Scala execution failed: ${response.statusText}`
            };
        }

        const result = await response.json();
        return {
            success: true,
            output: result.output,
            executionTime: result.executionTime
        };
    } catch (error) {
        return {
            success: false,
            error: `Failed to connect to Scala executor: ${String(error)}`
        };
    }
}

/**
 * Enregistre une soumission dans la BD
 */
async function recordSubmission(
    labId: string,
    userId: string,
    code: string,
    language: string,
    status: 'pending' | 'running' | 'success' | 'error'
): Promise<string | null> {
    try {
        const { data, error } = await getSupabase()
            .from('lab_submissions')
            .insert([
                {
                    coding_lab_id: labId,
                    user_id: userId,
                    code,
                    language,
                    status,
                    started_at: new Date().toISOString()
                }
            ])
            .select('id')
            .single();

        if (error) {
            console.error('Error recording submission:', error);
            return null;
        }

        return data?.id;
    } catch (error) {
        console.error('Error in recordSubmission:', error);
        return null;
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body: ExecuteRequest = await request.json();
        const { labId, code, language, userId } = body;

        // Validation
        if (!code || !language) {
            return NextResponse.json(
                { success: false, error: 'Missing code or language' },
                { status: 400 }
            );
        }

        // Record submission if userId provided
        let submissionId: string | null = null;
        if (userId && labId) {
            submissionId = await recordSubmission(labId, userId, code, language, 'running');
        }

        // Execute based on language
        let result: ExecuteResponse;
        const startTime = Date.now();

        switch (language) {
            case 'python':
                result = await executePython(code);
                break;
            case 'sql':
                result = await executeSQL(code);
                break;
            case 'pyspark':
                result = await executePySpark(code);
                break;
            case 'scala':
                result = await executeScala(code);
                break;
            default:
                return NextResponse.json(
                    { success: false, error: `Unsupported language: ${language}` },
                    { status: 400 }
                );
        }

        const executionTime = Date.now() - startTime;

        return NextResponse.json({
            ...result,
            submissionId,
            executionTime
        });
    } catch (error) {
        console.error('Error in /api/labs/execute:', error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
