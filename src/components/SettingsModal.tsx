import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2 } from "lucide-react";

type Language = 'en' | 'ru' | 'hy' | 'ko';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  showPlanStatus?: boolean;
  showDeleteAccount?: boolean;
}

const languageLabels = {
  en: { 
    title: 'Settings', 
    language: 'Interface Language', 
    theme: 'Theme', 
    light: 'Light', 
    dark: 'Dark', 
    plan: 'Account Status', 
    planValue: 'Free Tier',
    deleteAccount: 'Delete Account',
    deleteConfirmTitle: 'Delete Account',
    deleteConfirmDescription: 'Are you sure you want to delete your account? This action cannot be undone. All your data, including your profile and usage history, will be permanently deleted.',
    deleteConfirmButton: 'Delete Account',
    cancel: 'Cancel',
    deleting: 'Deleting...'
  },
  ru: { 
    title: 'Настройки', 
    language: 'Язык интерфейса', 
    theme: 'Тема', 
    light: 'Светлая', 
    dark: 'Темная', 
    plan: 'Статус аккаунта', 
    planValue: 'Бесплатный тариф',
    deleteAccount: 'Удалить аккаунт',
    deleteConfirmTitle: 'Удалить аккаунт',
    deleteConfirmDescription: 'Вы уверены, что хотите удалить свой аккаунт? Это действие нельзя отменить. Все ваши данные, включая профиль и историю использования, будут безвозвратно удалены.',
    deleteConfirmButton: 'Удалить аккаунт',
    cancel: 'Отмена',
    deleting: 'Удаление...'
  },
  hy: { 
    title: 'Կարգավորումներ', 
    language: 'Ինտերֆեյսի լեզու', 
    theme: 'Թեմա', 
    light: 'Լուսավոր', 
    dark: 'Մուգ', 
    plan: 'Հաշվի կարգավիճակ', 
    planValue: 'Անվճար տարբերակ',
    deleteAccount: 'Ջնջել հաշիվը',
    deleteConfirmTitle: 'Ջնջել հաշիվը',
    deleteConfirmDescription: 'Դուք համոզված եք, որ ցանկանում եք ջնջել ձեր հաշիվը: Այս գործողությունը չի կարող հետարկվել: Ձեր բոլոր տվյալները, ներառյալ ձեր պրոֆիլը և օգտագործման պատմությունը, կմշտապես ջնջվեն:',
    deleteConfirmButton: 'Ջնջել հաշիվը',
    cancel: 'Չեղարկել',
    deleting: 'Ջնջվում է...'
  },
  ko: { 
    title: '설정', 
    language: '인터페이스 언어', 
    theme: '테마', 
    light: '라이트', 
    dark: '다크', 
    plan: '계정 상태', 
    planValue: '무료 요금제',
    deleteAccount: '계정 삭제',
    deleteConfirmTitle: '계정 삭제',
    deleteConfirmDescription: '계정을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다. 프로필 및 사용 기록을 포함한 모든 데이터가 영구적으로 삭제됩니다.',
    deleteConfirmButton: '계정 삭제',
    cancel: '취소',
    deleting: '삭제 중...'
  }
};

export const SettingsModal = ({ 
  open, 
  onOpenChange, 
  language, 
  onLanguageChange,
  theme,
  onThemeChange,
  showPlanStatus = true,
  showDeleteAccount = true
}: SettingsModalProps) => {
  const labels = languageLabels[language];
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    
    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Error",
          description: "No active session found",
          variant: "destructive"
        });
        setIsDeleting(false);
        return;
      }

      // Call the edge function to delete the account
      console.log('Calling delete-account function...');
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: {}
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Delete account error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error context:', error.context);
        
        // Check for specific error types
        let errorMessage = 'Failed to delete account';
        
        if (error.message) {
          const msg = error.message.toLowerCase();
          if (msg.includes('not found') || msg.includes('404') || msg.includes('function')) {
            errorMessage = 'Delete account function is not deployed. Deploy it in Supabase Dashboard → Edge Functions.';
          } else if (msg.includes('unauthorized') || msg.includes('401')) {
            errorMessage = 'Unauthorized. Please try logging out and back in.';
          } else if (msg.includes('server') || msg.includes('500')) {
            errorMessage = 'Server error. Check Supabase function logs.';
          } else {
            errorMessage = error.message;
          }
        } else if (error.name) {
          errorMessage = `${error.name}: ${error.message || 'Unknown error'}`;
        }
        
        throw new Error(errorMessage);
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Account deletion failed');
      }

      // Sign out and navigate to home
      await supabase.auth.signOut();
      
      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted.",
      });

      navigate("/");
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive"
      });
      setIsDeleting(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>{labels.language}</Label>
            <div className="flex gap-2">
              <Button 
                variant={language === 'en' ? 'default' : 'outline'}
                onClick={() => onLanguageChange('en')}
                className="flex-1"
              >
                English
              </Button>
              <Button 
                variant={language === 'ru' ? 'default' : 'outline'}
                onClick={() => onLanguageChange('ru')}
                className="flex-1"
              >
                Русский
              </Button>
              <Button 
                variant={language === 'hy' ? 'default' : 'outline'}
                onClick={() => onLanguageChange('hy')}
                className="flex-1"
              >
                Հայերեն
              </Button>
              <Button 
                variant={language === 'ko' ? 'default' : 'outline'}
                onClick={() => onLanguageChange('ko')}
                className="flex-1"
              >
                한국어
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label>{labels.theme}</Label>
            <div className="flex gap-2">
              <Button 
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => onThemeChange('light')}
                className="flex-1"
              >
                {labels.light}
              </Button>
              <Button 
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => onThemeChange('dark')}
                className="flex-1"
              >
                {labels.dark}
              </Button>
            </div>
          </div>

          {showPlanStatus && (
            <div className="space-y-2 pt-4 border-t">
              <Label className="text-muted-foreground">{labels.plan}</Label>
              <p className="text-sm font-medium">{labels.planValue}</p>
            </div>
          )}

          {showDeleteAccount && (
            <div className="pt-4 border-t">
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {labels.deleteAccount}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

      {showDeleteAccount && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{labels.deleteConfirmTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {labels.deleteConfirmDescription}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                {labels.cancel}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {labels.deleting}
                  </>
                ) : (
                  labels.deleteConfirmButton
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};
