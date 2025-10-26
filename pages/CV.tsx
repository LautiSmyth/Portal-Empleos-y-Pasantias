import React, { useContext } from 'react';
import { AuthContext } from '../App';
import { Role } from '../types';
import CVBuilder from '../components/CVBuilder';

const CV: React.FC = () => {
  const auth = useContext(AuthContext);
  const user = auth?.currentUser;

  // Verificar que el usuario esté autenticado y tenga un rol válido
  if (!user || (user.role !== Role.STUDENT && user.role !== Role.ADMIN)) {
    return <div className="text-center text-red-600">Debes iniciar sesión como Alumno o Administrador.</div>;
  }

  // Configurar propiedades según el rol
  const isAdmin = user.role === Role.ADMIN;
  const title = isAdmin ? "Constructor de CV (ADMIN)" : "Constructor de CV";
  const backLink = isAdmin ? "/dashboard/admin" : "/dashboard/student";

  return (
    <CVBuilder
      ownerId={user.id}
      title={title}
      backLink={backLink}
      defaultEmail={user.email || ''}
    />
  );
};

export default CV;