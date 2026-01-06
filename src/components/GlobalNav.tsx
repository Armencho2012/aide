import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Settings, LogOut } from "lucide-react";
import { SettingsModal } from "@/components/SettingsModal";
import { useSettings } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const GlobalNav = () => {
  const { language, theme, setLanguage, setTheme } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Don't show on auth or landing pages
  const hideOnPages = ['/auth', '/'];
  const shouldShow = !hideOnPages.includes(location.pathname);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  if (!shouldShow) return null;

  return (
    <>
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSettingsOpen(true)}
          className="shadow-md bg-background/80 backdrop-blur-sm"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          className="shadow-md bg-background/80 backdrop-blur-sm"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        language={language}
        onLanguageChange={setLanguage}
        theme={theme}
        onThemeChange={setTheme}
        showPlanStatus={false}
        showDeleteAccount={false}
      />
    </>
  );
};

