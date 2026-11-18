'use client';
import {useState} from 'react';
type Props={title:string;url:string};
export default function SocialShare({title,url}:Props){
 const[copied,setCopied]=useState(false);
 const encodedUrl=encodeURIComponent(url);
 const encodedTitle=encodeURIComponent(title);
 async function copyLink(){try{await navigator.clipboard.writeText(url);setCopied(true);window.setTimeout(()=>setCopied(false),2200);}catch{window.prompt('Salin tautan ini:',url);}}
 async function share(){if(navigator.share){try{await navigator.share({title,url});return;}catch(error){if(error instanceof Error&&error.name==='AbortError')return;}}await copyLink();}
 const linkStyle={display:'inline-flex',alignItems:'center',gap:6,border:'1px solid #e5e7eb',borderRadius:999,padding:'8px 12px',fontSize:13,fontWeight:700,color:'#333',background:'#fff'};
 return <section aria-label="Bagikan konten" style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',margin:'22px 0 28px'}}>
  <strong style={{fontSize:13,marginRight:4}}>Bagikan:</strong>
  <button type="button" onClick={share} style={{...linkStyle,cursor:'pointer',background:'#171717',color:'#fff',borderColor:'#171717'}}>↗ Bagikan</button>
  <a href={'https://wa.me/?text='+encodedTitle+'%20'+encodedUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>WhatsApp</a>
  <a href={'https://www.facebook.com/sharer/sharer.php?u='+encodedUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>Facebook</a>
  <a href={'https://twitter.com/intent/tweet?text='+encodedTitle+'&url='+encodedUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>X</a>
  <a href={'https://t.me/share/url?url='+encodedUrl+'&text='+encodedTitle} target="_blank" rel="noopener noreferrer" style={linkStyle}>Telegram</a>
  <button type="button" onClick={copyLink} style={{...linkStyle,cursor:'pointer'}}>{copied?'✓ Tersalin':'Salin tautan'}</button>
 </section>;
}
