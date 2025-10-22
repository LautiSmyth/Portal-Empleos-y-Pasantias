
import React, { useEffect, useMemo, useState, createContext } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import JobListings from './pages/JobListings';
import JobDetail from './pages/JobDetail';
import StudentDashboard from './pages/StudentDashboard';
import CompanyDashboard from './pages/CompanyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { Role } from './types';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import StudentCV from './pages/StudentCV';
import { supabase } from './services/supabaseClient';
import { SpeedInsights } from '@vercel/speed-insights/react';

export type AuthUser = {
  id: string;
  role: Role;
  email: string;
  emailVerified: boolean;
  name?: string;
  companyVerified?: boolean;
};

type StoredUser = AuthUser & { password?: string };

type CompanyMeta = {
  legal_name?: string;
  industry?: string;
  hr_contact_name?: string;
  logo_url?: string;
  phone?: string;
};

type AuthContextType = {
  currentUser: AuthUser | null;
  register: (email: string, password: string, role: Role, name?: string, company?: CompanyMeta) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  verifyEmail: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
  // Dev helper to keep current demo buttons working
  loginAs: (id: string, role: Role) => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

const USERS_KEY = 'unijobs_users';
const CURRENT_USER_KEY = 'unijobs_current_user';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const navigate = useNavigate();
  const location = useLocation();



  const readUsers = (): StoredUser[] => {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      return raw ? (JSON.parse(raw) as StoredUser[]) : [];
    } catch {
      return [];
    }
  };

  const writeUsers = (users: StoredUser[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  };

  // Refresca currentUser leyendo user + profile desde Supabase
  const refreshCurrentUserFromSupabase = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      setCurrentUser(null);
      return;
    }
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role, first_name, company_verified')
      .eq('id', user.id)
      .maybeSingle();

    const role = (profileData?.role as Role) ?? Role.STUDENT;

    setCurrentUser({
      id: user.id,
      role,
      email: user.email || '',
      name: profileData?.first_name || undefined,
      emailVerified: !!user.email_confirmed_at,
      companyVerified: profileData?.company_verified ?? undefined,
    });
  };

  // Sincroniza sesión al montar y ante cambios de auth
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) await refreshCurrentUserFromSupabase();
    })();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) refreshCurrentUserFromSupabase();
      else setCurrentUser(null);
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  // Redirige a dashboard al tener sesión verificada
  useEffect(() => {
    if (!currentUser || !currentUser.emailVerified) return;
    if (location.pathname === '/' || location.pathname === '/auth/login') {
      if (currentUser.role === Role.STUDENT) navigate('/dashboard/student');
      else if (currentUser.role === Role.COMPANY) navigate('/dashboard/company');
      else if (currentUser.role === Role.ADMIN) navigate('/dashboard/admin');
    }
  }, [currentUser, location.pathname, navigate]);

  // Registro con Supabase Auth
  const register = async (email: string, password: string, role: Role, name?: string, company?: CompanyMeta) => {
    // Guarda email para reenvío en VerifyEmail si no hay sesión aún
    try { localStorage.setItem('pending_verification_email', email); } catch {}

    const isCompany = role === Role.COMPANY;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/#/auth/verify-email`,
        data: {
          role,
          name,
          ...(isCompany ? {
            company_name: name,
            company_email: email,
            company_legal_name: company?.legal_name,
            company_industry: company?.industry,
            company_hr_contact: company?.hr_contact_name,
            company_logo_url: company?.logo_url,
            company_phone: company?.phone,
          } : {}),
        },
      },
    });
    if (error) {
      const msg = error.message || 'Error en registro';
      // Fallback: si falla el envío de email de confirmación, generamos y enviamos link vía API
      if (/send(ing)? confirmation email|confirm(ación)? por email|SMTP|500/i.test(msg)) {
        const token = (import.meta as any).env?.VITE_ADMIN_API_TOKEN || '';
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['X-Admin-Token'] = token;
        try {
          const res = await fetch('/api/send-auth-link', {
            method: 'POST',
            headers,
            body: JSON.stringify({ email, type: 'signup', redirectTo: `${window.location.origin}/#/auth/verify-email` }),
          });
          const json = await res.json().catch(() => ({}));
          if (res.ok) {
            // Continuar al paso de verificación aunque Supabase no haya enviado el email
            navigate('/auth/verify-email');
            return;
          }
          throw new Error(json?.error || msg);
        } catch (fallbackErr: any) {
          const fmsg = fallbackErr?.message || msg;
          if ((error as any)?.status === 429 || /Too Many Requests|rate limit/i.test(fmsg)) {
            throw new Error('Demasiadas solicitudes de registro. Espera 60 segundos e intenta otra vez.');
          }
          throw new Error(fmsg);
        }
      }
      if ((error as any)?.status === 429 || /Too Many Requests|rate limit/i.test(msg)) {
        throw new Error('Demasiadas solicitudes de registro. Espera 60 segundos e intenta otra vez.');
      }
      throw new Error(msg);
    }

    // Si la instancia no requiere confirmación por email, habrá sesión y podemos asegurar perfil
    if (data?.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, role, first_name: name });
      await refreshCurrentUserFromSupabase();
    }

    // Navegar a verificación en cualquier caso; si no hay sesión, se quedará esperando confirmación
    navigate('/auth/verify-email');
  };

  // Login con email/password en Supabase
  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    await refreshCurrentUserFromSupabase();
  };

  // Login con Google via OAuth (redirige)
  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/#/` },
    });
    if (error) throw new Error(error.message);
  };

  // Verificar email: refresca user desde Supabase
  const verifyEmail = async () => {
    await refreshCurrentUserFromSupabase();
  };

  // Reenviar email de verificación de cuenta
  const resendVerificationEmail = async () => {
    const email = currentUser?.email || localStorage.getItem('pending_verification_email') || '';
    if (!email) throw new Error('No hay email pendiente para verificación');
    // Intentar con Supabase; si falla el envío, usar fallback por API
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}/#/auth/verify-email` },
      } as any);
      if (error) throw new Error(error.message);
    } catch (err: any) {
      const token = (import.meta as any).env?.VITE_ADMIN_API_TOKEN || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['X-Admin-Token'] = token;
      const res = await fetch('/api/send-auth-link', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, type: 'signup', redirectTo: `${window.location.origin}/#/auth/verify-email` }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || err?.message || 'No se pudo enviar email de verificación');
    }
  };

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  // dev helper to keep demo buttons working for now
  const loginAs = (id: string, role: Role) => {
    setCurrentUser({ id, role, email: `${id}@example.com`, emailVerified: true });
  };

  const authContextValue = useMemo(
    () => ({ currentUser, register, login, loginWithGoogle, verifyEmail, resendVerificationEmail, logout, loginAs }),
    [currentUser]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      <div className="flex flex-col min-h-screen font-sans text-gray-800">
        <Header />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/jobs" element={<JobListings />} />
            <Route path="/jobs/:jobId" element={<JobDetail />} />
            <Route path="/dashboard/student" element={<StudentDashboard />} />
            <Route path="/dashboard/student/cv" element={<StudentCV />} />
            <Route path="/dashboard/company" element={<CompanyDashboard />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/verify-email" element={<VerifyEmail />} />
          </Routes>
        </main>
        <Footer />
        {/* Vercel Speed Insights para React. Pasamos la ruta actual para mejor agregación */}
        <SpeedInsights route={location.pathname} />
      </div>
    </AuthContext.Provider>
  );
};

export default App;
