import { NextRequest, NextResponse } from 'next/server';
import { buildAutonomousPlan } from '@/lib/engine';
import { TripRequest } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tripRequest: TripRequest = {
      id: 'req_' + Math.random().toString(36).substring(2, 11),
      query: body.query || 'I want to go to Japan',
      destination: body.destination || 'Japan',
      durationDays: Number(body.durationDays) || 7,
      budget: Number(body.budget) || 2000,
      comfortLevel: body.comfortLevel || 'standard',
      interests: Array.isArray(body.interests) ? body.interests : ['culture', 'sightseeing'],
    };

    const recommendation = await buildAutonomousPlan(tripRequest);

    return NextResponse.json({
      success: true,
      request: tripRequest,
      recommendation,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : 'Planning failed';
    return NextResponse.json({ success: false, error: err }, { status: 500 });
  }
}
