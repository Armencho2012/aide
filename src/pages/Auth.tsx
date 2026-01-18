import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { useSettings } from "@/hooks/useSettings";

type Language = 'en' | 'ru' | 'hy' | 'ko';

const uiLabels = {
  en: {
    backToHome: 'Back to Home',
    signInTitle: 'Sign in to start learning',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    email: 'Email',
    password: 'Password',
    fullName: 'Full Name',
    forgotPassword: 'Forgot password?',
    createAccount: 'Create Account',
    startFree: 'Start with 1 free analysis per day!',
    emailRequired: 'Email is required',
    emailPlaceholder: 'your@email.com',
    passwordPlaceholder: '••••••••',
    namePlaceholder: 'John Doe',
    loadingSignIn: 'Signing in...',
    loadingSignUp: 'Creating account...',
    mustBeAtLeast8: 'Must be at least 8 characters',
    validationError: 'Validation Error',
    success: 'Success!',
    accountCreated: 'Account created successfully.',
    checkEmail: 'Check your email',
    confirmationSent: 'We\'ve sent you a confirmation email.',
    resetLinkSent: 'We\'ve sent you a password reset link. Please check your inbox.',
    welcomeBack: 'Welcome back!',
    signedIn: 'Successfully signed in',
    emailRequiredDesc: 'Please enter your email address first',
    error: 'Error',
    signInError: 'Sign In Error',
    signupError: 'Signup Error'
  },
  ru: {
    backToHome: 'На главную',
    signInTitle: 'Войдите, чтобы начать обучение',
    signIn: 'Войти',
    signUp: 'Регистрация',
    email: 'Электронная почта',
    password: 'Пароль',
    fullName: 'Полное имя',
    forgotPassword: 'Забыли пароль?',
    createAccount: 'Создать аккаунт',
    startFree: 'Начните с 1 бесплатного анализа в день!',
    emailRequired: 'Электронная почта обязательна',
    emailPlaceholder: 'vash@email.com',
    passwordPlaceholder: '••••••••',
    namePlaceholder: 'Иван Иванов',
    loadingSignIn: 'Вход...',
    loadingSignUp: 'Создание аккаунта...',
    mustBeAtLeast8: 'Должно быть не менее 8 символов',
    validationError: 'Ошибка валидации',
    success: 'Успешно!',
    accountCreated: 'Аккаунт успешно создан.',
    checkEmail: 'Проверьте вашу почту',
    confirmationSent: 'Мы отправили вам письмо с подтверждением.',
    resetLinkSent: 'Мы отправили ссылку для сброса пароля. Проверьте почту.',
    welcomeBack: 'С возвращением!',
    signedIn: 'Успешный вход',
    emailRequiredDesc: 'Пожалуйста, сначала введите ваш email',
    error: 'Ошибка',
    signInError: 'Ошибка входа',
    signupError: 'Ошибка регистрации'
  },
  hy: {
    backToHome: 'Վերադառնալ գլխավոր էջ',
    signInTitle: 'Մուտք գործեք սովորելու համար',
    signIn: 'Մուտք',
    signUp: 'Գրանցվել',
    email: 'Էլ. փոստ',
    password: 'Գաղտնաբառ',
    fullName: 'Ամբողջական անուն',
    forgotPassword: 'Մոռացե՞լ եք գաղտնաբառը',
    createAccount: 'Ստեղծել հաշիվ',
    startFree: 'Սկսեք օրական 5 անվճար վերլուծությամբ:',
    emailRequired: 'Էլ. փոստը պարտադիր է',
    emailPlaceholder: 'dzer@email.com',
    passwordPlaceholder: '••••••••',
    namePlaceholder: 'Արմեն Արմենյան',
    loadingSignIn: 'Մուտք...',
    loadingSignUp: 'Հաշվի ստեղծում...',
    mustBeAtLeast8: 'Պետք է լինի առնվազն 8 նիշ',
    validationError: 'Վավերացման սխալ',
    success: 'Հաջողություն:',
    accountCreated: 'Հաշիվը հաջողությամբ ստեղծվել է:',
    checkEmail: 'Ստուգեք ձեր էլ. փոստը',
    confirmationSent: 'Մենք ուղարկել ենք ձեզ հաստատման նամակ:',
    resetLinkSent: 'Ուղարկել ենք գաղտնաբառի վերականգնման հղում: Ստուգեք էլ. փոստը:',
    welcomeBack: 'Բարի վերադարձ:',
    signedIn: 'Մուտքը հաջողված է',
    emailRequiredDesc: 'Խնդրում ենք նախ մուտքագրել ձեր էլ. փոստի հասցեն',
    error: 'Սխալ',
    signInError: 'Մուտքի սխալ',
    signupError: 'Գրանցման սխալ'
  },
  ko: {
    backToHome: '홈으로 돌아가기',
    signInTitle: '학습을 시작하려면 로그인하세요',
    signIn: '로그인',
    signUp: '회원가입',
    email: '이메일',
    password: '비밀번호',
    fullName: '전체 이름',
    forgotPassword: '비밀번호를 잊으셨나요?',
    createAccount: '계정 생성',
    startFree: '하루 1회 무료 분석으로 시작하세요!',
    emailRequired: '이메일은 필수입니다',
    emailPlaceholder: 'your@email.com',
    passwordPlaceholder: '••••••••',
    namePlaceholder: '홍길동',
    loadingSignIn: '로그인 중...',
    loadingSignUp: '계정 생성 중...',
    mustBeAtLeast8: '최소 8자 이상이어야 합니다',
    validationError: '유효성 검사 오류',
    success: '성공!',
    accountCreated: '계정이 성공적으로 생성되었습니다.',
    checkEmail: '이메일을 확인하세요',
    confirmationSent: '확인 이메일을 보냈습니다.',
    resetLinkSent: '비밀번호 재설정 링크를 보냈습니다. 받은 편지함을 확인하세요.',
    welcomeBack: '환영합니다!',
    signedIn: '성공적으로 로그인되었습니다',
    emailRequiredDesc: '먼저 이메일 주소를 입력해 주세요',
    error: '오류',
    signInError: '로그인 오류',
    signupError: '회원가입 오류'
  }
};

// Validation schemas
const signUpSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .max(255, "Email too long"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password too long"),
  fullName: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long")
    .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters")
});

const signInSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .email("Invalid email format"),
  password: z.string()
    .min(1, "Password is required")
});

const Auth = () => {
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const navigate = useNavigate();
  const { language } = useSettings();
  const labels = uiLabels[language as Language] || uiLabels.en;
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with zod schema
    const validation = signUpSchema.safeParse({
      email: signUpEmail.trim(),
      password: signUpPassword,
      fullName: fullName.trim()
    });

    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: validation.data.email,
        password: validation.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { full_name: validation.data.fullName }
        }
      });

      if (error) throw error;

      if (data.user && data.session) {
        // Create profile
        await supabase.from('profiles').upsert({
          user_id: data.user.id,
          email: validation.data.email,
          full_name: validation.data.fullName
        }, { onConflict: 'user_id' });

        toast({
          title: labels.success,
          description: labels.accountCreated
        });
        navigate("/dashboard");
      } else if (data.user) {
        toast({
          title: labels.checkEmail,
          description: labels.confirmationSent
        });
        setSignUpEmail("");
        setSignUpPassword("");
        setFullName("");
      }
    } catch (error: any) {
      toast({
        title: labels.signupError,
        description: error.message || "Failed to create account",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with zod schema
    const validation = signInSchema.safeParse({
      email: signInEmail.trim(),
      password: signInPassword
    });

    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: validation.data.email,
        password: validation.data.password
      });

      if (error) throw error;

      toast({
        title: labels.welcomeBack,
        description: labels.signedIn
      });
      navigate("/dashboard");
    } catch (error: any) {
      let errorMessage = "Invalid email or password";
      if (error.message?.includes("Email not confirmed")) {
        errorMessage = "Please confirm your email before signing in";
      }
      toast({
        title: labels.signInError,
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {labels.backToHome}
          </Link>
        </Button>

        <Card className="p-8 shadow-lg">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
              Aide
            </h1>
            <p className="text-muted-foreground">{labels.signInTitle}</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">{labels.signIn}</TabsTrigger>
              <TabsTrigger value="signup">{labels.signUp}</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">{labels.email}</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder={labels.emailPlaceholder}
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                    disabled={loading}
                    maxLength={255}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password">{labels.password}</Label>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!signInEmail.trim()) {
                          toast({
                            title: labels.emailRequired,
                            description: labels.emailRequiredDesc,
                            variant: "destructive"
                          });
                          return;
                        }
                        setLoading(true);
                        try {
                          const { error } = await supabase.auth.resetPasswordForEmail(signInEmail.trim(), {
                            redirectTo: `${window.location.origin}/auth?reset=true`
                          });
                          if (error) throw error;
                          toast({
                            title: labels.checkEmail,
                            description: labels.resetLinkSent
                          });
                        } catch (error: any) {
                          toast({
                            title: labels.error,
                            description: error.message || "Failed to send reset email",
                            variant: "destructive"
                          });
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="text-xs text-primary hover:underline"
                      disabled={loading}
                    >
                      {labels.forgotPassword}
                    </button>
                  </div>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder={labels.passwordPlaceholder}
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                    disabled={loading}
                    maxLength={72}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {labels.loadingSignIn}
                    </>
                  ) : labels.signIn}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">{labels.fullName}</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder={labels.namePlaceholder}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{labels.email}</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder={labels.emailPlaceholder}
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                    disabled={loading}
                    maxLength={255}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{labels.password}</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder={labels.passwordPlaceholder}
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required
                    disabled={loading}
                    maxLength={72}
                  />
                  <p className="text-xs text-muted-foreground">
                    {labels.mustBeAtLeast8}
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {labels.loadingSignUp}
                    </>
                  ) : labels.createAccount}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  {labels.startFree}
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
