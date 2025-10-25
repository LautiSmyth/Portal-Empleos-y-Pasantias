import React, { useContext } from 'react';
import { AuthContext } from '../App';
import { Role } from '../types';
import { Navigate } from 'react-router-dom';

const AdminApplications: React.FC = () => {
  const auth = useContext(AuthContext);
  if (!auth?.currentUser || auth.currentUser.role !== Role.ADMIN) {
    return <Navigate to="/" />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Moderación de postulaciones</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <p className="text-gray-600">Aquí podrás revisar y moderar las postulaciones recientes.</p>
        <p className="text-gray-500 text-sm mt-2">(Vista básica; funcionalidad avanzada puede integrarse desde el panel principal.)</p>
      </div>
    </div>
  );
};

export default AdminApplications;