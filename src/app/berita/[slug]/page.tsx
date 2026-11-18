import {Fragment} from 'react';
import {notFound} from 'next/navigation';
import {supabase} from '@/lib/supabase';
import CommentForm from '@/components/CommentForm';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
 const{slug}=await params;
 if(!supabase)return {title:'Berita KOMSI'};
 const{data}=await supabase.from('articles').select('title,excerpt,featured_image,published_at').eq('slug',slug).eq('status','published').not('published_at','is',null).lte('published_at',new Date().toISOString()).maybeSingle();
 if(!data)return {title:'Berita tidak ditemukan | KOMSI'};
 const title=data.title+' | KOMSI';
 const description=(data.excerpt||'Berita dan informasi terbaru dari KOMSI').slice(0,160);
 const canonical=(process.env.NEXT_PUBLIC_SITE_URL||'https://berita-komsi.vercel.app')+'/berita/'+slug;
 return {title,description,alternates:{canonical},openGraph:{type:'article',title,description,url:canonical,images:data.featured_image?[{url:data.featured_image}]:[],publishedTime:data.published_at||undefined,siteName:'KOMSI'},twitter:{card:data.featured_image?'summary_large_image':'summary',title,description,images:data.featured_image?[data.featured_image]:[]}};
}
export default async function Detail({params}:{params:Promise<{slug:string}>}){
 const{slug}=await params;
 if(!supabase)notFound();
 // Ambil artikel tanpa embedded profile/category agar RLS pada tabel profil tidak menggagalkan halaman detail.
 const{data:a,error}=await supabase.from('articles').select('id,title,slug,excerpt,content,featured_image,published_at,category_id,author_id,source_name,source_url').eq('slug',slug).eq('status','published').not('published_at','is',null).lte('published_at',new Date().toISOString()).maybeSingle();
 if(error||!a)notFound();
 const [categoryResult,tagResult,commentResult]=await Promise.all([
  a.category_id?supabase.from('categories').select('name,slug').eq('id',a.category_id).maybeSingle():Promise.resolve({data:null}),
  supabase.from('article_tags').select('tags(name,slug)').eq('article_id',a.id),
  supabase.from('comments').select('id,name,body,created_at').eq('article_id',a.id).eq('status','approved').order('created_at',{ascending:false}),
 ]);
 const category=categoryResult.data;
 const tagLinks=tagResult.data||[];
 const comments=commentResult.data||[];
 try{await supabase.from('article_views').insert({article_id:a.id});}catch{}
 return <><PublicHeader/><main className="container" style={{maxWidth:850,padding:'45px 0 80px'}}>
  <span className="eyebrow">{category?.name||'Berita KOMSI'}</span>
  <h1 style={{fontSize:'clamp(32px,5vw,52px)',lineHeight:1.08,letterSpacing:'-.04em'}}>{a.title}</h1>
  <p className="muted">Oleh Redaksi KOMSI · {a.published_at?new Date(a.published_at).toLocaleDateString('id-ID',{dateStyle:'long',timeZone:'Asia/Jakarta'}):''}</p>
  {a.featured_image&&<img src={a.featured_image} alt={a.title} style={{width:'100%',height:'auto',maxHeight:520,objectFit:'cover',borderRadius:12,margin:'22px 0'}}/>}
  {a.excerpt&&<p style={{fontSize:19,lineHeight:1.7,fontWeight:600}}>{a.excerpt}</p>}
  {!!tagLinks.length&&<nav aria-label="Tag berita" style={{display:'flex',gap:8,flexWrap:'wrap',margin:'18px 0 24px'}}>{tagLinks.map((item:any)=><a key={item.tags?.slug||item.tags?.name} href={'/tag/'+item.tags?.slug} style={{border:'1px solid #e5e7eb',borderRadius:999,padding:'5px 12px',fontSize:13,color:'#b91c2c',textDecoration:'none'}}>#{item.tags?.name}</a>)}</nav>}
  <div className="article-content" style={{fontSize:17,lineHeight:1.9,overflowWrap:'anywhere'}}>{renderContent(a.content)}</div>
  {a.source_name&&<p className="muted" style={{marginTop:28,fontSize:13}}>Sumber: {a.source_url?<a href={a.source_url} target="_blank" rel="noopener noreferrer">{a.source_name}</a>:a.source_name}</p>}
  <section style={{marginTop:38}}><h2>Komentar pembaca</h2>{comments.map((c:any)=><article key={c.id} style={{padding:'13px 0',borderBottom:'1px solid #eee'}}><b>{c.name}</b><p>{c.body}</p></article>)}{!comments.length&&<p className="muted">Belum ada komentar yang disetujui.</p>}</section>
  <CommentForm articleId={a.id}/>
 </main><PublicFooter/></>;
}
function renderContent(doc:any):any{
 if(!doc)return null;
 if(typeof doc==='string')return doc;
 if(Array.isArray(doc))return doc.map((n:any,i:number)=><Fragment key={i}>{renderContent(n)}</Fragment>);
 if(doc.type==='doc')return renderContent(doc.content);
 if(doc.type==='text'){let node:any=doc.text;for(const mark of doc.marks||[]){if(mark.type==='bold')node=<strong>{node}</strong>;else if(mark.type==='italic')node=<em>{node}</em>;else if(mark.type==='strike')node=<s>{node}</s>;else if(mark.type==='code')node=<code>{node}</code>;else if(mark.type==='link'&&(String(mark.attrs?.href||'').startsWith('https://')||String(mark.attrs?.href||'').startsWith('http://')))node=<a href={mark.attrs.href} target="_blank" rel="noopener noreferrer">{node}</a>;}return node;}
 if(doc.type==='paragraph')return <p>{renderContent(doc.content)}</p>;
 if(doc.type==='heading'){const level=Math.min(6,Math.max(1,Number(doc.attrs?.level)||2));const Heading:any='h'+level;return <Heading>{renderContent(doc.content)}</Heading>;}
 if(doc.type==='blockquote')return <blockquote>{renderContent(doc.content)}</blockquote>;
 if(doc.type==='codeBlock')return <pre><code>{renderContent(doc.content)}</code></pre>;
 if(doc.type==='hardBreak')return <br/>;
 if(doc.type==='horizontalRule')return <hr/>;
 if(doc.type==='bulletList'||doc.type==='orderedList'){const Tag:any=doc.type==='bulletList'?'ul':'ol';return <Tag>{doc.content?.map((n:any,i:number)=><li key={i}>{renderContent(n.content)}</li>)}</Tag>;}
 if(doc.type==='listItem')return renderContent(doc.content);
 if(doc.type==='image')return <figure style={{margin:'22px 0'}}><img src={doc.attrs?.src} alt={doc.attrs?.alt||''} style={{display:'block',maxWidth:'100%',height:'auto',margin:'auto',borderRadius:8}}/></figure>;
 return doc.content?renderContent(doc.content):null;
}
