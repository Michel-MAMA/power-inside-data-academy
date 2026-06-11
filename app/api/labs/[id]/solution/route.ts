import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

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

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: labId } = await params;
        const userId = request.headers.get('x-user-id');

        // Check if user has solved this lab (score >= 80)
        if (userId) {
            const { data: results } = await getSupabase()
                .from('lab_results')
                .select('success_rate_pct')
                .eq('user_id', userId)
                .eq('coding_lab_id', labId)
                .order('created_at', { ascending: false })
                .limit(1);

            // Only show solution if user solved it
            if (!results || results.length === 0 || results[0].success_rate_pct < 80) {
                return NextResponse.json(
                    { error: 'You must solve the lab first (score >= 80%)' },
                    { status: 403 }
                );
            }
        }

        // Récupérer la solution
        const { data: snippets, error } = await getSupabase()
            .from('lab_code_snippets')
            .select('*')
            .eq('coding_lab_id', labId)
            .eq('snippet_type', 'solution')
            .limit(1);

        if (error || !snippets || snippets.length === 0) {
            return NextResponse.json(
                { code: '# Solution not available\n' }
            );
        }

        return NextResponse.json({
            code: snippets[0].code,
            explanation: snippets[0].explanation
        });
    } catch (error) {
        console.error('Error fetching solution:', error);
        return NextResponse.json(
            { code: '# Error loading solution\n' },
            { status: 500 }
        );
    }
}
