import { NextRequest, NextResponse } from 'next/server';
import { createEphemeralCredentialForTransaction } from '@/lib/engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, merchantId, amount, currency, purpose } = body;

    if (!agentId || !merchantId || amount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required authorization parameters (agentId, merchantId, amount)' },
        { status: 400 }
      );
    }

    const credential = await createEphemeralCredentialForTransaction({
      agentId,
      merchantId,
      amount: Number(amount),
      currency: currency || 'USD',
      purpose: purpose || 'Autonomous travel booking settlement',
    });

    return NextResponse.json({
      success: true,
      credential,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : 'Authorization generation failed';
    return NextResponse.json({ success: false, error: err }, { status: 400 });
  }
}
