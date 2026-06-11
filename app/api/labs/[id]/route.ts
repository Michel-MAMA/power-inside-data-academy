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

        // Récupérer les données du lab
        const { data: lab, error: labError } = await getSupabase()
            .from('coding_labs')
            .select('*')
            .eq('id', labId)
            .single();

        if (labError || !lab) {
            return NextResponse.json(
                { error: 'Lab not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(lab);
    } catch (error) {
        console.error('Error fetching lab:', error);
        return NextResponse.json(
            { error: 'Failed to fetch lab' },
            { status: 500 }
        );
    }
}
