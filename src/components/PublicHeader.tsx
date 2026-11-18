import Link from 'next/link';
import {supabase} from '@/lib/supabase';

export default async function PublicHeader(){
 const [{data:settingsRows},{data:categories}]=supabase?await Promise.all([
  supabase.from('site_settings').select('key,value').in('key',['site_name','tagline','logo_url']),
  supabase.from('categories').select('name,slug').order('sort_order').limit(8)
 ]):[{data:[]},{data:[]}];
 const settings=Object.fromEntries((settingsRows||[]).map((row:any)=>[row.key,row.value]));
 return <header style={{background:'#fff',borderBottom:'1px solid #e8e8e8'}}>
  <div style={{background:'#171717',color:'#eee',fontSize:11,padding:'8px 0'}}><div className="container" style={{display:'flex',justifyContent:'space-between',gap:10}}><span>PORTAL INFORMASI KOMUNITAS SENI KOMSI</span><span>HARMONIS • KRITIS • KREATIF</span></div></div>
  <div className="container" style={{minHeight:88,display:'flex',alignItems:'center',justifyContent:'space-between',gap:18,flexWrap:'wrap',paddingTop:12,paddingBottom:12}}>
   <Link href="/" style={{display:'flex',alignItems:'center',gap:12}}>
    <div style={{width:56,height:56,flexShrink:0,background:'transparent',border:0,borderRadius:'50%',display:'grid',placeItems:'center',overflow:'hidden',clipPath:'circle(50%)',color:'#fff',fontWeight:900,fontSize:25}}>{settings.logo_url?<img src={String(settings.logo_url)} alt="Logo KOMSI" style={{display:'block',width:'100%',height:'100%',objectFit:'cover',border:0,borderRadius:'50%'}}/>:'K'}</div>
    <div><div style={{fontSize:25,fontWeight:950,letterSpacing:'-.06em'}}>{String(settings.site_name||'KOMSI')} <span style={{color:'#c91f2c'}}>NEWS</span></div><small style={{color:'#777',letterSpacing:'.08em'}}>{String(settings.tagline||'PORTAL INFORMASI KOMUNITAS SENI')}</small></div>
   </Link>
   <form action="/cari" style={{display:'flex',gap:6,flex:'0 1 310px',minWidth:220}}><input name="q" placeholder="Cari berita KOMSI…" aria-label="Cari berita" style={{minWidth:0,flex:1,padding:'10px 12px',border:'1px solid #ddd',borderRadius:6}}/><button style={{background:'#c91f2c',color:'#fff',border:0,borderRadius:6,padding:'0 14px',fontWeight:700}}>Cari</button></form>
  </div>
  <nav style={{borderTop:'1px solid #eee'}}><div className="container" style={{display:'flex',gap:22,overflowX:'auto',padding:'13px 0',fontSize:13,fontWeight:750,whiteSpace:'nowrap'}}><Link href="/">Beranda</Link><Link href="/berita">Semua Berita</Link>{(categories||[]).map((category:any)=><Link key={category.slug} href={'/kategori/'+category.slug}>{category.name}</Link>)}<Link href="/agenda">Agenda</Link><Link href="/tentang-kami">Tentang Kami</Link></div></nav>
 </header>;
}