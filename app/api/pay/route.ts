import { NextRequest, NextResponse } from 'next/server';
import { processPaymentGateway } from '@/lib/engine';
import { EphemeralCredential } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { credential, productId, productTitle, executionAmount, targetMerchantId } = body;

    if (!credential || !productId || !targetMerchantId || executionAmount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Incomplete payment gateway payload' },
        { status: 400 }
      );
    }

    const result = await processPaymentGateway({
      credential: credential as EphemeralCredential,
      productId,
      productTitle: productTitle || 'Simulated Commerce Item',
      executionAmount: Number(executionAmount),
      targetMerchantId,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          stageFailed: result.stageFailed,
          message: result.message,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      transaction: result.transaction,
      receipt: result.receipt,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : 'Gateway processing error';
    return NextResponse.json({ success: false, error: err }, { status: 500 });
  }
}
