
import React, { useContext } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Role } from '../types';

const Header: React.FC = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const isDev = (import.meta as any).env?.DEV ?? false;

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
