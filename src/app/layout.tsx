import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'KOMSI NEWS | Portal Informasi KOMSI', description: 'Portal berita, kegiatan, prestasi, dan informasi Komunitas Seni.' };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="id"><body>{children}</body></html>}
