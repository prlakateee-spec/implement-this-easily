import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-action",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Check for admin auth via Bearer token
    const authHeader = req.headers.get("Authorization");
    let isAdmin = false;

    if (authHeader) {
      const { data: { user: caller } } = await supabase.auth.getUser(
        authHeader.replace("Bearer ", "")
      );
      const adminEmails = ["terra.ai.studio@yandex.ru", "terra_ai_team@kitay.club"];
      isAdmin = !!caller && adminEmails.includes(caller.email || "");
    }

    // Also allow internal calls with service role key
    if (!isAdmin) {
      const apikey = req.headers.get("apikey") || "";
      if (apikey === serviceKey) {
        isAdmin = true;
      }
    }

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const results = [];

    // Support batch: { users: [{username, new_password}] } or single: {username, new_password}
    const items = body.users || [body];

    for (const { username, new_password } of items) {
      if (!username || !new_password) {
        results.push({ username, error: "missing fields" });
        continue;
      }

      const normalizedUsername = username.trim().toLowerCase();

      // Find user_id from profile (case-insensitive)
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("user_id, username")
        .ilike("username", normalizedUsername)
        .maybeSingle();

      if (!profile?.user_id) {
        results.push({ username: normalizedUsername, error: "not found" });
        continue;
      }

      // Fix username casing if needed
      if (profile.username !== normalizedUsername) {
        await supabase
          .from("user_profiles")
          .update({ username: normalizedUsername })
          .eq("user_id", profile.user_id);
      }

      const { error } = await supabase.auth.admin.updateUserById(profile.user_id, {
        password: new_password,
      });

      results.push({
        username: normalizedUsername,
        success: !error,
        error: error?.message,
      });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
