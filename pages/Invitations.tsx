import React, { useContext } from 'react';
import { AuthContext } from '../App';
import { Role } from '../types';
import { Navigate } from 'react-router-dom';

const Invitations: React.FC = () => {
  const auth = useContext(AuthContext);
  
  // Verificar que el usuario esté autenticado y tenga un rol válido
  if (!auth?.currentUser || (auth.currentUser.role !== Role.ADMIN && auth.currentUser.role !== Role.STUDENT)) {
    return <Navigate to="/" />;
  }

  const isAdmin = auth.currentUser.role === Role.ADMIN;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Invitaciones</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <p className="text-gray-600">
          {isAdmin 
            ? "No tienes invitaciones por ahora." 
            : "No tienes invitaciones por ahora."
          }
        </p>
      </div>
    </div>
  );
};

export default Invitations;