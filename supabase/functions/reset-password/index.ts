import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user: caller } } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    const adminEmails = ["terra.ai.studio@yandex.ru", "terra_ai_team@kitay.club"];
    if (!caller || !adminEmails.includes(caller.email || "")) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { username, new_password } = await req.json();
    if (!username || !new_password) {
      return new Response(JSON.stringify({ error: "username and new_password required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedUsername = username.trim().toLowerCase();

    // Find user_id from profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("user_id")
      .eq("username", normalizedUsername)
      .maybeSingle();

    if (!profile?.user_id) {
      // Try case-insensitive
      const { data: profile2 } = await supabase
        .from("user_profiles")
        .select("user_id, username")
        .ilike("username", normalizedUsername)
        .maybeSingle();

      if (!profile2?.user_id) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Also fix the username casing in profile
      await supabase
        .from("user_profiles")
        .update({ username: normalizedUsername })
        .eq("user_id", profile2.user_id);

      const { error } = await supabase.auth.admin.updateUserById(profile2.user_id, {
        password: new_password,
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ success: true, username: normalizedUsername }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error } = await supabase.auth.admin.updateUserById(profile.user_id, {
      password: new_password,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, username: normalizedUsername }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
