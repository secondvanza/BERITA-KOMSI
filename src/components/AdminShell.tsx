'use client';
import Link from 'next/link';
import {usePathname,useRouter} from 'next/navigation';
import {useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
import {LayoutDashboard,Newspaper,FolderOpen,Image,CalendarDays,Users,Settings,LogOut,MessageSquare} from 'lucide-react';

const nav=[['Dashboard','/admin/dashboard',LayoutDashboard],['Berita','/admin/berita',Newspaper],['Kategori','/admin/kategori',FolderOpen],['Tag','/admin/tag',FolderOpen],['Halaman','/admin/halaman',FolderOpen],['Media','/admin/media',Image],['Agenda','/admin/agenda',CalendarDays],['Komentar','/admin/komentar',MessageSquare],['Revisi','/admin/revisi',Newspaper],['Newsletter','/admin/newsletter',MessageSquare],['Pengguna','/admin/pengguna',Users],['Pengaturan','/admin/pengaturan',Settings]] as const;
const publicPaths=['/admin/login','/admin/reset-password'];
function canAccessAdminPath(role:string,path:string){
 if(['super_admin','admin'].includes(role))return true;
 if(path==='/admin/pengguna'||path==='/admin/pengaturan')return false;
 if(role==='journalist')return ['/admin/dashboard','/admin/berita','/admin/media','/admin/revisi'].some(root=>path===root||path.startsWith(root+'/'));
 if(role==='editor'||role==='editor_in_chief')return true;
 return false;
}

export default function AdminShell({children}:{children:React.ReactNode}){
 const path=usePathname();
 const router=useRouter();
 const isPublic=publicPaths.includes(path);
 const [checking,setChecking]=useState(!isPublic);
 const [name,setName]=useState('Redaksi KOMSI');
 const [role,setRole]=useState('');
 const [mobileOpen,setMobileOpen]=useState(false);

 useEffect(()=>{
  if(isPublic){setChecking(false);return}
  let alive=true;
  setChecking(true);
  const verify=async()=>{
   if(!supabase){router.replace('/admin/login');return}
   const {data:{session}}=await supabase.auth.getSession();
   if(!session){router.replace('/admin/login');return}
   const {data:profile,error}=await supabase.from('profiles').select('full_name,role,is_active').eq('id',session.user.id).maybeSingle();
   if(!alive)return;
   if(error||!profile||!profile.is_active||!['super_admin','admin','editor','editor_in_chief','journalist'].includes(profile.role||'')){
    await supabase.auth.signOut();
    router.replace('/admin/login');
    return;
   }
   setName(profile.full_name||session.user.email||'Redaksi KOMSI');
   setRole(profile.role||'');
   setChecking(false);
  };
  verify();
  const {data:{subscription}}=supabase?.auth.onAuthStateChange((event,session)=>{
   if(event==='SIGNED_OUT'||!session)router.replace('/admin/login');
  })||{data:{subscription:null}};
  return ()=>{alive=false;subscription?.unsubscribe()};
 },[isPublic,path,router]);

 if(isPublic)return <>{children}</>;
 if(checking)return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#f7f7f7',color:'#555'}}>Memeriksa akses ruang redaksi…</main>;\n if(!canAccessAdminPath(role,path))return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24,textAlign:'center',background:'#f7f7f7'}}><div><h1>Akses dibatasi</h1><p>Akun Anda tidak memiliki izin untuk membuka halaman ini.</p><Link href='/admin/dashboard' style={{color:'#c91f2c',fontWeight:700}}>Kembali ke dashboard</Link></div></main>;

 async function logout(){await supabase?.auth.signOut();router.replace('/admin/login')}
 const allowed=(href:string)=>canAccessAdminPath(role,href);
 return <div className="admin-shell">
  <aside className="admin-side">
   <Link href="/admin/dashboard" style={{fontWeight:950,fontSize:23,margin:'4px 10px'}}>KOMSI <span style={{color:'#ff555d'}}>ADMIN</span></Link>
   <small style={{color:'#999',padding:'0 10px'}}>PORTAL REDAKSI</small>
   <button className="admin-mobile-toggle" onClick={()=>setMobileOpen(v=>!v)} aria-expanded={mobileOpen}>Menu redaksi {mobileOpen?'−':'+'}</button>
   <nav className={mobileOpen?'admin-nav open':'admin-nav'} style={{marginTop:30}}>
    {nav.filter(([label,href])=>allowed(href)).map(([label,href,Icon])=><Link className={path===href?'active':''} href={href} key={href} onClick={()=>setMobileOpen(false)}><Icon size={17} style={{marginRight:12}}/>{label}</Link>)}
   </nav>
   <div style={{margin:'24px 10px 0',paddingTop:16,borderTop:'1px solid #333'}}>
    <div style={{fontSize:12,color:'#bbb',marginBottom:3}}>{name}</div><small style={{color:'#888'}}>{role.replaceAll('_',' ')}</small>
   </div>
   <button onClick={logout} style={{margin:'20px 10px',background:'transparent',border:0,color:'#ddd',textAlign:'left',cursor:'pointer'}}><LogOut size={16} style={{verticalAlign:'middle',marginRight:8}}/>Keluar</button>
  </aside>
  <section style={{minWidth:0}}>
   <header style={{background:'white',padding:'13px 22px',borderBottom:'1px solid #eee',display:'flex',alignItems:'center',gap:12}}><b>KOMSI NEWS / PANEL REDAKSI</b><Link href="/" style={{marginLeft:'auto',fontSize:13,color:'#c91f2c'}}>Lihat website ↗</Link></header>
   <div className="admin-main">{children}</div>
  </section>
 </div>;
}