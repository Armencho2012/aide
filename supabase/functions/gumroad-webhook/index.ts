import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const gumroadProductId = Deno.env.get("GUMROAD_PRODUCT_ID")!;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    if (!gumroadProductId) {
      throw new Error("GUMROAD_PRODUCT_ID not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Gumroad sends webhook data as form-encoded
    const formData = await req.formData();
    const webhookData: Record<string, string> = {};
    
    for (const [key, value] of formData.entries()) {
      webhookData[key] = value.toString();
    }

    console.log("Gumroad webhook received:", {
      product_id: webhookData.product_id,
      sale_id: webhookData.sale_id,
      email: webhookData.email,
      event: webhookData.event
    });

    // Verify product ID matches our Aide Pro plan
    if (webhookData.product_id !== gumroadProductId) {
      console.log("Product ID mismatch, ignoring webhook");
      return new Response("Product ID mismatch", {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/plain" }
      });
    }

    // Handle sale event
    if (webhookData.event === 'sale' || webhookData.event === 'subscription_payment_succeeded') {
      const email = webhookData.email;
      const saleId = webhookData.sale_id;

      if (!email) {
        console.error("No email in webhook data");
        return new Response("Missing email", {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "text/plain" }
        });
      }

      // Find user by email
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error("Error fetching users:", authError);
        return new Response("Error fetching users", {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "text/plain" }
        });
      }

      const user = authUsers.users.find(u => u.email === email);

      if (!user) {
        console.log(`User not found for email: ${email}`);
        // Store the sale for later when user signs up
        await supabase
          .from('subscriptions')
          .insert({
            gumroad_sale_id: saleId,
            gumroad_email: email,
            status: 'pending',
            plan_type: 'pro',
            purchased_at: new Date().toISOString(),
          });
        
        return new Response("User not found, sale recorded", {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "text/plain" }
        });
      }

      // Calculate expiration (if it's a subscription, set to 1 month from now)
      // For one-time purchases, you might want to set a longer expiration or lifetime
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month subscription

      // Update or create subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          gumroad_sale_id: saleId,
          gumroad_email: email,
          status: 'active',
          plan_type: 'pro',
          purchased_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (subError) {
        console.error("Error updating subscription:", subError);
        return new Response("Error updating subscription", {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "text/plain" }
        });
      }

      console.log(`Successfully upgraded user ${user.id} to Pro`);
    }

    // Handle refund/cancellation
    if (webhookData.event === 'refund' || webhookData.event === 'subscription_cancelled') {
      const email = webhookData.email;
      
      if (email) {
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const user = authUsers?.users.find(u => u.email === email);

        if (user) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'canceled',
            })
            .eq('user_id', user.id);
        }
      }
    }

    return new Response("OK", {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/plain" }
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});




