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
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const originAllowed = !origin || allowedOrigins.has(origin);
  if (!originAllowed) return json({ error: "Origin tidak diizinkan." }, 403);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return json({ error: "Konfigurasi server belum lengkap." }, 500);

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
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
  const { data: actor, error: actorError } = await admin
    .from("profiles")
    .select("role,is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (actorError || !actor?.is_active || !["super_admin", "admin"].includes(actor.role)) {
    return json({ error: "Hanya admin aktif yang dapat mengubah peran pengguna." }, 403);
  }

  const body = await req.json().catch(() => ({}));
  const targetId = String(body.target_user_id || "").trim();
  const newRole = String(body.new_role || "").trim();
  if (!targetId || !["journalist", "editor", "editor_in_chief", "admin", "super_admin"].includes(newRole)) {
    return json({ error: "Target pengguna atau peran tidak valid." }, 400);
  }
  if (targetId === user.id) return json({ error: "Admin tidak dapat mengubah perannya sendiri." }, 403);

  const { data: target, error: targetError } = await admin
    .from("profiles")
    .select("id,role")
    .eq("id", targetId)
    .maybeSingle();
  if (targetError || !target) return json({ error: "Pengguna tidak ditemukan." }, 404);

  if (actor.role === "admin" &&
      (["admin", "super_admin"].includes(newRole) || ["admin", "super_admin"].includes(target.role))) {
    return json({ error: "Hanya super admin yang dapat mengelola peran admin dan super admin." }, 403);
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq("id", targetId);
  if (updateError) return json({ error: "Gagal memperbarui peran: " + updateError.message }, 400);

  return json({ ok: true, message: "Peran pengguna berhasil diperbarui." });
});