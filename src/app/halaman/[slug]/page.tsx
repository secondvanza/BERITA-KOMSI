import {Fragment} from 'react';
import {notFound} from 'next/navigation';
import {supabase} from '@/lib/supabase';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';

export default async function Page({params}:{params:Promise<{slug:string}>}){
 const{slug}=await params;
 if(!supabase)notFound();
 const{data}=await supabase.from('pages').select('*').eq('slug',slug).eq('is_published',true).single();
 if(!data)notFound();
 const content=data.content?.type==='doc'?data.content:data.content?.text||'';
 return <><PublicHeader/><main className="container" style={{maxWidth:850,padding:'50px 0'}}>
  <span className="eyebrow">Informasi KOMSI</span><h1 style={{fontSize:42}}>{data.title}</h1>
  <div style={{fontSize:17,lineHeight:1.8}}>{renderContent(content)}</div>
 </main><PublicFooter/></>;
}
function renderContent(doc:any):any{
 if(!doc)return null;
 if(typeof doc==='string')return doc;
 if(Array.isArray(doc))return doc.map((n:any,i:number)=><Fragment key={i}>{renderContent(n)}</Fragment>);
 if(doc.type==='text'){let node:any=doc.text;for(const mark of doc.marks||[]){if(mark.type==='bold')node=<strong>{node}</strong>;else if(mark.type==='italic')node=<em>{node}</em>;else if(mark.type==='strike')node=<s>{node}</s>;else if(mark.type==='code')node=<code>{node}</code>;else if(mark.type==='link'&&(String(mark.attrs?.href||'').startsWith('https://')||String(mark.attrs?.href||'').startsWith('http://')))node=<a href={mark.attrs.href} target="_blank" rel="noopener noreferrer">{node}</a>;}return node;}
 if(doc.type==='paragraph')return <p>{renderContent(doc.content)}</p>;
 if(doc.type==='heading'){const level=Math.min(6,Math.max(1,Number(doc.attrs?.level)||2));const Heading:any='h'+level;return <Heading>{renderContent(doc.content)}</Heading>;}
 if(doc.type==='blockquote')return <blockquote>{renderContent(doc.content)}</blockquote>;
 if(doc.type==='codeBlock')return <pre><code>{renderContent(doc.content)}</code></pre>;
 if(doc.type==='hardBreak')return <br/>;
 if(doc.type==='horizontalRule')return <hr/>;
 if(doc.type==='bulletList'||doc.type==='orderedList'){const Tag:any=doc.type==='bulletList'?'ul':'ol';return <Tag>{doc.content?.map((n:any,i:number)=><li key={i}>{renderContent(n.content)}</li>)}</Tag>}
 if(doc.type==='image')return <img src={doc.attrs?.src} alt={doc.attrs?.alt||''} style={{maxWidth:'100%'}}/>;
 return doc.content?renderContent(doc.content):null;
}
