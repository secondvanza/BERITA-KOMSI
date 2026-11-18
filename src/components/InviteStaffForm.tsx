'use client';
import {useState} from 'react';
import {supabase} from '@/lib/supabase';

export default function InviteStaffForm({onDone}:{onDone:()=>void}){
 const[email,setEmail]=useState('');
 const[name,setName]=useState('');
 const[role,setRole]=useState('journalist');
 const[password,setPassword]=useState('');
 const[showPassword,setShowPassword]=useState(false);
 const[msg,setMsg]=useState('');
 const[busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){
  e.preventDefault();
  if(!supabase){setMsg('Koneksi Supabase belum tersedia.');return}
  if(password.length<8||password.length>72){setMsg('Password awal harus 8–72 karakter.');return}
  setBusy(true);setMsg('');
  try{
   const{data,error}=await supabase.functions.invoke('invite-staff',{body:{email:email.trim().toLowerCase(),full_name:name.trim(),role,password}});
   if(error){
    let detail=error.message;
    const response=(error as any).context;
    if(response&&typeof response.clone==='function'){
     const payload=await response.clone().json().catch(()=>null);
     if(payload?.error)detail=String(payload.error);
     else if(payload?.message)detail=String(payload.message);
    }
    setMsg(detail||'Undangan gagal diproses.');return;
   }
   if(data?.error){setMsg(String(data.error));return}
   setMsg(data?.message||'Undangan diproses.');
   if(data?.ok){setEmail('');setName('');setPassword('');setRole('journalist');onDone()}
  }catch(error){
   setMsg(error instanceof Error?error.message:'Koneksi gagal. Periksa internet lalu coba lagi.');
  }finally{setBusy(false)}
 }
 return <form onSubmit={submit} style={{background:'white',border:'1px solid #eee',padding:18,borderRadius:10,margin:'20px 0'}}>
  <h3>Undang anggota redaksi</h3>
  <input required type="text" maxLength={100} placeholder="Nama lengkap" value={name} onChange={e=>setName(e.target.value)} style={field}/>
  <input required type="email" placeholder="Email anggota" value={email} onChange={e=>setEmail(e.target.value)} style={field}/>
  <div style={{display:'flex',gap:8,alignItems:'stretch'}}>
   <input required type={showPassword?'text':'password'} minLength={8} maxLength={72} autoComplete="new-password" placeholder="Password awal (minimal 8 karakter)" value={password} onChange={e=>setPassword(e.target.value)} style={{...field,flex:1,minWidth:0}}/>
   <button type="button" onClick={()=>setShowPassword(v=>!v)} style={{padding:'0 12px',border:'1px solid #ddd',borderRadius:6,background:'#fff',margin:'8px 0'}}>{showPassword?'Sembunyikan':'Lihat'}</button>
  </div>
  <small className="muted">Password ini menjadi password awal anggota. Berikan secara pribadi kepada anggota dan minta diganti setelah login.</small>
  <select value={role} onChange={e=>setRole(e.target.value)} style={field}><option value="journalist">Jurnalis</option><option value="editor">Editor</option><option value="editor_in_chief">Pemimpin redaksi</option></select>
  <button disabled={busy} style={button}>{busy?'Mengirim…':'Kirim undangan email'}</button>
  {msg&&<p role="status" className="muted">{msg}</p>}
 </form>
}
const field:React.CSSProperties={display:'block',width:'100%',padding:11,border:'1px solid #ddd',borderRadius:6,margin:'8px 0'};
const button:React.CSSProperties={background:'#c91f2c',color:'white',padding:11,border:0,borderRadius:6};
