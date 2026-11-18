'use client';
import {useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
import {Upload,Trash2,Copy} from 'lucide-react';

const MAX_FILE_SIZE=10*1024*1024;
const ALLOWED_TYPES=['image/png','image/jpeg','image/webp','image/gif'];

export default function Media(){
 const[rows,setRows]=useState<any[]>([]);
 const[file,setFile]=useState<File|null>(null);
 const[busy,setBusy]=useState(false);
 const[msg,setMsg]=useState('');
 const[role,setRole]=useState('');
 async function load(){
  if(!supabase)return;
  const[{data,error},{data:{user}}]=await Promise.all([
   supabase.from('media').select('*').order('created_at',{ascending:false}),
   supabase.auth.getUser()
  ]);
  if(error)setMsg('Gagal memuat pustaka media: '+error.message);
  else setRows(data||[]);
  if(user){
   const{data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle();
   setRole(profile?.role||'');
  }
 }
 useEffect(()=>{load()},[]);
 async function upload(){
  if(!file||!supabase)return;
  if(!ALLOWED_TYPES.includes(file.type)){setMsg('Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF.');return}
  if(file.size>MAX_FILE_SIZE){setMsg('Ukuran file maksimal 10 MB.');return}
  setBusy(true);setMsg('');
  const{data:{user}}=await supabase.auth.getUser();
  if(!user){setMsg('Sesi login berakhir. Silakan masuk kembali.');setBusy(false);return}
  const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'-').slice(-120);
  const path=user.id+'/'+Date.now()+'-'+safeName;
  const{error:uploadError}=await supabase.storage.from('komsi-media').upload(path,file,{upsert:false,contentType:file.type});
  if(uploadError){setMsg('Upload gagal: '+uploadError.message);setBusy(false);return}
  const result=await supabase.from('media').insert({uploaded_by:user.id,file_path:path,file_name:file.name,mime_type:file.type,size_bytes:file.size}).select().single();
  if(result.error){
   await supabase.storage.from('komsi-media').remove([path]);
   setMsg('Metadata media gagal disimpan: '+result.error.message);
  }else{
   setMsg('File berhasil diunggah dan siap digunakan.');
   setFile(null);
   await load();
  }
  setBusy(false);
 }
 async function setAsLogo(m:any){
  if(!supabase||!['admin','super_admin'].includes(role)){setMsg('Hanya admin yang dapat mengganti logo website.');return}
  const url=supabase.storage.from('komsi-media').getPublicUrl(m.file_path).data.publicUrl;
  const{error}=await supabase.from('site_settings').upsert({key:'logo_url',value:JSON.stringify(url)});
  setMsg(error?.message||'Logo KOMSI berhasil diterapkan pada website.');
 }
 async function copyUrl(m:any){
  if(!supabase)return;
  const url=supabase.storage.from('komsi-media').getPublicUrl(m.file_path).data.publicUrl;
  try{await navigator.clipboard.writeText(url);setMsg('URL media berhasil disalin.')}
  catch{setMsg('Browser tidak mengizinkan penyalinan otomatis. Buka gambar untuk menyalin URL.')}
 }
 async function remove(m:any){
  if(!supabase||!['admin','super_admin'].includes(role)){setMsg('Hanya admin yang dapat menghapus file media.');return}
  if(!confirm('Hapus file media ini?'))return;
  const{error:storageError}=await supabase.storage.from('komsi-media').remove([m.file_path]);
  if(storageError){setMsg('File tidak dapat dihapus: '+storageError.message);return}
  const{error}=await supabase.from('media').delete().eq('id',m.id);
  if(error){setMsg('File terhapus, tetapi metadata gagal dihapus: '+error.message);return}
  setMsg('Media berhasil dihapus.');
  await load();
 }
 const isAdmin=['admin','super_admin'].includes(role);
 return <>
  <div className="eyebrow">Pustaka konten</div><h1>Media Library</h1>
  <p className="muted">Kelola foto dan gambar untuk publikasi KOMSI. Maksimal 10 MB per file.</p>
  <div style={panel}>
   <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>setFile(e.target.files?.[0]||null)}/>
   <button disabled={!file||busy} onClick={upload} style={primary}><Upload size={16}/> {busy?'Mengunggah…':'Upload media'}</button>
   {msg&&<p role="status" style={{fontSize:13,overflowWrap:'anywhere'}}>{msg}</p>}
  </div>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:14,marginTop:20}}>
   {rows.map(m=><article key={m.id} style={panel}>
    <img src={supabase!.storage.from('komsi-media').getPublicUrl(m.file_path).data.publicUrl} alt={m.alt_text||m.file_name} style={{width:'100%',height:125,objectFit:'cover',borderRadius:6}}/>
    <p style={{fontSize:12,overflowWrap:'anywhere'}}>{m.file_name}</p>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
     <button title="Salin URL" onClick={()=>copyUrl(m)}><Copy size={15}/></button>
     {isAdmin&&<button title="Jadikan logo website" onClick={()=>setAsLogo(m)} style={{fontSize:11,fontWeight:700}}>Jadikan logo</button>}
     {isAdmin&&<button title="Hapus" onClick={()=>remove(m)} style={{color:'#c91f2c'}}><Trash2 size={15}/></button>}
    </div>
   </article>)}
  </div>
 </>;
}
const panel:React.CSSProperties={background:'white',border:'1px solid #eee',borderRadius:10,padding:16};
const primary:React.CSSProperties={background:'#c91f2c',color:'white',border:0,padding:10,borderRadius:7,marginLeft:10};