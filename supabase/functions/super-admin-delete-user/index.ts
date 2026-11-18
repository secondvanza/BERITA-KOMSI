import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://berita-komsi.vercel.app",
  "https://berita-komsi-komsi.vercel.app",
  "http://localhost:3000",
]);

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin") || "";
  const cors = {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "https://berita-komsi.vercel.app",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (origin && !allowedOrigins.has(origin)) return json({ error: "Origin tidak diizinkan." }, 403);
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return json({ error: "Konfigurasi server belum lengkap." }, 500);

  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Unauthorized" }, 401);

  const caller = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await caller.auth.getUser(token);
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: actor, error: actorError } = await admin.from("profiles")
    .select("role,is_active").eq("id", user.id).maybeSingle();
  if (actorError || !actor?.is_active || actor.role !== "super_admin") {
    return json({ error: "Hanya super admin aktif yang dapat menghapus pengguna." }, 403);
  }

  const body = await req.json().catch(() => ({}));
  const targetId = String(body.target_user_id || "").trim();
  if (!targetId) return json({ error: "ID pengguna tidak valid." }, 400);
  if (targetId === user.id) return json({ error: "Anda tidak dapat menghapus akun sendiri." }, 403);

  const { data: target, error: targetError } = await admin.from("profiles")
    .select("id,role,email").eq("id", targetId).maybeSingle();
  if (targetError || !target) return json({ error: "Pengguna tidak ditemukan." }, 404);

  if (target.role === "super_admin") {
    const { count, error: countError } = await admin.from("profiles")
      .select("id", { count: "exact", head: true }).eq("role", "super_admin");
    if (countError) return json({ error: "Tidak dapat memeriksa jumlah super admin." }, 500);
    if ((count ?? 0) <= 1) return json({ error: "Super admin terakhir tidak boleh dihapus." }, 409);
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(targetId);
  if (deleteError) return json({ error: "Gagal menghapus akun: " + deleteError.message }, 400);

  return json({ ok: true, message: "Pengguna berhasil dihapus permanen." });
});
