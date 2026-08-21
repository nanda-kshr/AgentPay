import { NextResponse } from 'next/server';
import { initializeDatabase, getMerchants, getProducts, getAgents } from '@/lib/engine';

export async function GET() {
  try {
    const initResult = await initializeDatabase();
    const [merchants, products, agents] = await Promise.all([
      getMerchants(),
      getProducts(),
      getAgents(),
    ]);

    return NextResponse.json({
      success: true,
      mode: initResult.mode,
      merchants,
      products,
      agents,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : 'Failed to initialize marketplace';
    return NextResponse.json({ success: false, error: err }, { status: 500 });
  }
}
