import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'Format permintaan tidak didukung.' }, { status: 415 });
  }
  const length = Number(req.headers.get('content-length') || 0);
  if (length > 1024) return NextResponse.json({ error: 'Permintaan terlalu besar.' }, { status: 413 });

  const body = await req.json().catch(() => null);
  const articleId = typeof body?.article_id === 'string' ? body.article_id : '';
  if (!UUID_PATTERN.test(articleId)) {
    return NextResponse.json({ error: 'ID berita tidak valid.' }, { status: 400 });
  }
  if (!supabase) return NextResponse.json({ ok: false }, { status: 503 });

  const { error } = await supabase.from('article_views').insert({ article_id: articleId });
  if (error) return NextResponse.json({ ok: false }, { status: 400 });
  return NextResponse.json({ ok: true });
}
