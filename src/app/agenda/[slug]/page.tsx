import {notFound} from 'next/navigation';
import Link from 'next/link';
import {supabase} from '@/lib/supabase';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
 const{slug}=await params;
 const{data}=supabase?await supabase.from('events').select('title,description').eq('slug',slug).eq('status','published').maybeSingle():{data:null};
 return {title:data?.title?data.title+' | Agenda KOMSI':'Agenda KOMSI',description:data?.description||'Informasi kegiatan KOMSI'};
}

export default async function AgendaDetail({params}:{params:Promise<{slug:string}>}){
 const{slug}=await params;
 const{data:event}=supabase?await supabase.from('events').select('title,location,starts_at,description').eq('slug',slug).eq('status','published').maybeSingle():{data:null};
 if(!event)notFound();
 return <><PublicHeader/><main className="container" style={{maxWidth:900,padding:'45px 0 70px'}}>
  <Link href="/agenda" style={{color:'#c91f2c',fontWeight:700}}>← Kembali ke agenda</Link>
  <div style={{marginTop:25}}><span className="eyebrow">Agenda KOMSI</span><h1 className="section-title">{event.title}</h1></div>
  <div style={{display:'flex',gap:18,flexWrap:'wrap',margin:'18px 0',color:'#666'}}>
   <span>{event.starts_at?new Date(event.starts_at).toLocaleString('id-ID',{dateStyle:'full',timeStyle:'short'}):'Jadwal menyusul'}</span>
   <span>{event.location||'Lokasi menyusul'}</span>
  </div>
  <article style={{background:'white',border:'1px solid #eee',borderRadius:10,padding:24,lineHeight:1.85,whiteSpace:'pre-wrap'}}>{event.description||'Informasi kegiatan akan diperbarui.'}</article>
 </main><PublicFooter/></>;
}
