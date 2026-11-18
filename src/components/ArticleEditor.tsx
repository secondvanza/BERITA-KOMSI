'use client';
import {useEffect,useRef} from 'react';
import {useEditor,EditorContent} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import {Bold,Italic,List,Heading2,Quote,Undo2,Redo2,ImagePlus} from 'lucide-react';

export default function ArticleEditor({value,onChange}:{value:any;onChange:(v:any)=>void}){
 const lastValue=useRef<any>(null);
 const editor=useEditor({
  extensions:[StarterKit,Image],
  content:value||'<p>Tulis isi berita di sini…</p>',
  immediatelyRender:false,
  onUpdate:({editor})=>{
   const next=editor.getJSON();
   lastValue.current=next;
   onChange(next);
  }
 });
 useEffect(()=>{
  if(editor&&value&&value!==lastValue.current){
   editor.commands.setContent(value,{emitUpdate:false});
   lastValue.current=value;
  }
 },[editor,value]);
 if(!editor)return <div style={{padding:30,border:'1px solid #ddd'}}>Memuat editor…</div>;
 const insertImage=()=>{
  const src=window.prompt('Masukkan URL gambar dari Media Library');
  if(!src)return;
  try{const url=new URL(src);if(!['http:','https:'].includes(url.protocol))throw new Error();editor.chain().focus().setImage({src}).run();}
  catch{window.alert('URL gambar tidak valid. Gunakan URL http atau https.');}
 };
 const tools=[['Tebal',Bold,()=>editor.chain().focus().toggleBold().run()],['Miring',Italic,()=>editor.chain().focus().toggleItalic().run()],['Heading',Heading2,()=>editor.chain().focus().toggleHeading({level:2}).run()],['Daftar',List,()=>editor.chain().focus().toggleBulletList().run()],['Kutipan',Quote,()=>editor.chain().focus().toggleBlockquote().run()],['Gambar',ImagePlus,insertImage],['Undo',Undo2,()=>editor.chain().focus().undo().run()],['Redo',Redo2,()=>editor.chain().focus().redo().run()]] as const;
 return <div style={{border:'1px solid #ddd',borderRadius:9,overflow:'hidden',background:'white'}}>
  <div style={{display:'flex',gap:5,padding:9,borderBottom:'1px solid #eee',flexWrap:'wrap'}}>
   {tools.map(([label,Icon,run])=><button type="button" title={label} key={label} onClick={run} style={{padding:8,border:'1px solid #eee',borderRadius:5,background:'white'}}><Icon size={16}/></button>)}
  </div>
  <EditorContent editor={editor}/>
 </div>;
}