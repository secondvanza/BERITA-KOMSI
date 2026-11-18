'use client';
import {useState} from 'react';
import {supabase} from '@/lib/supabase';
export default function CommentForm({articleId}:{articleId:string}){
 const[name,setName]=useState('');
 const[email,setEmail]=useState('');
 const[body,setBody]=useState('');
 const[msg,setMsg]=useState('');
 const[busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){
  e.preventDefault();
  if(busy)return;
  if(!supabase){setMsg('Layanan komentar belum tersedia.');return}
  const cleanName=name.trim(),cleanBody=body.trim(),cleanEmail=email.trim();
  if(!cleanName||cleanBody.length<3||cleanBody.length>1500){setMsg('Nama dan komentar wajib diisi. Komentar maksimal 1.500 karakter.');return}
  setBusy(true);setMsg('');
  try{
   const{error}=await supabase.from('comments').insert({article_id:articleId,name:cleanName,email:cleanEmail||null,body:cleanBody,status:'pending'});
   if(error){setMsg('Komentar belum dapat dikirim. Silakan coba lagi.');return}
   setName('');setEmail('');setBody('');setMsg('Terima kasih. Komentar menunggu moderasi redaksi.');
  }catch{
   setMsg('Koneksi gagal. Periksa internet lalu coba kembali.');
  }finally{setBusy(false)}
 }
 return <form onSubmit={submit} style={{background:'white',border:'1px solid #eee',padding:20,borderRadius:10,marginTop:35}}>
  <h3>Tinggalkan komentar</h3>
  <input required maxLength={100} placeholder="Nama" value={name} onChange={e=>setName(e.target.value)} style={field}/>
  <input type="email" maxLength={254} placeholder="Email (opsional)" value={email} onChange={e=>setEmail(e.target.value)} style={field}/>
  <textarea required minLength={3} maxLength={1500} placeholder="Tulis komentar…" value={body} onChange={e=>setBody(e.target.value)} rows={4} style={field}/>
  <button type="submit" disabled={busy} style={button}>{busy?'Mengirim…':'Kirim komentar'}</button>
  {msg&&<p role="status" className="muted">{msg}</p>}
 </form>;
}
const field:React.CSSProperties={display:'block',width:'100%',padding:12,border:'1px solid #ddd',borderRadius:6,margin:'9px 0'};
const button:React.CSSProperties={background:'#c91f2c',color:'white',padding:'11px 16px',border:0,borderRadius:6};
