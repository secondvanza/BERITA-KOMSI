'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useParams,useRouter} from 'next/navigation';
import ArticleEditor from '@/components/ArticleEditor';
import {supabase} from '@/lib/supabase';

const allStatuses=['draft','in_review','revision','scheduled','published','archived'];
const localDate=(value:string|null)=>{if(!value)return '';const d=new Date(value);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)};
const publishers=['super_admin','admin','editor','editor_in_chief'];
const journalistStatuses=['draft','in_review','revision'];
export default function EditArticle(){
 const{id}=useParams<{id:string}>();
 const router=useRouter();
 const[title,setTitle]=useState('');
 const[excerpt,setExcerpt]=useState('');
 const[content,setContent]=useState<any>(null);
 const[category,setCategory]=useState('');
 const[image,setImage]=useState('');
 const[status,setStatus]=useState('draft');
 const[scheduledAt,setScheduledAt]=useState('');
 const[publishedAt,setPublishedAt]=useState<string|null>(null);
 const[categories,setCategories]=useState<any[]>([]);
 const[role,setRole]=useState('');
 const[authorId,setAuthorId]=useState('');
 const[msg,setMsg]=useState('');
 const[forbidden,setForbidden]=useState(false);
 const[loading,setLoading]=useState(true);
 const[saving,setSaving]=useState(false);

 useEffect(()=>{
  let active=true;
  (async()=>{
   if(!supabase){setMsg('Koneksi database tidak tersedia.');setLoading(false);return}
   const{data:{user}}=await supabase.auth.getUser();
   if(!user){router.replace('/admin/login');return}
   const[{data:a,error:articleError},{data:c},{data:profile}]=await Promise.all([
    supabase.from('articles').select('*').eq('id',id).maybeSingle(),
    supabase.from('categories').select('id,name').order('sort_order'),
    supabase.from('profiles').select('role').eq('id',user.id).maybeSingle()
   ]);
   if(!active)return;
   setRole(profile?.role||'');
   if(articleError||!a){setMsg('Berita tidak ditemukan atau tidak dapat diakses.');setLoading(false);return}
   setAuthorId(a.author_id||'');
   if(profile?.role==='journalist'&&a.author_id!==user.id){setForbidden(true);setMsg('Anda hanya dapat menyunting berita milik sendiri.');setLoading(false);return}
   setTitle(a.title||'');setExcerpt(a.excerpt||'');setContent(a.content);
   setCategory(a.category_id||'');setImage(a.featured_image||'');setStatus(a.status||'draft');setScheduledAt(localDate(a.scheduled_at));setPublishedAt(a.published_at||null);
   setCategories(c||[]);
   setLoading(false);
  })();
  return()=>{active=false};
 },[id,router]);

 async function save(){
  if(!supabase||forbidden||!title.trim())return;
  setSaving(true);setMsg('');
  const{data:{user}}=await supabase.auth.getUser();
  if(!user){setMsg('Sesi login berakhir. Silakan masuk kembali.');setSaving(false);return}
  if(role==='journalist'&&authorId!==user.id){setMsg('Anda hanya dapat menyunting berita milik sendiri.');setForbidden(true);setSaving(false);return}
  const{data:previous,error:previousError}=await supabase.from('articles').select('title,content').eq('id',id).single();
  if(previousError||!previous){setMsg('Gagal mengambil versi berita sebelumnya: '+(previousError?.message||'data tidak ditemukan'));setSaving(false);return}
  const{error:revisionError}=await supabase.from('revisions').insert({article_id:id,editor_id:user.id,title:previous.title,content:previous.content,note:'Snapshot otomatis sebelum penyuntingan'});
  if(revisionError){setMsg('Gagal membuat riwayat revisi: '+revisionError.message);setSaving(false);return}
  const publishFields=status==='scheduled'?{scheduled_at:new Date(scheduledAt).toISOString(),published_at:null}:status==='published'?{scheduled_at:null,published_at:publishedAt||new Date().toISOString()}:{scheduled_at:null,published_at:null};
  const{error}=await supabase.from('articles').update({title:title.trim(),excerpt,content,category_id:category||null,featured_image:image||null,status,...publishFields}).eq('id',id);
  if(error){setMsg('Gagal menyimpan berita: '+error.message);setSaving(false);return}
  await supabase.from('activity_logs').insert({actor_id:user.id,action:'article_updated',entity_type:'article',entity_id:id,details:{title}});
  router.push('/admin/berita');
 }

 if(loading)return <p className="muted">Memuat berita…</p>;
 if(forbidden)return <><h1>Akses dibatasi</h1><p>{msg}</p><Link href="/admin/berita">Kembali ke daftar berita</Link></>;
 return <>
  <div className="eyebrow">Manajemen konten / Edit</div><h1>Edit Berita</h1>
  <label>Judul</label><input value={title} onChange={e=>setTitle(e.target.value)} style={field}/>
  <label>Ringkasan</label><textarea value={excerpt} onChange={e=>setExcerpt(e.target.value)} rows={3} style={field}/>
  <label>Kategori</label><select value={category} onChange={e=>setCategory(e.target.value)} style={field}><option value="">Pilih kategori</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
  <label>URL gambar utama</label><input value={image} onChange={e=>setImage(e.target.value)} style={field}/>
  <label>Status</label><select value={status} onChange={e=>setStatus(e.target.value)} style={field}>{(role==='journalist'?journalistStatuses:allStatuses).map(s=><option key={s} value={s}>{s}</option>)}</select>
  <label>Isi berita</label>{status==='scheduled'&&publishers.includes(role)&&<><label>Waktu publikasi</label><input type='datetime-local' min={new Date(Date.now()+60000).toISOString().slice(0,16)} value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)} style={field}/></>}<ArticleEditor value={content} onChange={setContent}/>
  {msg&&<p role="status">{msg}</p>}
  <button disabled={saving||!title.trim()} onClick={save} style={primary}>{saving?'Menyimpan…':'Simpan perubahan'}</button>
 </>;
}
const field:React.CSSProperties={display:'block',width:'100%',padding:12,border:'1px solid #ddd',borderRadius:7,margin:'7px 0 18px'};
const primary:React.CSSProperties={background:'#c91f2c',color:'white',padding:12,border:0,borderRadius:7,marginTop:18};