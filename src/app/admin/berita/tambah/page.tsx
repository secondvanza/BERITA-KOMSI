'use client';
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import ArticleEditor from '@/components/ArticleEditor';
import {supabase} from '@/lib/supabase';

const slugify=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
const publishers=['super_admin','admin','editor','editor_in_chief'];
const localInput=(date:Date)=>new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);
type Snapshot={title:string;excerpt:string;content:any;category:string;image:string;source:string;sourceUrl:string;tags:string[]};
export default function NewArticle(){
 const router=useRouter();
 const[title,setTitle]=useState('');const[excerpt,setExcerpt]=useState('');const[content,setContent]=useState<any>(null);
 const[category,setCategory]=useState('');const[image,setImage]=useState('');const[source,setSource]=useState('');const[sourceUrl,setSourceUrl]=useState('');
 const[scheduled,setScheduled]=useState('');const[categories,setCategories]=useState<any[]>([]);const[tags,setTags]=useState<any[]>([]);const[selectedTags,setSelectedTags]=useState<string[]>([]);
 const[role,setRole]=useState('');const[busy,setBusy]=useState(false);const[message,setMessage]=useState('');const[autoMessage,setAutoMessage]=useState('Draft otomatis akan aktif setelah judul diisi.');
 const[autoDraftId,setAutoDraftId]=useState<string|null>(null);
 const autoBusy=useRef(false);const autoPending=useRef(false);const draftIdRef=useRef<string|null>(null);const finalizing=useRef(false);
 const latest=useRef<Snapshot>({title:'',excerpt:'',content:null,category:'',image:'',source:'',sourceUrl:'',tags:[]});
 latest.current={title,excerpt,content,category,image,source,sourceUrl,tags:selectedTags};

 useEffect(()=>{let active=true;(async()=>{
  if(!supabase)return;
  const[{data:{user}},{data:c},{data:t}]=await Promise.all([supabase.auth.getUser(),supabase.from('categories').select('id,name').order('sort_order'),supabase.from('tags').select('id,name').order('name')]);
  if(!active)return;setCategories(c||[]);setTags(t||[]);
  if(user){const{data:p}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle();if(active)setRole(p?.role||'');}
 })();return()=>{active=false}},[]);

 async function syncTags(articleId:string,ids:string[]){const del=await supabase!.from('article_tags').delete().eq('article_id',articleId);if(del.error)throw del.error;if(ids.length){const ins=await supabase!.from('article_tags').insert(ids.map(tag_id=>({article_id:articleId,tag_id})));if(ins.error)throw ins.error;}}
 async function saveAuto(snapshot:Snapshot):Promise<boolean>{
  if(!supabase||!snapshot.title.trim()||finalizing.current)return false;
  if(autoBusy.current){autoPending.current=true;return false}
  autoBusy.current=true;
  try{
   const{data:{user}}=await supabase.auth.getUser();if(!user)return;
   const row={title:snapshot.title.trim(),excerpt:snapshot.excerpt.trim(),content:snapshot.content||{type:'doc',content:[]},category_id:snapshot.category||null,featured_image:snapshot.image.trim()||null,source_name:snapshot.source.trim()||null,source_url:snapshot.sourceUrl.trim()||null,author_id:user.id,status:'draft',scheduled_at:null,published_at:null};
   let id=draftIdRef.current;
   if(id){const{error}=await supabase.from('articles').update(row).eq('id',id);if(error)throw error;}
   else{const{data,error}=await supabase.from('articles').insert({...row,slug:slugify(snapshot.title)+'-'+Date.now().toString().slice(-6)}).select('id').single();if(error)throw error;id=data.id;draftIdRef.current=id;setAutoDraftId(id);}
   if(!id)throw new Error('ID draft tidak tersedia setelah penyimpanan.');
   await syncTags(id,snapshot.tags);
   setAutoMessage('Draft tersimpan otomatis pukul '+new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}));
   return true;
  }catch(e:any){setAutoMessage('Draft otomatis belum tersimpan: '+(e?.message||'periksa koneksi'));return false;}
  finally{autoBusy.current=false;if(autoPending.current){autoPending.current=false;window.setTimeout(()=>void saveAuto(latest.current),500);}}
 }
 useEffect(()=>{if(title.trim().length<3)return;const timer=window.setTimeout(()=>void saveAuto(latest.current),1200);return()=>window.clearTimeout(timer)},[title,excerpt,content,category,image,source,sourceUrl,selectedTags]);

 async function save(status:'draft'|'in_review'|'scheduled'){
  if(!supabase)return;if(!title.trim()){setMessage('Judul berita wajib diisi.');return}
  if(status==='scheduled'&&(!publishers.includes(role)||!scheduled||new Date(scheduled).getTime()<=Date.now())){setMessage('Pilih waktu publikasi di masa depan.');return}
  setBusy(true);setMessage('');
  const{data:{user}}=await supabase.auth.getUser();if(!user){setMessage('Sesi login berakhir. Silakan masuk kembali.');setBusy(false);router.push('/admin/login');return}
  while(autoBusy.current)await new Promise(r=>window.setTimeout(r,100));
  const draftSaved=await saveAuto(latest.current);while(autoBusy.current)await new Promise(r=>window.setTimeout(r,100));
  const id=draftIdRef.current;
  if(!draftSaved||!id){setMessage('Draft belum dapat disimpan. Periksa koneksi lalu coba lagi.');setBusy(false);return}
  finalizing.current=true;
  const{error}=await supabase.from('articles').update({status,scheduled_at:status==='scheduled'?new Date(scheduled).toISOString():null,published_at:null}).eq('id',id);
  setBusy(false);if(error){finalizing.current=false;setMessage('Gagal menyimpan berita: '+error.message);return}router.push('/admin/berita');
 }
 return <div style={{maxWidth:1000}}>
  <div className="eyebrow">Redaksi / Berita</div><h1>Tulis berita baru</h1>
  <label>Judul berita</label><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Masukkan judul berita" style={input}/>
  <label>Ringkasan berita</label><textarea value={excerpt} onChange={e=>setExcerpt(e.target.value)} rows={3} style={input}/>
  <label>Kategori</label><select value={category} onChange={e=>setCategory(e.target.value)} style={input}><option value="">Pilih kategori</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
  <label>Tag berita</label><div style={tagBox}>{tags.length?tags.map(t=><label key={t.id} style={tagLabel}><input type="checkbox" checked={selectedTags.includes(t.id)} onChange={e=>setSelectedTags(v=>e.target.checked?[...v,t.id]:v.filter(x=>x!==t.id))}/>{t.name}</label>):<span className="muted">Belum ada tag. Tambahkan melalui menu Tag Berita.</span>}</div>
  <label>URL gambar utama (unggah melalui menu Media)</label><input value={image} onChange={e=>setImage(e.target.value)} placeholder="https://…" style={input}/>
  <label>Sumber berita (opsional)</label><input value={source} onChange={e=>setSource(e.target.value)} placeholder="Nama sumber" style={input}/>
  <label>URL sumber (opsional)</label><input value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)} placeholder="https://…" style={input}/>
  <label>Isi berita</label><div style={{marginTop:8}}><ArticleEditor value={content} onChange={setContent}/></div>
  <p aria-live="polite" style={{fontSize:13,color:'#64748b',marginTop:12}}>◉ {autoMessage}</p>
  {publishers.includes(role)&&<div style={{background:'white',padding:15,border:'1px solid #eee',borderRadius:8,marginTop:18}}><b>Jadwalkan publikasi</b><input type="datetime-local" min={localInput(new Date(Date.now()+60000))} value={scheduled} onChange={e=>setScheduled(e.target.value)} style={input}/></div>}
  {message&&<p role="status" style={{color:'#b91c1c'}}>{message}</p>}
  <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:20}}>
   <button disabled={busy||!title.trim()} onClick={()=>save('draft')} style={button}>{busy?'Menyimpan…':'Simpan draft'}</button>
   <button disabled={busy||!title.trim()} onClick={()=>save('in_review')} style={{...button,background:'#c91f2c',color:'white'}}>Kirim untuk review</button>
   {publishers.includes(role)&&<button disabled={busy||!title.trim()||!scheduled} onClick={()=>save('scheduled')} style={{...button,background:'#171717',color:'white'}}>Jadwalkan</button>}
  </div>
 </div>;
}
const input:React.CSSProperties={display:'block',width:'100%',padding:12,border:'1px solid #ddd',borderRadius:7,margin:'7px 0 18px'};
const button:React.CSSProperties={padding:'12px 18px',border:'1px solid #ddd',borderRadius:7,fontWeight:800,cursor:'pointer'};
const tagBox:React.CSSProperties={display:'flex',gap:12,flexWrap:'wrap',padding:12,border:'1px solid #ddd',borderRadius:7,margin:'7px 0 18px'};
const tagLabel:React.CSSProperties={display:'inline-flex',alignItems:'center',gap:6,fontSize:14};
