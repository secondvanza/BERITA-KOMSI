'use client';
import {useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
import ArticleEditor from '@/components/ArticleEditor';

const slugify=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');

export default function Pages(){
 const[rows,setRows]=useState<any[]>([]);
 const[title,setTitle]=useState('');
 const[slug,setSlug]=useState('');
 const[body,setBody]=useState<any>({type:'doc',content:[{type:'paragraph',content:[]}]});
 const[msg,setMsg]=useState('');
 const[editingId,setEditingId]=useState<string|null>(null);
 const[busy,setBusy]=useState(false);

 async function load(){
  if(!supabase)return;
  const{data,error}=await supabase.from('pages').select('*').order('updated_at',{ascending:false});
  if(error)setMsg('Gagal memuat halaman: '+error.message);
  else setRows(data||[]);
 }
 useEffect(()=>{load()},[]);
 function reset(){setTitle('');setSlug('');setBody({type:'doc',content:[{type:'paragraph',content:[]}]});setEditingId(null)}
 function edit(page:any){
  setEditingId(page.id);setTitle(page.title||'');setSlug(page.slug||'');
  setBody(page.content?.type==='doc'?page.content:{type:'doc',content:(page.content?.text||'').split('\n').filter(Boolean).map((line:string)=>({type:'paragraph',content:[{type:'text',text:line}]}))});setMsg('');
  window.scrollTo({top:0,behavior:'smooth'});
 }
 async function save(e:React.FormEvent){
  e.preventDefault();
  if(!supabase||!title.trim())return;
  const finalSlug=slugify(slug||title);
  if(!finalSlug){setMsg('Slug halaman tidak valid.');return}
  setBusy(true);setMsg('');
  const values={title:title.trim(),slug:finalSlug,content:body};
  const result=editingId
   ? await supabase.from('pages').update(values).eq('id',editingId)
   : await supabase.from('pages').insert({...values,is_published:false});
  if(result.error)setMsg('Gagal menyimpan halaman: '+result.error.message);
  else{setMsg(editingId?'Halaman berhasil diperbarui.':'Halaman disimpan sebagai draft.');reset();await load()}
  setBusy(false);
 }
 async function publish(id:string,value:boolean){
  if(!supabase)return;
  const{error}=await supabase.from('pages').update({is_published:value}).eq('id',id);
  if(error)setMsg('Gagal mengubah status halaman: '+error.message);
  else{setMsg(value?'Halaman berhasil diterbitkan.':'Halaman ditarik dari publikasi.');await load()}
 }
 async function del(page:any){
  if(!supabase||!confirm('Hapus halaman “'+page.title+'” secara permanen?'))return;
  const{error}=await supabase.from('pages').delete().eq('id',page.id);
  if(error)setMsg('Gagal menghapus halaman: '+error.message);
  else{setMsg('Halaman berhasil dihapus.');await load();if(editingId===page.id)reset()}
 }

 return <>
  <div className="eyebrow">Konten statis</div><h1>Halaman Website</h1>
  <form onSubmit={save} style={panel}>
   <h3>{editingId?'Edit halaman':'Buat halaman'}</h3>
   <input required maxLength={180} placeholder="Judul halaman" value={title} onChange={e=>setTitle(e.target.value)} style={field}/>
   <input maxLength={180} placeholder="Slug URL (opsional)" value={slug} onChange={e=>setSlug(e.target.value)} style={field}/>
   <div style={{margin:'10px 0 18px'}}><ArticleEditor value={body} onChange={setBody}/></div>
   <div style={{display:'flex',gap:9,flexWrap:'wrap'}}>
    <button disabled={busy||!title.trim()} style={primary}>{busy?'Menyimpan…':editingId?'Simpan perubahan':'Simpan draft'}</button>
    {editingId&&<button type="button" onClick={reset} style={secondary}>Batal edit</button>}
   </div>
   {msg&&<p role="status">{msg}</p>}
  </form>
  <div style={{...panel,marginTop:18}}>
   <h3>Daftar halaman ({rows.length})</h3>
   {!rows.length&&<p className="muted">Belum ada halaman.</p>}
   {rows.map(page=><div key={page.id} style={{padding:13,borderBottom:'1px solid #eee',display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
    <div><b>{page.title}</b><div className="muted">/{page.slug} · {page.is_published?'Terbit':'Draft'}</div></div>
    <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
     <button type="button" onClick={()=>edit(page)}>Edit</button>
     <button type="button" onClick={()=>publish(page.id,!page.is_published)}>{page.is_published?'Tarik':'Terbitkan'}</button>
     <button type="button" onClick={()=>del(page)} style={{color:'#c91f2c'}}>Hapus</button>
    </div>
   </div>)}
  </div>
 </>;
}
const panel:React.CSSProperties={background:'white',border:'1px solid #eee',borderRadius:10,padding:16};
const field:React.CSSProperties={display:'block',width:'100%',padding:11,border:'1px solid #ddd',borderRadius:6,margin:'8px 0'};
const primary:React.CSSProperties={background:'#c91f2c',color:'white',border:0,padding:11,borderRadius:6};
const secondary:React.CSSProperties={background:'white',border:'1px solid #ddd',padding:11,borderRadius:6};