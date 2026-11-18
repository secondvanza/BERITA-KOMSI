# KOMSI NEWS

Portal berita Komunitas Seni KOMSI dengan Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth, Postgres, Storage, dan Edge Functions.

## Fitur
- Portal berita publik, arsip kategori, halaman artikel, agenda, dan profil organisasi.
- Panel admin: dashboard, berita, editor rich-text, review, jadwal terbit, kategori, media, agenda, komentar, pengguna, dan pengaturan.
- Alur redaksi: jurnalis membuat draft/mengirim review; editor/admin mengelola publikasi.
- Supabase Auth, RLS, Storage bucket `komsi-media`, newsletter, statistik pembaca, dan undangan anggota melalui Edge Function `invite-staff`.

## Menjalankan lokal
1. Salin `.env.example` menjadi `.env.local`.
2. Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key / anon key lama).
3. Isi `NEXT_PUBLIC_SITE_URL` dengan URL deployment atau `http://localhost:3000`.
4. Jalankan `npm install` lalu `npm run dev`.

## Membuat admin pertama
1. Buat user pertama di Supabase Dashboard → Authentication → Users → Add user.
2. Setelah user dibuat, buka SQL Editor dan jalankan query berikut dengan email akun admin yang kamu buat:

```sql
update public.profiles
set role = 'super_admin', is_active = true
where email = 'EMAIL_ADMIN_KAMU';
```

3. Login di `/admin/login`.
4. Setelah admin pertama aktif, gunakan menu Pengguna untuk mengundang jurnalis/editor. Undangan dikirim lewat Edge Function `invite-staff`.

Jangan memasukkan service-role key ke file `.env.local` dengan awalan `NEXT_PUBLIC_`, browser, atau repositori. Edge Function menggunakan secret server-side bawaan Supabase.

## Deployment
- Hubungkan repository ke Vercel.
- Atur `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, dan `NEXT_PUBLIC_SITE_URL` di Vercel.
- Atur Site URL dan Redirect URLs di Supabase Authentication agar sesuai domain Vercel.
- Pastikan Edge Function `invite-staff` berstatus ACTIVE.
- Build otomatis diperiksa oleh GitHub Actions pada push ke branch `main`.

## Catatan
Logo asli dapat dipasang melalui menu Admin → Media, lalu URL publiknya dimasukkan pada Admin → Pengaturan. Isi profil organisasi, kontak, dan tautan media sosial sebelum website diumumkan secara resmi.
