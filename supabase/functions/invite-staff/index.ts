import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://berita-komsi.vercel.app",
  "https://berita-komsi-komsi.vercel.app",
  "http://localhost:3000",
]);
const origin = (req: Request) => req.headers.get("Origin") || "";
const corsFor = (req: Request) => ({
  "Access-Control-Allow-Origin": allowedOrigins.has(origin(req)) ? origin(req) : "https://berita-komsi.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});

Deno.serve(async (req: Request) => {
  const cors = corsFor(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (origin(req) && !allowedOrigins.has(origin(req))) return new Response(JSON.stringify({ error: "Origin tidak diizinkan." }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...cors, "Content-Type": "application/json" } });

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

  const callerClient = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data: { user }, error: authError } = await callerClient.auth.getUser(token);
  if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: profile } = await admin.from("profiles").select("role,is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active || !["super_admin", "admin"].includes(profile.role)) {
    return new Response(JSON.stringify({ error: "Hanya admin aktif yang dapat mengundang anggota redaksi." }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const fullName = String(body.full_name || "").trim();
  const role = String(body.role || "journalist");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !fullName || fullName.length > 100 || !["journalist", "editor", "editor_in_chief"].includes(role)) {
    return new Response(JSON.stringify({ error: "Nama, email, atau peran tidak valid." }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { data: { full_name: fullName } });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  if (data.user) {
    const { error: passwordError } = await admin.auth.admin.updateUserById(data.user.id, { password });
    if (passwordError) return new Response(JSON.stringify({ error: "Undangan email terkirim, tetapi password awal gagal disetel. Atur ulang password anggota melalui Supabase Auth." }), { status: 202, headers: { ...cors, "Content-Type": "application/json" } });
    const { error: updateError } = await admin.from("profiles").update({ full_name: fullName }).eq("id", data.user.id);
    if (updateError) return new Response(JSON.stringify({ error: "Undangan terkirim, tetapi profil perlu diperiksa admin." }), { status: 202, headers: { ...cors, "Content-Type": "application/json" } });
    // Elevated editorial roles are assigned with the trusted service client after invitation.
    if (role !== "journalist") {
      const { error: roleError } = await admin.from("profiles").update({ role }).eq("id", data.user.id);
      if (roleError) return new Response(JSON.stringify({ error: "Undangan terkirim, tetapi peran perlu diatur manual." }), { status: 202, headers: { ...cors, "Content-Type": "application/json" } });
    }
  }
  return new Response(JSON.stringify({ ok: true, message: "Undangan berhasil dikirim." }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
});