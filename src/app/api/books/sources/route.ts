import { NextRequest, NextResponse } from 'next/server';

import { opdsClient } from '@/lib/opds.client';

import { getAuthorizedBooksUsername } from '../_utils';

// Route reads request data — must run on the dynamic server, not at build time.
export const dynamic = 'force-dynamic';


export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const username = await getAuthorizedBooksUsername(request);
  if (username instanceof NextResponse) return username;

  try {
    const sources = await opdsClient.getSources();
    return NextResponse.json({ sources });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
