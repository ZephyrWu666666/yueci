import { NextRequest, NextResponse } from 'next/server';
import { lookupAllReadings } from '@/lib/jyutping-dict';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const char = searchParams.get('char');

  if (!char) {
    return NextResponse.json({ error: '缺少查询字' }, { status: 400 });
  }

  const readings = await lookupAllReadings(char);
  return NextResponse.json({ char, readings });
}
