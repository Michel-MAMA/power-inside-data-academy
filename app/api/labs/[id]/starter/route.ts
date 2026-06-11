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

        // Récupérer le code starter
        const { data: snippets, error } = await getSupabase()
            .from('lab_code_snippets')
            .select('*')
            .eq('coding_lab_id', labId)
            .eq('snippet_type', 'starter')
            .limit(1);

        if (error || !snippets || snippets.length === 0) {
            return NextResponse.json(
                { code: '# Write your code here\n' }
            );
        }

        return NextResponse.json({
            code: snippets[0].code,
            explanation: snippets[0].explanation
        });
    } catch (error) {
        console.error('Error fetching starter code:', error);
        return NextResponse.json(
            { code: '# Error loading starter code\n' },
            { status: 500 }
        );
    }
}
