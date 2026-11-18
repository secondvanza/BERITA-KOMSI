# KOMSI NEWS
Portal berita Komunitas Seni KOMSI menggunakan Next.js, Tailwind CSS, Supabase, dan Tiptap.

## Pengembangan lokal
1. Salin `.env.example` menjadi `.env.local`.
2. Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` dari Supabase project BERITA KOMSI.
3. Jalankan `npm install` lalu `npm run dev`.

## Supabase
Skema awal dibuat melalui migration `initial_komsi_news_schema`. Buat user melalui Supabase Auth, lalu berikan role awal `super_admin` pada profil user tepercaya melalui SQL Editor. Jangan pernah menaruh service-role/secret key di browser.

## Deployment
Hubungkan repository ke Vercel dan atur environment variables. Konfigurasikan URL redirect Supabase Auth untuk domain deployment.
