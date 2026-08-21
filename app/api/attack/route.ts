import { NextRequest, NextResponse } from 'next/server';
import { createEphemeralCredentialForTransaction, processPaymentGateway } from '@/lib/engine';
import { EphemeralCredential } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { attackType, customAmount, customMerchantId } = body;

    // 1. Create a valid baseline credential
    const baseCredential = await createEphemeralCredentialForTransaction({
      agentId: 'agent_travel_01',
      merchantId: 'merch_jr_shinkansen',
      amount: 260,
      currency: 'USD',
      purpose: 'Japan Rail Shinkansen High-Speed Booking',
    });

    let testCredential: EphemeralCredential = { ...baseCredential };
    let executionAmount = 260;
    let targetMerchantId = 'merch_jr_shinkansen';

    switch (attackType) {
      case 'amount_tamper':
        // Attacker attempts to charge more or change the amount
        executionAmount = customAmount || 999;
        break;

      case 'merchant_redirect':
        // Attacker attempts to divert funds to another merchant
        targetMerchantId = customMerchantId || 'merch_rogue_shadow_corp';
        break;

      case 'nonce_replay': {
        // First valid execution consumes the nonce
        await processPaymentGateway({
          credential: testCredential,
          productId: 'prod_transport_shinkansen_pass',
          productTitle: 'Shinkansen Green Pass',
          executionAmount: 260,
          targetMerchantId: 'merch_jr_shinkansen',
        });
        // Now testCredential's nonce is already consumed in the store
        break;
      }

      case 'token_expired':
        // Simulate an expired credential beyond its 60-second window
        testCredential = {
          ...testCredential,
          issuedAt: Date.now() - 120000,
          expiresAt: Date.now() - 60000,
        };
        break;

      case 'signature_forgery':
        // Attacker alters signature
        testCredential = {
          ...testCredential,
          signature: '0000deadbeefcafebabefeedface000000000000000000000000000000000000',
        };
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown attack vector requested' },
          { status: 400 }
        );
    }

    // Attempt to execute against the Mock Payment Gateway
    const gatewayResult = await processPaymentGateway({
      credential: testCredential,
      productId: 'prod_transport_shinkansen_pass',
      productTitle: 'Shinkansen Green Pass',
      executionAmount,
      targetMerchantId,
    });

    return NextResponse.json({
      success: true,
      attackType,
      attackAttempt: {
        credential: testCredential,
        targetMerchantId,
        executionAmount,
      },
      gatewayResult,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : 'Attack simulation failed';
    return NextResponse.json({ success: false, error: err }, { status: 500 });
  }
}
