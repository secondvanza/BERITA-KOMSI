import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import Link from 'next/link';
import {supabase} from '@/lib/supabase';

export default async function Search({searchParams}:{searchParams:Promise<{q?:string}>}){
 const{q=''}=await searchParams;
 const term=q.trim().slice(0,100);
 const safe=term.replace(/[%_,()."\\:*]/g,' ').replace(/\s+/g,' ').trim();
 const{data}=safe&&supabase?await supabase.from('articles').select('id,title,slug,excerpt,published_at,categories(name)').eq('status','published').or('title.ilike.%'+safe+'%,excerpt.ilike.%'+safe+'%').order('published_at',{ascending:false}).limit(30):{data:[]};
 return <><PublicHeader/><main className="container" style={{padding:'45px 0',maxWidth:900}}>
  <span className="eyebrow">Pencarian portal</span><h1 className="section-title">Cari Berita KOMSI</h1>
  <form action="/cari" style={{display:'flex',gap:8,margin:'20px 0'}}><input name="q" defaultValue={term} maxLength={100} placeholder="Masukkan kata kunci berita…" style={{flex:1,padding:13,border:'1px solid #ddd',borderRadius:7}}/><button style={{background:'#c91f2c',color:'white',border:0,borderRadius:7,padding:'0 18px'}}>Cari</button></form>
  {term&&<p className="muted">Hasil pencarian untuk “{term}”</p>}
  {(data||[]).map(a=><article key={a.id} style={{padding:'18px 0',borderBottom:'1px solid #eee'}}><span className="eyebrow">{a.categories?.[0]?.name||'Berita'}</span><h2 style={{fontSize:21}}><Link href={'/berita/'+a.slug}>{a.title}</Link></h2><p className="muted">{a.excerpt}</p></article>)}
  {term&&!data?.length&&<p className="muted">Tidak ditemukan berita dengan kata kunci tersebut.</p>}
 </main><PublicFooter/></>;
}
