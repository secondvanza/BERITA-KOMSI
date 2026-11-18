'use client';
import {useState} from 'react';
export default function NewsletterForm(){
 const[email,setEmail]=useState('');
 const[msg,setMsg]=useState('');
 const[busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){
  e.preventDefault();
  if(busy)return;
  setBusy(true);setMsg('');
  try{
   const response=await fetch('/api/newsletter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email.trim()})});
   const data=await response.json().catch(()=>({}));
   if(!response.ok||!data.ok){setMsg(data.error||'Pendaftaran belum dapat diproses.');return}
   setMsg('Terima kasih sudah berlangganan.');
   setEmail('');
  }catch{
   setMsg('Koneksi gagal. Periksa internet lalu coba kembali.');
  }finally{setBusy(false)}
 }
 return <form onSubmit={submit} style={{display:'flex',gap:8,flexWrap:'wrap'}}>
  <input type="email" required placeholder="Alamat email" value={email} onChange={e=>setEmail(e.target.value)} style={{padding:11,borderRadius:6,border:'1px solid #ddd',flex:1,minWidth:180}}/>
  <button type="submit" disabled={busy} style={{background:'#c91f2c',color:'white',border:0,padding:'11px 15px',borderRadius:6}}>{busy?'Mengirim…':'Berlangganan'}</button>
  {msg&&<small role="status" style={{width:'100%'}}>{msg}</small>}
 </form>;
}
