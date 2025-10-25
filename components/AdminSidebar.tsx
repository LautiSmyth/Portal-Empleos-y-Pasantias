import React from 'react';
import { NavLink } from 'react-router-dom';
import BriefcaseIcon from './icons/BriefcaseIcon';

const AdminSidebar: React.FC = () => {
  const linkClass = (isActive: boolean) => [
    'side-nav__link whitespace-nowrap',
    isActive ? 'side-nav__link--active' : '',
  ].join(' ');

  return (
    <aside className="ui-card">
      <nav className="side-nav">
        <NavLink to="/jobs" className={({ isActive }) => linkClass(isActive)}>
          <BriefcaseIcon className="side-nav__icon" />
          Empleos para ti
        </NavLink>
        <NavLink to="/dashboard/admin#applications" className={({ isActive }) => linkClass(isActive)}>
          <svg className="side-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
            <path d="M7 8h10M7 12h8M7 16h6" />
          </svg>
          Tus postulaciones
        </NavLink>
        <NavLink to="/dashboard/admin/cv" className={({ isActive }) => linkClass(isActive)}>
          <svg className="side-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Editar perfil
        </NavLink>
        <NavLink to="/dashboard/admin/invitations" className={({ isActive }) => linkClass(isActive)}>
          <svg className="side-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 8V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v1" />
            <path d="M3 13l4-4h10l4 4" />
            <path d="M21 16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2" />
          </svg>
          Invitaciones
        </NavLink>
        <NavLink to="/dashboard/admin" end className={({ isActive }) => linkClass(isActive)}>
          <svg className="side-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12l2-2 4 4 8-8 4 4" />
            <path d="M21 16v4H3v-4" />
          </svg>
          Panel admin
        </NavLink>
      </nav>
    </aside>
  );
};

export default AdminSidebar;