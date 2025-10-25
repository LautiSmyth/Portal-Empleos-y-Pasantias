import React from 'react';
import { NavLink } from 'react-router-dom';
import BriefcaseIcon from './icons/BriefcaseIcon';

const StudentSidebar: React.FC = () => {
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
        <NavLink to="/dashboard/student" end className={({ isActive }) => linkClass(isActive)}>
          <svg className="side-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
            <path d="M7 8h10M7 12h8M7 16h6" />
          </svg>
          Tus postulaciones
        </NavLink>
        <NavLink to="/dashboard/student/cv" className={({ isActive }) => linkClass(isActive)}>
          <svg className="side-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Editar perfil
        </NavLink>
        <NavLink to="/dashboard/student/invitations" className={({ isActive }) => linkClass(isActive)}>
          <svg className="side-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 4h16v16H4z" />
            <path d="M4 7l8 5 8-5" />
          </svg>
          Invitaciones
        </NavLink>
      </nav>
    </aside>
  );
};

export default StudentSidebar;