// lib/services/labService.ts
// Service pour communiquer avec les APIs des coding labs

export interface LabData {
    id: string;
    title: string;
    description: string;
    language: 'python' | 'sql' | 'pyspark' | 'scala';
    difficulty: string;
    sandbox_type: 'local' | 'docker' | 'spark';
}

export interface ExecuteResponse {
    success: boolean;
    output?: string;
    error?: string;
    executionTime?: number;
    submissionId?: string;
}

export interface TestResult {
    testId: string;
    testName: string;
    passed: boolean;
    message: string;
    executionTime?: number;
}

export interface TestResponse {
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
 * Exécute le code de l'utilisateur
 */
export async function executeCode(
    labId: string,
    code: string,
    language: 'python' | 'sql' | 'pyspark' | 'scala',
    userId?: string
): Promise<ExecuteResponse> {
    try {
        const response = await fetch('/api/labs/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                labId,
                code,
                language,
                userId
            })
        });

        if (!response.ok) {
            return {
                success: false,
                error: `Execution failed: ${response.statusText}`
            };
        }

        return await response.json();
    } catch (error) {
        return {
            success: false,
            error: `Network error: ${String(error)}`
        };
    }
}

/**
 * Exécute les tests automatiques
 */
export async function runTests(
    submissionId: string,
    labId: string,
    code: string,
    language: 'python' | 'sql' | 'pyspark' | 'scala'
): Promise<TestResponse> {
    try {
        const response = await fetch('/api/labs/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                submissionId,
                labId,
                code,
                language
            })
        });

        if (!response.ok) {
            return {
                success: false,
                results: [],
                summary: { total: 0, passed: 0, failed: 0, successRate: 0 },
                score: 0,
                feedback: 'Test execution failed'
            };
        }

        return await response.json();
    } catch (error) {
        return {
            success: false,
            results: [],
            summary: { total: 0, passed: 0, failed: 0, successRate: 0 },
            score: 0,
            feedback: `Network error: ${String(error)}`
        };
    }
}

/**
 * Récupère les données d'un lab
 */
export async function getLabData(labId: string): Promise<LabData | null> {
    try {
        const response = await fetch(`/api/labs/${labId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            console.error('Failed to fetch lab data');
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching lab data:', error);
        return null;
    }
}

/**
 * Récupère le code starter d'un lab
 */
export async function getStarterCode(labId: string): Promise<string> {
    try {
        const response = await fetch(`/api/labs/${labId}/starter`, {
            method: 'GET'
        });

        if (!response.ok) {
            return '';
        }

        const data = await response.json();
        return data.code || '';
    } catch (error) {
        console.error('Error fetching starter code:', error);
        return '';
    }
}

/**
 * Récupère la solution d'un lab (après succès)
 */
export async function getSolution(labId: string): Promise<string> {
    try {
        const response = await fetch(`/api/labs/${labId}/solution`, {
            method: 'GET'
        });

        if (!response.ok) {
            return '';
        }

        const data = await response.json();
        return data.code || '';
    } catch (error) {
        console.error('Error fetching solution:', error);
        return '';
    }
}
