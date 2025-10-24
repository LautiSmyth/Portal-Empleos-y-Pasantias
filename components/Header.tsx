
import React, { useContext } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Role } from '../types';
import { useTheme } from '../hooks/useTheme';

const Header: React.FC = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const isDev = (import.meta as any).env?.DEV ?? false;
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = () => {
    auth?.logout();
    navigate('/');
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
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700">
              UniJobs Connect
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `text-gray-600 hover:text-blue-600 transition-colors ${isActive ? 'font-semibold text-blue-600' : ''}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/jobs"
              className={({ isActive }) =>
                `text-gray-600 hover:text-blue-600 transition-colors ${isActive ? 'font-semibold text-blue-600' : ''}`
              }
            >
              Jobs
            </NavLink>
            {auth?.currentUser && (
               <NavLink
                to={getDashboardLink()}
                className={({ isActive }) =>
                  `text-gray-600 hover:text-blue-600 transition-colors ${isActive ? 'font-semibold text-blue-600' : ''}`
                }
              >
                Dashboard
              </NavLink>
            )}
          </nav>
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
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Cerrar sesión
              </button>
            ) : (
              <>
                <Link 
                  to="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link 
                  to="/auth/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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
