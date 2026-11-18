import Link from 'next/link';
import {notFound} from 'next/navigation';
import {supabase} from '@/lib/supabase';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
 const{slug}=await params;
 const{data:category}=supabase?await supabase.from('categories').select('name').eq('slug',slug).maybeSingle():{data:null};
 return {title:category?.name?category.name+' | KOMSI NEWS':'Kategori | KOMSI NEWS'};
}
export default async function Category({params}:{params:Promise<{slug:string}>}){
 const{slug}=await params;
 if(!supabase)notFound();
 const{data:cat}=await supabase.from('categories').select('id,name,slug,description').eq('slug',slug).maybeSingle();
 if(!cat)notFound();
 const{data:articles,error}=await supabase.from('articles').select('id,title,slug,excerpt,featured_image,published_at').eq('category_id',cat.id).eq('status','published').not('published_at','is',null).lte('published_at',new Date().toISOString()).order('published_at',{ascending:false});
 return <><PublicHeader/><main className="container" style={{padding:'45px 0 70px'}}><span className="eyebrow">Kategori berita</span><h1 className="section-title">{cat.name}</h1>{cat.description&&<p className="muted">{cat.description}</p>}<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:22,marginTop:25}}>{(articles||[]).map(a=><article className="news-card" key={a.id}><Link href={'/berita/'+a.slug}>{a.featured_image?<img src={a.featured_image} alt={a.title}/>:<div style={{height:180,background:'#222',color:'white',display:'grid',placeItems:'center',borderRadius:9}}>KOMSI NEWS</div>}<h3>{a.title}</h3></Link><p className="muted">{a.excerpt}</p><small className="muted">{a.published_at?new Date(a.published_at).toLocaleDateString('id-ID',{dateStyle:'long'}):''}</small></article>)}</div>{error?<p role="status" className="muted">Berita kategori belum dapat dimuat. Silakan coba kembali.</p>:!articles?.length&&<p className="muted">Belum ada berita pada kategori ini.</p>}</main><PublicFooter/></>;
}
