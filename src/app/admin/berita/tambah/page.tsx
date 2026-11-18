'use client';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import ArticleEditor from '@/components/ArticleEditor';
import {supabase} from '@/lib/supabase';

const slugify=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
const publishers=['super_admin','admin','editor','editor_in_chief'];

export default function NewArticle(){
 const router=useRouter();
 const[title,setTitle]=useState('');
 const[excerpt,setExcerpt]=useState('');
 const[content,setContent]=useState<any>(null);
 const[category,setCategory]=useState('');
 const[image,setImage]=useState('');
 const[source,setSource]=useState('');
 const[sourceUrl,setSourceUrl]=useState('');
 const[scheduled,setScheduled]=useState('');
 const[categories,setCategories]=useState<any[]>([]);
 const[role,setRole]=useState('');
 const[busy,setBusy]=useState(false);
 const[message,setMessage]=useState('');

 useEffect(()=>{
  let active=true;
  (async()=>{
   if(!supabase)return;
   const[{data:{user}},{data:categoryRows}] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('categories').select('id,name').order('sort_order')
   ]);
   if(!active)return;
   setCategories(categoryRows||[]);
   if(user){
    const{data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle();
    if(active)setRole(profile?.role||'');
   }
  })();
  return()=>{active=false};
 },[]);

 async function save(status:'draft'|'in_review'|'scheduled'){
  if(!supabase)return;
  if(!title.trim()){setMessage('Judul berita wajib diisi.');return}
  if(status==='scheduled'){
   if(!publishers.includes(role)){setMessage('Hanya editor atau admin yang dapat menjadwalkan publikasi.');return}
   if(!scheduled){setMessage('Tentukan tanggal dan waktu publikasi.');return}
   if(new Date(scheduled).getTime()<=Date.now()){setMessage('Waktu publikasi harus berada di masa depan.');return}
  }
  setBusy(true);setMessage('');
  const{data:{user}}=await supabase.auth.getUser();
  if(!user){setMessage('Sesi login berakhir. Silakan masuk kembali.');setBusy(false);router.push('/admin/login');return}
  const row={
   title:title.trim(),
   slug:slugify(title)+'-'+Date.now().toString().slice(-5),
   excerpt:excerpt.trim(),
   content:content||{type:'doc',content:[]},
   category_id:category||null,
   featured_image:image.trim()||null,
   source_name:source.trim()||null,
   source_url:sourceUrl.trim()||null,
   scheduled_at:status==='scheduled'?new Date(scheduled).toISOString():null,
   published_at:null,
   author_id:user.id,
   status
  };
  const{error}=await supabase.from('articles').insert(row);
  setBusy(false);
  if(error){setMessage('Gagal menyimpan berita: '+error.message);return}
  router.push('/admin/berita');
 }

 return <div style={{maxWidth:1000}}>
  <div className="eyebrow">Redaksi / Berita</div><h1>Tulis berita baru</h1>
  <label>Judul berita</label><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Masukkan judul berita" style={input}/>
  <label>Ringkasan berita</label><textarea value={excerpt} onChange={e=>setExcerpt(e.target.value)} rows={3} style={input}/>
  <label>Kategori</label><select value={category} onChange={e=>setCategory(e.target.value)} style={input}><option value="">Pilih kategori</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
  <label>URL gambar utama (unggah melalui menu Media)</label><input value={image} onChange={e=>setImage(e.target.value)} placeholder="https://…" style={input}/>
  <label>Sumber berita (opsional)</label><input value={source} onChange={e=>setSource(e.target.value)} placeholder="Nama sumber" style={input}/>
  <label>URL sumber (opsional)</label><input value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)} placeholder="https://…" style={input}/>
  <label>Isi berita</label><div style={{marginTop:8}}><ArticleEditor value={content} onChange={setContent}/></div>
  {publishers.includes(role)&&<div style={{background:'white',padding:15,border:'1px solid #eee',borderRadius:8,marginTop:18}}><b>Jadwalkan publikasi</b><input type="datetime-local" min={new Date(Date.now()+60000).toISOString().slice(0,16)} value={scheduled} onChange={e=>setScheduled(e.target.value)} style={input}/></div>}
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