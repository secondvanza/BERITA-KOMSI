'use client';
import {useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
export default function Comments(){
 const[rows,setRows]=useState<any[]>([]);const[loading,setLoading]=useState(true);const[busy,setBusy]=useState<string|null>(null);const[msg,setMsg]=useState('');
 async function load(){if(!supabase){setMsg('Koneksi database tidak tersedia.');setLoading(false);return}const{data,error}=await supabase.from('comments').select('*,articles(title)').order('created_at',{ascending:false}).limit(200);if(error)setMsg('Gagal memuat komentar: '+error.message);else{setRows(data||[]);setMsg('')}setLoading(false)}
 useEffect(()=>{void load()},[]);
 async function setStatus(id:string,status:'approved'|'rejected'){if(!supabase||busy)return;setBusy(id);setMsg('');const{error}=await supabase.from('comments').update({status}).eq('id',id);if(error)setMsg('Gagal memperbarui komentar: '+error.message);else setMsg('Status komentar berhasil diperbarui.');setBusy(null);await load()}
 return <><div className="eyebrow">Interaksi pembaca</div><h1>Moderasi Komentar</h1>{msg&&<p role="status" className="muted">{msg}</p>}<div style={panel}>{loading&&<p className="muted">Memuat komentar…</p>}{!loading&&!rows.length&&<p>Belum ada komentar.</p>}{rows.map(c=><article key={c.id} style={{padding:15,borderBottom:'1px solid #eee'}}><b>{c.name}</b><small className="muted"> · {c.articles?.title||c.articles?.[0]?.title||'Berita'}</small><p>{c.body}</p><span className="eyebrow">{c.status}</span>{c.status!=='approved'&&<div style={{display:'flex',gap:8,marginTop:10}}><button disabled={!!busy} onClick={()=>void setStatus(c.id,'approved')}>{busy===c.id?'Menyimpan…':'Setujui'}</button><button disabled={!!busy} onClick={()=>void setStatus(c.id,'rejected')}>Tolak</button></div>}</article>)}</div></>}
const panel:React.CSSProperties={background:'white',border:'1px solid #eee',borderRadius:10};
