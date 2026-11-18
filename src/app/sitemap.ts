import type {MetadataRoute} from 'next';
import {supabase} from '@/lib/supabase';

const base=process.env.NEXT_PUBLIC_SITE_URL||'https://berita-komsi.vercel.app';

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 if(!supabase)return [{url:base,lastModified:new Date()}];
 const[nowArticles,nowCategories,nowTags,nowEvents,nowPages]=await Promise.all([
  supabase.from('articles').select('slug,published_at,updated_at').eq('status','published').not('published_at','is',null).lte('published_at',new Date().toISOString()),
  supabase.from('categories').select('slug'),
  supabase.from('tags').select('slug'),
  supabase.from('events').select('slug,updated_at').eq('status','published'),
  supabase.from('pages').select('slug,updated_at').eq('is_published',true)
 ]);
 const urls:MetadataRoute.Sitemap=[
  {url:base,lastModified:new Date()},
  {url:base+'/berita',lastModified:new Date()},
  {url:base+'/agenda',lastModified:new Date()},
  ...(nowArticles.data||[]).map(a=>({url:base+'/berita/'+a.slug,lastModified:a.updated_at?new Date(a.updated_at):a.published_at?new Date(a.published_at):new Date()})),
  ...(nowCategories.data||[]).map(c=>({url:base+'/kategori/'+c.slug})),
  ...(nowTags.data||[]).map(t=>({url:base+'/tag/'+t.slug})),
  ...(nowEvents.data||[]).map(e=>({url:base+'/agenda/'+e.slug,lastModified:e.updated_at?new Date(e.updated_at):new Date()})),
  ...(nowPages.data||[]).map(p=>({url:base+'/halaman/'+p.slug,lastModified:p.updated_at?new Date(p.updated_at):new Date()}))
 ];
 return urls;
}