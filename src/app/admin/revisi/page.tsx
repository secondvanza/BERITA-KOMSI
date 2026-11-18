'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {supabase} from '@/lib/supabase';

const canRestore=['super_admin','admin','editor','editor_in_chief'];
export default function Revisions(){
 const[rows,setRows]=useState<any[]>([]);
 const[role,setRole]=useState('');
 const[loading,setLoading]=useState(true);
 const[busy,setBusy]=useState<string|null>(null);
 const[msg,setMsg]=useState('');
 const[selected,setSelected]=useState<any|null>(null);
 async function load(){
  if(!supabase){setLoading(false);return}
  const{data:{user}}=await supabase.auth.getUser();
  if(!user){setLoading(false);return}
  const[{data:profile},{data,error}]=await Promise.all([
   supabase.from('profiles').select('role').eq('id',user.id).maybeSingle(),
   supabase.from('revisions').select('id,article_id,editor_id,title,content,note,created_at,articles(title),profiles(full_name)').order('created_at',{ascending:false}).limit(100)
  ]);
  setRole(profile?.role||'');
  if(error)setMsg('Gagal memuat riwayat: '+error.message);
  setRows(data||[]);setLoading(false);
 }
 useEffect(()=>{load()},[]);
 async function restore(revision:any){
  if(!supabase||!canRestore.includes(role)||busy)return;
  if(!window.confirm('Pulihkan versi “'+revision.title+'”? Isi berita saat ini akan disimpan dahulu sebagai revisi baru.'))return;
  setBusy(revision.id);setMsg('');
  const{data:{user}}=await supabase.auth.getUser();
  if(!user){setMsg('Sesi login berakhir.');setBusy(null);return}
  const{data:current,error:readError}=await supabase.from('articles').select('title,content').eq('id',revision.article_id).maybeSingle();
  if(readError||!current){setMsg('Berita asal tidak ditemukan atau tidak dapat diakses.');setBusy(null);return}
  const{error:snapshotError}=await supabase.from('revisions').insert({article_id:revision.article_id,editor_id:user.id,title:current.title,content:current.content,note:'Snapshot otomatis sebelum pemulihan revisi'});
  if(snapshotError){setMsg('Tidak dapat menyimpan snapshot saat ini: '+snapshotError.message);setBusy(null);return}
  const{error:updateError}=await supabase.from('articles').update({title:revision.title,content:revision.content}).eq('id',revision.article_id);
  if(updateError){setMsg('Gagal memulihkan revisi: '+updateError.message);setBusy(null);return}
  await supabase.from('activity_logs').insert({actor_id:user.id,action:'article_revision_restored',entity_type:'article',entity_id:revision.article_id,details:{revision_id:revision.id}});
  setMsg('Versi berita berhasil dipulihkan. Status publikasi tidak diubah.');
  setBusy(null);setSelected(null);await load();
 }
 return <><div className="eyebrow">Riwayat redaksi</div><h1>Riwayat Revisi</h1>
  {msg&&<p role="status">{msg}</p>}
  <div style={panel}>
   {loading&&<p className="muted">Memuat riwayat…</p>}
   {!loading&&!rows.length&&<p className="muted">Belum ada riwayat revisi.</p>}
   {rows.map(r=><article key={r.id} style={{padding:14,borderBottom:'1px solid #eee'}}>
    <b>{r.title}</b><p className="muted">{r.articles?.title||r.articles?.[0]?.title||'Berita dihapus'} · {r.profiles?.full_name||r.profiles?.[0]?.full_name||'Redaksi'} · {new Date(r.created_at).toLocaleString('id-ID')}</p>
    <small>{r.note||'Snapshot revisi'}</small>
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:9}}>
     <button type="button" onClick={()=>setSelected(selected?.id===r.id?null:r)}>{selected?.id===r.id?'Tutup pratinjau':'Pratinjau versi'}</button>
     {canRestore.includes(role)&&<button type="button" disabled={!!busy} onClick={()=>restore(r)}>{busy===r.id?'Memulihkan…':'Pulihkan versi ini'}</button>}
     <Link href={'/admin/berita/'+r.article_id+'/edit'}>Buka berita</Link>
    </div>
    {selected?.id===r.id&&<div style={{marginTop:12,padding:14,background:'#fafafa',borderRadius:7}}>
     <b>Pratinjau isi versi tersimpan</b>
     <div style={{whiteSpace:'pre-wrap',maxHeight:280,overflow:'auto',marginTop:8}}>{extractText(r.content)||'Versi ini tidak memiliki teks.'}</div>
    </div>}
   </article>)}
  </div>
 </>;
}
function extractText(node:any):string{
 if(!node)return '';
 if(typeof node==='string')return node;
 if(Array.isArray(node))return node.map(extractText).join('\n');
 if(node.type==='text')return node.text||'';
 return extractText(node.content);
}
const panel:React.CSSProperties={background:'white',border:'1px solid #eee',borderRadius:10};
