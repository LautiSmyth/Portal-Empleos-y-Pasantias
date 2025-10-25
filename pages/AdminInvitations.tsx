import React, { useContext } from 'react';
import { AuthContext } from '../App';
import { Role } from '../types';
import { Navigate } from 'react-router-dom';

const AdminInvitations: React.FC = () => {
  const auth = useContext(AuthContext);
  if (!auth?.currentUser || auth.currentUser.role !== Role.ADMIN) {
    return <Navigate to="/" />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Invitaciones</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <p className="text-gray-600">No tienes invitaciones por ahora.</p>
      </div>
    </div>
  );
};

export default AdminInvitations;