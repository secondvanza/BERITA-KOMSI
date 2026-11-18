import Link from 'next/link';
import {supabase} from '@/lib/supabase';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';

export default async function Agenda(){
 const{data}=supabase?await supabase.from('events').select('id,title,slug,location,starts_at,description').eq('status','published').order('starts_at',{ascending:true}):{data:[]};
 return <><PublicHeader/><main className="container" style={{padding:'45px 0'}}>
  <span className="eyebrow">Kalender komunitas</span><h1 className="section-title">Agenda KOMSI</h1>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:18,marginTop:25}}>
   {(data||[]).map(e=><article key={e.id} style={{background:'white',padding:22,border:'1px solid #eee',borderRadius:10}}>
    <span className="eyebrow">{e.starts_at?new Date(e.starts_at).toLocaleDateString('id-ID',{dateStyle:'long'}):'Jadwal menyusul'}</span>
    <h2>{e.title}</h2><p className="muted">{e.location||'Lokasi menyusul'}</p>
    <p>{(e.description||'').slice(0,180)}{(e.description||'').length>180?'…':''}</p>
    <Link href={'/agenda/'+e.slug} style={{color:'#c91f2c',fontWeight:700}}>Lihat detail kegiatan →</Link>
   </article>)}
  </div>
  {!data?.length&&<p className="muted">Belum ada agenda yang diumumkan.</p>}
 </main><PublicFooter/></>;
}
