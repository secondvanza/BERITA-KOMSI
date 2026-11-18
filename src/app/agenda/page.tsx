import Link from 'next/link';
import {supabase} from '@/lib/supabase';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';

export default async function Agenda(){
 const{data:events,error}=supabase?await supabase.from('events').select('id,title,slug,location,starts_at,ends_at,description,cover_image').eq('status','published').order('starts_at',{ascending:true,nullsFirst:false}):{data:[],error:null};
 const rows=events||[];
 const upcoming=rows.filter(e=>!e.starts_at||new Date(e.starts_at).getTime()>=Date.now());
 const past=rows.filter(e=>e.starts_at&&new Date(e.starts_at).getTime()<Date.now());
 const card=(e:any)=><article key={e.id} style={{background:'white',border:'1px solid #eee',borderRadius:10,overflow:'hidden'}}>
  {e.cover_image&&<Link href={'/agenda/'+e.slug}><img src={e.cover_image} alt={e.title} style={{width:'100%',height:190,objectFit:'cover',display:'block'}}/></Link>}
  <div style={{padding:22}}><span className="eyebrow">{e.starts_at?new Date(e.starts_at).toLocaleString('id-ID',{dateStyle:'long',timeStyle:'short',timeZone:'Asia/Jakarta'}):'Jadwal menyusul'}</span>
   <h2 style={{fontSize:21,lineHeight:1.3}}><Link href={'/agenda/'+e.slug}>{e.title}</Link></h2><p className="muted">{e.location||'Lokasi menyusul'}</p>
   <p>{(e.description||'').slice(0,180)}{(e.description||'').length>180?'…':''}</p>
   <Link href={'/agenda/'+e.slug} style={{color:'#c91f2c',fontWeight:700}}>Lihat detail kegiatan →</Link>
  </div>
 </article>;
 return <><PublicHeader/><main className="container" style={{padding:'45px 0 70px'}}>
  <span className="eyebrow">Kalender komunitas</span><h1 className="section-title">Agenda KOMSI</h1>
  {error&&<p role="status" className="muted">Agenda belum dapat dimuat. Silakan muat ulang halaman.</p>}
  <section style={{marginTop:25}}><h2 style={{fontSize:20}}>Agenda Mendatang</h2>
   {upcoming.length?<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:18}}>{upcoming.map(card)}</div>:<p className="muted">Belum ada agenda mendatang yang diumumkan.</p>}
  </section>
  {!!past.length&&<section style={{marginTop:38}}><h2 style={{fontSize:20}}>Agenda Sebelumnya</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:18}}>{past.map(card)}</div></section>}
 </main><PublicFooter/></>;
}
