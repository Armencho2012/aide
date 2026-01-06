import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Check, Infinity, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

declare global {
  interface Window {
    GumroadOverlay: any;
  }
}

const Billing = () => {
  const [user, setUser] = useState<User | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'free' | 'pro'>('free');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const gumroadScriptLoaded = useRef(false);

  // Load Gumroad script
  useEffect(() => {
    if (!gumroadScriptLoaded.current) {
      const script = document.createElement('script');
      script.src = 'https://gumroad.com/js/gumroad.js';
      script.async = true;
      document.body.appendChild(script);
      gumroadScriptLoaded.current = true;
    }
  }, []);

  // Check for success redirect from Gumroad
  useEffect(() => {
    if (searchParams.get('status') === 'success') {
      toast({
        title: "Success!",
        description: "Your subscription is now active. Please refresh to see your Pro status.",
      });
      // Refresh subscription status
      if (user) {
        fetchSubscriptionStatus();
      }
    }
  }, [searchParams, user, toast]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchSubscriptionStatus();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        if (session.user) fetchSubscriptionStatus();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchSubscriptionStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('subscriptions')
        .select('status, plan_type, expires_at')
        .eq('user_id', user.id)
        .single() as { data: { status: string; plan_type: string; expires_at: string | null } | null; error: any };

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
        return;
      }

      if (data) {
        const isActive = data.status === 'active' && 
          data.plan_type === 'pro' &&
          (!data.expires_at || new Date(data.expires_at) > new Date());
        setSubscriptionStatus(isActive ? 'pro' : 'free');
      } else {
        setSubscriptionStatus('free');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleUpgrade = () => {
    if (!user) return;

    setLoading(true);
    
    // Open Gumroad overlay
    if (window.GumroadOverlay) {
      window.GumroadOverlay({
        url: 'https://websmith82.gumroad.com/l/sceqs',
        product: 'sceqs',
        success_url: `${window.location.origin}/dashboard?status=success`,
      });
    } else {
      // Fallback: redirect to Gumroad
      window.open('https://websmith82.gumroad.com/l/sceqs?wanted=true', '_blank');
    }
    
    setLoading(false);
  };

  const features = {
    free: [
      "5 analyses per day",
      "Basic AI analysis",
      "Content archive",
      "Basic support"
    ],
    pro: [
      "Unlimited analyses",
      "Advanced AI analysis",
      "Priority processing",
      "Unlimited content archive",
      "Priority support",
      "Early access to new features"
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container max-w-5xl mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-8">
          <Link to="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground text-lg">
            Upgrade to unlock unlimited AI-powered analysis
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Free Tier */}
          <Card className={`p-6 ${subscriptionStatus === 'free' ? 'border-2 border-primary' : ''}`}>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <div className="text-4xl font-bold mb-1">$0</div>
              <p className="text-sm text-muted-foreground">Forever</p>
            </div>
            <ul className="space-y-3 mb-6">
              {features.free.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button 
              variant={subscriptionStatus === 'free' ? 'default' : 'outline'} 
              className="w-full"
              disabled={subscriptionStatus === 'free'}
            >
              {subscriptionStatus === 'free' ? 'Current Plan' : 'Select Free'}
            </Button>
          </Card>

          {/* Pro Tier */}
          <Card className={`p-6 relative ${subscriptionStatus === 'pro' ? 'border-2 border-primary' : 'border-2 border-accent'}`}>
            {subscriptionStatus !== 'pro' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-semibold">
                  Recommended
                </span>
              </div>
            )}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="text-4xl font-bold mb-1">$15.99</div>
              <p className="text-sm text-muted-foreground">Per month</p>
            </div>
            <ul className="space-y-3 mb-6">
              {features.pro.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-accent flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button 
              className={`w-full ${subscriptionStatus === 'pro' ? '' : 'bg-gradient-to-r from-primary to-accent'}`}
              disabled={subscriptionStatus === 'pro' || loading}
              onClick={handleUpgrade}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : subscriptionStatus === 'pro' ? (
                'Current Plan'
              ) : (
                'Upgrade to Pro'
              )}
            </Button>
          </Card>
        </div>

        {/* Feature Comparison */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Feature Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Feature</th>
                  <th className="text-center p-2">Free</th>
                  <th className="text-center p-2">Pro</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">Daily Analyses</td>
                  <td className="text-center p-2">5</td>
                  <td className="text-center p-2">
                    <Infinity className="h-4 w-4 inline text-accent" />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Content Archive</td>
                  <td className="text-center p-2">✓</td>
                  <td className="text-center p-2">✓ Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Priority Support</td>
                  <td className="text-center p-2">✗</td>
                  <td className="text-center p-2">✓</td>
                </tr>
                <tr>
                  <td className="p-2">Advanced Features</td>
                  <td className="text-center p-2">✗</td>
                  <td className="text-center p-2">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Billing;


