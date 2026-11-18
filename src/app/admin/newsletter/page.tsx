'use client';
import {useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
export default function Newsletter(){
 const[rows,setRows]=useState<any[]>([]);const[loading,setLoading]=useState(true);const[msg,setMsg]=useState('');
 async function load(){if(!supabase){setMsg('Koneksi database tidak tersedia.');setLoading(false);return}const{data,error}=await supabase.from('newsletter_subscribers').select('*').order('created_at',{ascending:false}).limit(500);if(error)setMsg('Gagal memuat pelanggan newsletter: '+error.message);else{setRows(data||[]);setMsg('')}setLoading(false)}
 useEffect(()=>{void load()},[]);
 async function del(id:string){if(!supabase||!confirm('Hapus pelanggan newsletter?'))return;const{error}=await supabase.from('newsletter_subscribers').delete().eq('id',id);if(error)setMsg('Gagal menghapus pelanggan: '+error.message);else setMsg('Pelanggan berhasil dihapus.');await load()}
 return <><div className="eyebrow">Pembaca</div><h1>Newsletter</h1><p className="muted">{rows.length} pelanggan ditampilkan.</p>{msg&&<p role="status" className="muted">{msg}</p>}<div style={panel}>{loading&&<p className="muted">Memuat pelanggan…</p>}{!loading&&!rows.length&&<p>Belum ada pelanggan newsletter.</p>}{rows.map(r=><div key={r.id} style={{display:'flex',justifyContent:'space-between',gap:12,padding:13,borderBottom:'1px solid #eee',flexWrap:'wrap'}}><div><b>{r.email}</b><div className="muted">{new Date(r.created_at).toLocaleDateString('id-ID')}</div></div><button onClick={()=>void del(r.id)}>Hapus</button></div>)}</div></>}
const panel:React.CSSProperties={background:'white',border:'1px solid #eee',borderRadius:10};
