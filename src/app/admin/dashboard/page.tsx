'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {supabase} from '@/lib/supabase';
import {Newspaper,Eye,Clock3,Plus,CalendarDays,MessageSquare} from 'lucide-react';

type Stats={articles:number;published:number;review:number;views:number;viewsWeek:number;events:number;comments:number};
export default function Dashboard(){
 const router=useRouter();
 const[stats,setStats]=useState<Stats>({articles:0,published:0,review:0,views:0,viewsWeek:0,events:0,comments:0});
 const[recent,setRecent]=useState<any[]>([]);
 const[name,setName]=useState('Redaksi KOMSI');const[role,setRole]=useState('');
 const[msg,setMsg]=useState('');
 const[loading,setLoading]=useState(true);
 useEffect(()=>{
  let active=true;
  (async()=>{
   if(!supabase){router.replace('/admin/login');return}
   const{data:{user}}=await supabase.auth.getUser();
   if(!user){router.replace('/admin/login');return}
   const{data:profile,error:profileError}=await supabase.from('profiles').select('full_name,is_active').eq('id',user.id).maybeSingle();
   if(profileError||!profile?.is_active){await supabase.auth.signOut();router.replace('/admin/login');return}
   if(!active)return;
   setName(profile.full_name||user.email||'Redaksi');setRole(profile.role||'');
   const weekStart=new Date(Date.now()-7*24*60*60*1000).toISOString();
   const[a,b,c,d,e,f,g]=await Promise.all([
    supabase.from('articles').select('*',{count:'exact',head:true}),
    supabase.from('articles').select('*',{count:'exact',head:true}).eq('status','published'),
    supabase.from('articles').select('*',{count:'exact',head:true}).eq('status','in_review'),
    supabase.from('article_views').select('*',{count:'exact',head:true}),
    supabase.from('events').select('*',{count:'exact',head:true}),
    supabase.from('comments').select('*',{count:'exact',head:true}).eq('status','pending'),
    supabase.from('article_views').select('*',{count:'exact',head:true}).gte('viewed_at',weekStart)
   ]);
   if(!active)return;
   if([a,b,c,d,e,f,g].some(x=>x.error))setMsg('Sebagian data statistik gagal dimuat. Periksa izin database atau muat ulang halaman.');
   setStats({articles:a.count||0,published:b.count||0,review:c.count||0,views:d.count||0,viewsWeek:g.count||0,events:e.count||0,comments:f.count||0});
   const{data,error}=await supabase.from('articles').select('id,title,status,created_at').order('created_at',{ascending:false}).limit(7);
   if(!active)return;
   if(error)setMsg('Gagal memuat berita terbaru: '+error.message);
   setRecent(data||[]);
   setLoading(false);
  })();
  return()=>{active=false};
 },[router]);
 const cards=[
  ['Total berita',stats.articles,Newspaper],
  ['Berita terbit',stats.published,Eye],
  ['Menunggu review',stats.review,Clock3],
  ['Total pembacaan',stats.views,Eye],
  ['Pembacaan 7 hari',stats.viewsWeek,Eye],
  ['Agenda',stats.events,CalendarDays],
  ['Komentar pending',stats.comments,MessageSquare]
 ] as const;
 return <>
  <div className="eyebrow">Ringkasan redaksi</div>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:15,flexWrap:'wrap'}}>
   <div><h1 style={{fontSize:30,margin:'5px 0'}}>Dashboard</h1><p className="muted">Selamat datang, {name}.</p></div>
   <Link href="/admin/berita/tambah" style={{background:'#c91f2c',color:'white',padding:'12px 16px',borderRadius:7,fontWeight:800,fontSize:13}}><Plus size={16} style={{verticalAlign:'middle',marginRight:6}}/>Tulis berita</Link>
  </div>
  {msg&&<p role="status" style={{color:'#b45309',marginTop:16}}>{msg}</p>}
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:15,marginTop:28}}>
   {cards.filter(([label])=>role!=='journalist'||!['Agenda','Komentar pending'].includes(label)).map(([label,value,Icon])=><div key={label} style={stat}><Icon color="#c91f2c"/><div className="muted" style={{fontSize:13,marginTop:12}}>{label}</div><strong style={{fontSize:30}}>{loading?'—':value}</strong></div>)}
  </div>
  <section style={{background:'white',border:'1px solid #eee',borderRadius:12,padding:22,marginTop:26}}>
   <h2 style={{fontSize:19}}>Berita terbaru</h2>
   {loading?<p className="muted">Memuat data…</p>:recent.length?recent.map(a=><div key={a.id} style={{display:'flex',justifyContent:'space-between',gap:12,padding:'14px 0',borderTop:'1px solid #eee'}}><div><b>{a.title}</b><div className="muted" style={{fontSize:12,marginTop:5}}>{new Date(a.created_at).toLocaleString('id-ID')}</div></div><span className="eyebrow">{a.status}</span></div>):<p className="muted">Belum ada berita. Mulai dengan membuat berita pertama.</p>}
  </section>
 </>;
}
const stat:React.CSSProperties={background:'white',border:'1px solid #eee',borderRadius:12,padding:20};