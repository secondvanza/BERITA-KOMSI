'use client';
import {useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';

const localDate=(value:string|null)=>{if(!value)return '';const d=new Date(value);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)};
const slugify=(value:string)=>value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');

export default function Events(){
 const[rows,setRows]=useState<any[]>([]);
 const[title,setTitle]=useState('');
 const[location,setLocation]=useState('');
 const[date,setDate]=useState('');
 const[description,setDescription]=useState('');
 const[coverImage,setCoverImage]=useState('');
 const[imageFile,setImageFile]=useState<File|null>(null);
 const[imagePreview,setImagePreview]=useState('');
 const[editingId,setEditingId]=useState<string|null>(null);
 const[msg,setMsg]=useState('');
 const[busy,setBusy]=useState(false);

 async function load(){
  if(!supabase)return;
  const{data,error}=await supabase.from('events').select('*').order('starts_at',{ascending:true,nullsFirst:false});
  if(error)setMsg('Gagal memuat agenda: '+error.message);
  else setRows(data||[]);
 }
 useEffect(()=>{load()},[]);

 function reset(){
  setTitle('');setLocation('');setDate('');setDescription('');setCoverImage('');setImageFile(null);setImagePreview('');setEditingId(null);
 }
 function edit(event:any){
  setEditingId(event.id);setTitle(event.title||'');setLocation(event.location||'');
  setDate(localDate(event.starts_at));setDescription(event.description||'');
  setCoverImage(event.cover_image||'');setImageFile(null);setImagePreview(event.cover_image||'');
  setMsg('');
  window.scrollTo({top:0,behavior:'smooth'});
 }
 async function save(e:React.FormEvent){
  e.preventDefault();
  if(!supabase||!title.trim())return;
  setBusy(true);setMsg('');
  const{data:{user}}=await supabase.auth.getUser();
  if(!user){setMsg('Sesi login berakhir. Silakan masuk kembali.');setBusy(false);return}
  let uploadedImage=coverImage;
  if(imageFile){
   if(!imageFile.type.startsWith('image/')){setMsg('File harus berupa gambar.');setBusy(false);return}
   if(imageFile.size>5*1024*1024){setMsg('Ukuran gambar maksimal 5 MB.');setBusy(false);return}
   const ext=(imageFile.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
   const path='agenda/'+Date.now()+'-'+Math.random().toString(36).slice(2,8)+'.'+ext;
   const{error:uploadError}=await supabase.storage.from('komsi-media').upload(path,imageFile,{upsert:false,contentType:imageFile.type});
   if(uploadError){setMsg('Gagal mengunggah gambar: '+uploadError.message);setBusy(false);return}
   const{data:publicData}=supabase.storage.from('komsi-media').getPublicUrl(path);
   uploadedImage=publicData.publicUrl;
  }
  const values={title:title.trim(),location:location.trim()||null,starts_at:date?new Date(date).toISOString():null,description:description.trim()||null,cover_image:uploadedImage||null};
  const result=editingId
   ? await supabase.from('events').update(values).eq('id',editingId)
   : await supabase.from('events').insert({...values,slug:slugify(title)+'-'+Date.now().toString().slice(-5),created_by:user.id,status:'draft'});
  if(result.error)setMsg('Gagal menyimpan agenda: '+result.error.message);
  else{setMsg(editingId?'Agenda berhasil diperbarui.':'Agenda disimpan sebagai draft.');reset();await load()}
  setBusy(false);
 }
 async function changeStatus(event:any,status:'draft'|'published'|'cancelled'){
  if(!supabase)return;
  const{error}=await supabase.from('events').update({status}).eq('id',event.id);
  if(error)setMsg('Gagal mengubah status: '+error.message);
  else{setMsg('Status agenda berhasil diperbarui.');await load()}
 }
 async function remove(event:any){
  if(!supabase||!confirm('Hapus agenda “'+event.title+'” secara permanen?'))return;
  const{error}=await supabase.from('events').delete().eq('id',event.id);
  if(error)setMsg('Gagal menghapus agenda: '+error.message);
  else{setMsg('Agenda berhasil dihapus.');await load();if(editingId===event.id)reset()}
 }

 return <>
  <div className="eyebrow">Aktivitas komunitas</div><h1>Agenda Kegiatan</h1>
  <form onSubmit={save} style={panel}>
   <h3>{editingId?'Edit agenda':'Tambah agenda'}</h3>
   <input required maxLength={180} placeholder="Nama kegiatan" value={title} onChange={e=>setTitle(e.target.value)} style={field}/>
   <input maxLength={180} placeholder="Lokasi" value={location} onChange={e=>setLocation(e.target.value)} style={field}/>
   <label style={{fontSize:13}}>Tanggal dan waktu kegiatan</label>
   <input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} style={field}/>
   <label style={{display:'block',fontSize:13,marginTop:12}}>Gambar / poster agenda</label>
   <input type="file" accept="image/*" onChange={e=>{const file=e.target.files?.[0]||null;setImageFile(file);setImagePreview(file?URL.createObjectURL(file):coverImage)}} style={field}/>
   <small className="muted">Format gambar umum, maksimal 5 MB. Gambar akan tampil di sorotan, daftar agenda, dan halaman detail.</small>
   {imagePreview&&<div style={{margin:'10px 0'}}><img src={imagePreview} alt="Pratinjau gambar agenda" style={{width:'100%',maxWidth:420,maxHeight:220,objectFit:'cover',borderRadius:8}}/><button type="button" onClick={()=>{setImageFile(null);setImagePreview('');setCoverImage('')}} style={{...secondary,display:'block',marginTop:8}}>Hapus gambar</button></div>}
   <textarea maxLength={10000} placeholder="Deskripsi kegiatan" value={description} onChange={e=>setDescription(e.target.value)} style={field}/>
   <div style={{display:'flex',gap:9,flexWrap:'wrap'}}>
    <button disabled={busy||!title.trim()} style={primary}>{busy?'Menyimpan…':editingId?'Simpan perubahan':'Simpan sebagai draft'}</button>
    {editingId&&<button type="button" onClick={reset} style={secondary}>Batal edit</button>}
   </div>
   {msg&&<p role="status">{msg}</p>}
  </form>
  <div style={{...panel,marginTop:20}}>
   <h3>Daftar agenda ({rows.length})</h3>
   {!rows.length&&<p className="muted">Belum ada agenda.</p>}
   {rows.map(event=><div key={event.id} style={{padding:12,borderBottom:'1px solid #eee'}}>
    {event.cover_image&&<img src={event.cover_image} alt={event.title} style={{width:150,height:90,objectFit:'cover',borderRadius:7,display:'block',marginBottom:8}}/>}<b>{event.title}</b>
    <p className="muted">{event.location||'Lokasi belum ditentukan'} · {event.starts_at?new Date(event.starts_at).toLocaleString('id-ID'):'Jadwal menyusul'} · {event.status}</p>
    {event.description&&<p>{event.description}</p>}
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
     <button type="button" onClick={()=>edit(event)}>Edit</button>
     {event.status!=='published'&&<button type="button" onClick={()=>changeStatus(event,'published')}>Terbitkan</button>}
     {event.status==='published'&&<button type="button" onClick={()=>changeStatus(event,'draft')}>Tarik publikasi</button>}
     <button type="button" onClick={()=>changeStatus(event,'cancelled')}>Batalkan</button>
     <button type="button" onClick={()=>remove(event)} style={{color:'#c91f2c'}}>Hapus</button>
    </div>
   </div>)}
  </div>
 </>;
}
const panel:React.CSSProperties={background:'white',border:'1px solid #eee',padding:18,borderRadius:10};
const field:React.CSSProperties={display:'block',width:'100%',padding:11,border:'1px solid #ddd',borderRadius:6,margin:'9px 0'};
const primary:React.CSSProperties={background:'#c91f2c',color:'white',border:0,padding:11,borderRadius:6};
const secondary:React.CSSProperties={background:'white',border:'1px solid #ddd',padding:11,borderRadius:6};