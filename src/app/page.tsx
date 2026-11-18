import Link from 'next/link';
import {supabase} from '@/lib/supabase';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';

type Article = {
 id:string; title:string; slug:string; excerpt:string|null; featured_image:string|null;
 published_at:string|null; categories:any;
};
const categoryOf=(value:any)=>Array.isArray(value)?value[0]:value;
const dateLabel=(value:string|null)=>value?new Date(value).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}):'';

export default async function Home(){
 const [{data:articles},{data:categories}]=supabase?await Promise.all([
  supabase.from('articles').select('id,title,slug,excerpt,featured_image,published_at,categories(name,slug)').eq('status','published').not('published_at','is',null).lte('published_at',new Date().toISOString()).order('published_at',{ascending:false}).limit(7),
  supabase.from('categories').select('id,name,slug').order('sort_order',{ascending:true}).limit(12)
 ]):[{data:[]},{data:[]}];
 const news=(articles||[]) as Article[];
 const hero=news[0];
 return <><PublicHeader/><main className="container" style={{paddingTop:34,paddingBottom:70}}>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:16}}><span className="eyebrow">Sorotan KOMSI</span><span className="muted" style={{fontSize:12}}>PORTAL BERITA RESMI KOMUNITAS SENI</span></div>
  {hero?<section style={{display:'grid',gridTemplateColumns:'minmax(0,1.55fr) minmax(260px,.8fr)',gap:24}}>
   <Link href={'/berita/'+hero.slug} aria-label={'Baca '+hero.title} style={{backgroundColor:'#171717',color:'white',borderRadius:12,overflow:'hidden',minHeight:360,display:'flex',flexDirection:'column',justifyContent:'end',padding:30,backgroundImage:hero.featured_image?'linear-gradient(0deg,rgba(0,0,0,.88),rgba(0,0,0,.08)),url('+hero.featured_image+')':'linear-gradient(135deg,#242424,#111 65%,#9f1822)',backgroundSize:'cover',backgroundPosition:'center'}}>
    <span style={{background:'#c91f2c',padding:'6px 10px',borderRadius:4,width:'fit-content',fontSize:11,fontWeight:800}}>HEADLINE</span><h1 style={{fontSize:'clamp(27px,4vw,42px)',lineHeight:1.1,maxWidth:680,letterSpacing:'-.04em'}}>{hero.title}</h1><p style={{color:'#ddd',maxWidth:600,lineHeight:1.7}}>{hero.excerpt||'Baca berita selengkapnya dari KOMSI.'}</p><span style={{fontSize:12,color:'#ccc'}}>KOMSI NEWS · {dateLabel(hero.published_at)}</span>
   </Link>
   <aside style={{background:'white',padding:22,border:'1px solid #eee',borderRadius:12}}><span className="eyebrow">Tentang KOMSI</span><h2 style={{fontSize:26,lineHeight:1.15}}>Ruang informasi dan kreativitas.</h2><p className="muted" style={{lineHeight:1.8,fontSize:14}}>KOMSI NEWS menyajikan kabar kegiatan, karya, prestasi, dan informasi komunitas secara aktual dan mudah diakses.</p><div style={{height:1,background:'#eee',margin:'20px 0'}}/><b>Jelajahi informasi</b><p className="muted" style={{fontSize:13}}>Berita • Kegiatan • Prestasi • Pengumuman</p><Link href="/agenda" style={{display:'inline-block',marginTop:8,color:'#c91f2c',fontWeight:800,fontSize:13}}>Lihat agenda KOMSI →</Link></aside>
  </section>:<section style={{background:'#171717',color:'white',borderRadius:12,padding:36}}><span className="eyebrow">KOMSI NEWS</span><h1>Ruang informasi dan kreativitas KOMSI.</h1><p style={{color:'#ddd'}}>Belum ada berita yang diterbitkan. Nantikan informasi terbaru dari KOMSI.</p></section>}
  <section style={{marginTop:38}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'end',gap:12,marginBottom:16}}><div><span className="eyebrow">Jelajahi topik</span><h2 className="section-title">Kategori Berita</h2></div><Link href="/berita" style={{color:'#c91f2c',fontWeight:800,fontSize:13}}>Semua berita →</Link></div>
   <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>{(categories||[]).map((c:any)=><Link key={c.id} href={'/kategori/'+c.slug} style={{padding:'9px 15px',border:'1px solid #e5e5e5',borderRadius:999,background:'#fff',fontSize:13,fontWeight:700}}>{c.name}</Link>)}</div>
  </section>
  <section style={{marginTop:42}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'end',marginBottom:18}}><div><span className="eyebrow">Update terbaru</span><h2 className="section-title">Berita Terbaru</h2></div><Link href="/berita" style={{color:'#c91f2c',fontWeight:800,fontSize:13}}>Lihat semua →</Link></div>
   {news.length?<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:22}}>{news.slice(0,6).map(a=>{const category=categoryOf(a.categories);return <article className="news-card" key={a.id}><Link href={'/berita/'+a.slug} aria-label={'Baca '+a.title}><div style={{height:190,borderRadius:9,background:'#e5e5e5',overflow:'hidden'}}>{a.featured_image?<img src={a.featured_image} alt={a.title}/>:<div style={{height:'100%',display:'grid',placeItems:'center',background:'linear-gradient(135deg,#222,#b91c1c)',color:'white',fontWeight:900,fontSize:28}}>KOMSI</div>}</div><div className="eyebrow" style={{marginTop:12}}>{category?.name||'Berita KOMSI'}</div><h3>{a.title}</h3></Link><p className="muted" style={{fontSize:13,lineHeight:1.6}}>{a.excerpt}</p><small className="muted">{dateLabel(a.published_at)}</small></article>})}</div>:<p className="muted">Belum ada berita terbaru.</p>}
  </section>
 </main><PublicFooter/></>;
}
