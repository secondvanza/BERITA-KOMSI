'use client';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {supabase} from '@/lib/supabase';

export default function ResetPassword(){
 const[password,setPassword]=useState('');
 const[confirm,setConfirm]=useState('');
 const[ready,setReady]=useState(false);
 const[busy,setBusy]=useState(false);
 const[message,setMessage]=useState('');
 const[error,setError]=useState('');
 const router=useRouter();
 useEffect(()=>{
  if(!supabase){setError('Layanan autentikasi belum tersedia.');return}
  let alive=true;
  supabase.auth.getSession().then(({data})=>{
   if(!alive)return;
   if(data.session)setReady(true);
   else setError('Tautan pemulihan tidak valid atau sudah kedaluwarsa. Silakan minta tautan baru dari halaman login.');
  });
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
   if(session&&alive){setReady(true);setError('')}
  });
  return()=>{alive=false;subscription.unsubscribe()};
 },[]);
 async function submit(e:React.FormEvent){
  e.preventDefault();setError('');setMessage('');
  if(password.length<8){setError('Kata sandi minimal 8 karakter.');return}
  if(password!==confirm){setError('Konfirmasi kata sandi belum sama.');return}
  if(!supabase)return;
  setBusy(true);
  const {error}=await supabase.auth.updateUser({password});
  setBusy(false);
  if(error){setError(error.message);return}
  setMessage('Kata sandi berhasil diperbarui. Anda akan diarahkan ke halaman login.');
  await supabase.auth.signOut();
  setTimeout(()=>router.replace('/admin/login'),1200);
 }
 return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:20,background:'#171717'}}>
  <form onSubmit={submit} style={{background:'white',padding:32,borderRadius:15,width:'min(430px,100%)'}}>
   <div className="eyebrow">Keamanan akun</div><h1>Atur Kata Sandi Baru</h1>
   <p className="muted">Gunakan kata sandi minimal 8 karakter.</p>
   {ready&&<><label style={label}>Kata sandi baru</label><input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} style={field}/><label style={label}>Ulangi kata sandi</label><input required minLength={8} type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} style={field}/><button disabled={busy} style={{...field,background:'#c91f2c',color:'white',fontWeight:800,border:0,marginTop:22}}>{busy?'Menyimpan…':'Simpan kata sandi'}</button></>}
   {error&&<p role="alert" style={{color:'#b91c1c',fontSize:13,lineHeight:1.6}}>{error}</p>}
   {message&&<p role="status" style={{color:'#166534',fontSize:13}}>{message}</p>}
   <a href="/admin/login" style={{display:'inline-block',marginTop:16,color:'#c91f2c',fontWeight:700}}>Kembali ke login</a>
  </form>
 </main>;
}
const label:React.CSSProperties={display:'block',fontSize:13,fontWeight:700,marginTop:18};
const field:React.CSSProperties={width:'100%',padding:13,border:'1px solid #ddd',borderRadius:7,marginTop:7};
