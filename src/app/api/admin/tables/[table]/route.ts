import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/database.types';

// Admin API route to fetch table data using service role key
// This bypasses RLS for admin functionality

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

type TableName = keyof Database['public']['Tables'];

const ALLOWED_TABLES: TableName[] = [
    'users',
    'frames',
    'pixels',
    'frame_permissions',
    'frame_stats',
    'frame_likes',
    'frame_snapshots'
];

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ table: string }> }
) {
    try {
        const { table } = await params;
        const tableName = table as TableName;

        // Validate table name
        if (!ALLOWED_TABLES.includes(tableName)) {
            return NextResponse.json(
                { error: 'Invalid table name' },
                { status: 400 }
            );
        }

        // Get limit from query params
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(Math.min(limit, 100)); // Cap at 100 rows

        if (error) {
            console.error(`Error fetching ${tableName}:`, error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            table: tableName,
            data: data || [],
            count: data?.length || 0
        });

    } catch (error) {
        console.error('Admin API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}