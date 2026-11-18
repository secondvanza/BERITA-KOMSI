'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {supabase} from '@/lib/supabase';

export default function Login(){
 const[email,setEmail]=useState('');
 const[password,setPassword]=useState('');
 const[error,setError]=useState('');
 const[notice,setNotice]=useState('');
 const[busy,setBusy]=useState(false);
 const[recover,setRecover]=useState(false);
 const router=useRouter();

 async function submit(e:React.FormEvent){
  e.preventDefault();
  if(!supabase){setError('Konfigurasi Supabase belum dipasang.');return}
  setBusy(true);setError('');setNotice('');
  if(recover){
   const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/admin/reset-password`});
   setBusy(false);
   if(error)setError(error.message);
   else setNotice('Jika email terdaftar, tautan pemulihan kata sandi akan dikirim. Periksa kotak masuk dan folder spam.');
   return;
  }
  const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
  setBusy(false);
  if(error){setError(error.message==='Invalid login credentials'?'Email atau kata sandi tidak sesuai. Periksa kembali atau gunakan Lupa Password.':error.message);return}
  router.replace('/admin/dashboard');
 }
 return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:20,background:'linear-gradient(135deg,#171717,#2a1114)'}}>
  <form onSubmit={submit} style={{background:'white',padding:34,borderRadius:16,width:'min(430px,100%)',boxShadow:'0 24px 80px #0005'}}>
   <div className="eyebrow">Ruang redaksi</div>
   <h1 style={{fontSize:30,margin:'8px 0'}}>KOMSI <span style={{color:'#c91f2c'}}>ADMIN</span></h1>
   <p className="muted">{recover?'Masukkan email akun redaksi untuk menerima tautan pemulihan.':'Masuk untuk mengelola portal berita KOMSI.'}</p>
   <label style={label}>Email</label>
   <input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} style={field}/>
   {!recover&&<><label style={{...label,marginTop:15}}>Password</label><input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} style={field}/></>}
   {error&&<p role="alert" style={{color:'#b91c1c',fontSize:13}}>{error}</p>}
   {notice&&<p role="status" style={{color:'#166534',fontSize:13,lineHeight:1.6}}>{notice}</p>}
   <button disabled={busy} style={{...field,background:'#c91f2c',color:'white',fontWeight:800,border:0,marginTop:22,cursor:'pointer'}}>{busy?'Memproses…':recover?'Kirim tautan pemulihan':'Masuk ke dashboard'}</button>
   <button type="button" onClick={()=>{setRecover(v=>!v);setError('');setNotice('')}} style={{marginTop:14,background:'none',border:0,color:'#c91f2c',fontWeight:700,cursor:'pointer'}}>{recover?'Kembali ke halaman login':'Lupa password?'}</button>
  </form>
 </main>;
}
const label:React.CSSProperties={display:'block',fontSize:13,fontWeight:700,marginTop:22};
const field:React.CSSProperties={width:'100%',padding:13,border:'1px solid #ddd',borderRadius:7,marginTop:7};
