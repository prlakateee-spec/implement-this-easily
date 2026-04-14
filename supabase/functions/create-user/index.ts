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

    // Verify admin caller
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

    const { username: rawUsername, password, display_name, is_client, unique_code, referral_link } = await req.json();
    const username = rawUsername?.trim().toLowerCase();

    if (!username || !password) {
      return new Response(JSON.stringify({ error: "Username and password required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if username already exists
    const { data: existing } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "Username already exists" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create auth user with mapped email
    const email = `${username}@kitay.club`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create profile
    const profileData: Record<string, any> = {
      user_id: authData.user.id,
      username,
      display_name: display_name || username,
    };

    if (is_client) {
      profileData.is_client = true;
    }
    if (unique_code) {
      profileData.unique_code = unique_code.trim();
    }

    const { error: profileError } = await supabase.from("user_profiles").insert(profileData);

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If referral_link provided, create ambassador profile
    if (referral_link?.trim()) {
      await supabase.from("ambassador_profiles").insert({
        user_id: authData.user.id,
        referral_link: referral_link.trim(),
        is_active: false,
      });
    }

    return new Response(
      JSON.stringify({ success: true, username, user_id: authData.user.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
