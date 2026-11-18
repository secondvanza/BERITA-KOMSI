'use client';
import InviteStaffForm from '@/components/InviteStaffForm';
import {useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';

const roles=['journalist','editor','editor_in_chief','admin','super_admin'];
export default function Users(){
 const[rows,setRows]=useState<any[]>([]);
 const[msg,setMsg]=useState('');
 const[actorRole,setActorRole]=useState('');
 const[actorId,setActorId]=useState('');
 async function load(){
  if(!supabase)return;
  const{data:{user}}=await supabase.auth.getUser();
  if(user){
   setActorId(user.id);
   const{data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle();
   setActorRole(profile?.role||'');
  }
  const{data,error}=await supabase.from('profiles').select('id,full_name,email,role,is_active,created_at').order('created_at',{ascending:false});
  if(error)setMsg('Gagal memuat pengguna: '+error.message);
  else setRows(data||[]);
 }
 useEffect(()=>{load()},[]);
 async function changeRole(target:any,newRole:string){
  if(!supabase)return;
  if(target.id===actorId){setMsg('Peran akun sendiri tidak dapat diubah.');return}
  if(actorRole==='admin'&&(['admin','super_admin'].includes(target.role)||['admin','super_admin'].includes(newRole))){
   setMsg('Hanya super admin yang dapat mengelola akun admin dan super admin.');return
  }
  const{data,error}=await supabase.functions.invoke('admin-set-profile-role',{body:{target_user_id:target.id,new_role:newRole}});
  if(error||data?.error){setMsg(error?.message||data?.error||'Gagal memperbarui peran.');return}
  setMsg(data?.message||'Peran berhasil diperbarui.');
  await load();
 }
 async function changeActive(target:any,value:boolean){
  if(!supabase)return;
  if(target.id===actorId){setMsg('Anda tidak dapat menonaktifkan akun sendiri.');return}
  if(actorRole==='admin'&&['admin','super_admin'].includes(target.role)){
   setMsg('Admin tidak dapat mengubah status akun admin atau super admin.');return
  }
  const{error}=await supabase.from('profiles').update({is_active:value}).eq('id',target.id);
  setMsg(error?.message||'Status akun diperbarui.');
  if(!error)await load();
 }
 const isSelf=(u:any)=>u.id===actorId;
 const protectedTarget=(u:any)=>actorRole==='admin'&&['admin','super_admin'].includes(u.role);
 return <>
  <div className="eyebrow">Tim redaksi</div><h1>Manajemen Pengguna</h1>
  <p className="muted">Undang anggota melalui email dan atur peran tim redaksi.</p>
  <InviteStaffForm onDone={load}/>
  {msg&&<p role="status">{msg}</p>}
  <div style={{...panel,overflowX:'auto'}}>
   <table style={{width:'100%',borderCollapse:'collapse',textAlign:'left'}}>
    <thead><tr>{['Nama / Email','Peran','Status','Aksi'].map(x=><th key={x} style={cell}>{x}</th>)}</tr></thead>
    <tbody>{rows.map(u=><tr key={u.id}>
     <td style={cell}><b>{u.full_name||'Tanpa nama'}</b><div className="muted">{u.email}</div></td>
     <td style={cell}><select disabled={isSelf(u)||protectedTarget(u)} value={u.role} onChange={e=>changeRole(u,e.target.value)}>{roles.filter(r=>actorRole==='super_admin'||!['admin','super_admin'].includes(r)).map(r=><option key={r} value={r}>{r}</option>)}</select></td>
     <td style={cell}>{u.is_active?'Aktif':'Nonaktif'}</td>
     <td style={cell}><button disabled={isSelf(u)||protectedTarget(u)} onClick={()=>changeActive(u,!u.is_active)}>{u.is_active?'Nonaktifkan':'Aktifkan'}</button></td>
    </tr>)}</tbody>
   </table>
  </div>
 </>;
}
const panel:React.CSSProperties={background:'white',border:'1px solid #eee',borderRadius:10};
const cell:React.CSSProperties={padding:12,borderBottom:'1px solid #eee'};