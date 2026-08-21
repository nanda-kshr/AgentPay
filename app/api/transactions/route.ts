import { NextResponse } from 'next/server';
import { getRecentTransactions } from '@/lib/engine';

export async function GET() {
  try {
    const transactions = await getRecentTransactions();
    return NextResponse.json({
      success: true,
      transactions,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : 'Failed to fetch transactions';
    return NextResponse.json({ success: false, error: err }, { status: 500 });
  }
}
