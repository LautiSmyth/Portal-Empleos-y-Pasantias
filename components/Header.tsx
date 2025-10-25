
import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Role } from '../types';
import { useTheme } from '../hooks/useTheme';
import { fetchCVByOwnerId } from '../services/cvService';

const Header: React.FC = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const isDev = (import.meta as any).env?.DEV ?? false;
  const { isDark, toggleTheme } = useTheme();
  const [keyword, setKeyword] = useState('');
  const [profileName, setProfileName] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const userId = auth?.currentUser?.id;
      if (!userId) { setProfileName(null); return; }
      try {
        const { cv } = await fetchCVByOwnerId(userId);
        const nameFromCv = cv?.personal?.firstName && cv?.personal?.lastName
          ? `${cv.personal.firstName} ${cv.personal.lastName}`
          : null;
        if (mounted) setProfileName(nameFromCv || auth?.currentUser?.name || null);
      } catch {
        if (mounted) setProfileName(auth?.currentUser?.name || null);
      }
    })();
    return () => { mounted = false; };
  }, [auth?.currentUser?.id]);
  const handleLogout = () => {
    auth?.logout();
    navigate('/');
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = keyword.trim();
    if (q) navigate(`/jobs?q=${encodeURIComponent(q)}`);
    else navigate('/jobs');
  };

  const getDashboardLink = () => {
    if (auth?.currentUser?.role === Role.STUDENT) {
      return '/dashboard/student';
    }
    if (auth?.currentUser?.role === Role.COMPANY) {
      return '/dashboard/company';
    }
    if (auth?.currentUser?.role === Role.ADMIN) {
      return '/dashboard/admin';
    }
    return '/';
  };

  return (
    <header className="app-header sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold brand-link">
              UniJobs Connect
            </Link>
          </div>
          {/* Searchbar */}
          <form onSubmit={onSearchSubmit} className="hidden md:flex flex-1 mx-6 max-w-xl">
            <div className="searchbar w-full">
              <svg className="searchbar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Buscar empleos: MySQL, Service Designer, Vue..."
                className="searchbar__input"
                aria-label="Buscar empleos"
              />
            </div>
          </form>
          {/* Right actions: theme + auth */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              aria-pressed={isDark}
              title={isDark ? 'Tema oscuro activo' : 'Tema claro activo'}
            >
              {isDark ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M21.752 15.002A9.718 9.718 0 0112 21c-5.385 0-9.75-4.365-9.75-9.75 0-4.076 2.492-7.56 6.002-9.052a.75.75 0 01.967.967A8.25 8.25 0 0012 19.5c3.502 0 6.502-2.138 7.783-5.222a.75.75 0 011.969.724z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.25a.75.75 0 01.75.75v1.5a.75.75 0 11-1.5 0V3a.75.75 0 01.75-.75zm0 15a5.25 5.25 0 100-10.5 5.25 5.25 0 000 10.5zm8.25-5.25a.75.75 0 01.75.75v1.5a.75.75 0 11-1.5 0v-1.5a.75.75 0 01.75-.75zM3 12a.75.75 0 01.75-.75h1.5a.75.75 0 110 1.5H3.75A.75.75 0 013 12zm15.53-6.53a.75.75 0 011.06 1.06l-1.06 1.06a.75.75 0 11-1.06-1.06l1.06-1.06zM5.47 18.53a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 101.06 1.06l1.06-1.06zM18.53 18.53a.75.75 0 01-1.06 0l-1.06-1.06a.75.75 0 111.06-1.06l1.06 1.06a.75.75 0 010 1.06zM6.53 6.53a.75.75 0 10-1.06-1.06L4.41 6.53a.75.75 0 101.06 1.06l1.06-1.06z"/>
                </svg>
              )}
              <span className="sr-only">{isDark ? 'Tema oscuro' : 'Tema claro'}</span>
            </button>
            {isDev && (
              <div className="hidden sm:flex items-center space-x-2 mr-2">
                <button onClick={() => auth?.loginAs('dev-student', Role.STUDENT)} className="text-xs px-2 py-1 border rounded text-gray-600 hover:bg-gray-50">Simular Alumno</button>
                <button onClick={() => auth?.loginAs('dev-company', Role.COMPANY)} className="text-xs px-2 py-1 border rounded text-gray-600 hover:bg-gray-50">Simular Empresa</button>
                <button onClick={() => auth?.loginAs('dev-admin', Role.ADMIN)} className="text-xs px-2 py-1 border rounded text-gray-600 hover:bg-gray-50">Simular Admin</button>
              </div>
            )}
            {auth?.currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(s => !s)}
                  className="px-3 py-2 text-sm font-medium bg-white border rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  {profileName || 'Mi perfil'}
                </button>
                {menuOpen && (
                  <div role="menu" className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg py-1 z-50">
                    <button
                      onClick={() => { setMenuOpen(false); navigate('/dashboard/student/cv'); }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      role="menuitem"
                    >
                      Editar perfil
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); handleLogout(); }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                      role="menuitem"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link 
                  to="/auth/login"
                  className="btn btn--outline btn--md"
                >
                  Iniciar sesión
                </Link>
                <Link 
                  to="/auth/register"
                  className="btn btn--primary btn--md"
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
