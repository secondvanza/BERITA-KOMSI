import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const EMAIL_PATTERN = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

export async function POST(req: Request) {
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'Format permintaan tidak didukung.' }, { status: 415 });
  }
  const length = Number(req.headers.get('content-length') || 0);
  if (length > 2048) return NextResponse.json({ error: 'Permintaan terlalu besar.' }, { status: 413 });

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: 'Alamat email tidak valid.' }, { status: 400 });
  }
  if (!supabase) return NextResponse.json({ error: 'Layanan belum dikonfigurasi.' }, { status: 503 });

  const { error } = await supabase.from('newsletter_subscribers').insert({ email, is_active: true });
  if (error && error.code !== '23505') {
    return NextResponse.json({ error: 'Pendaftaran belum dapat diproses.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
