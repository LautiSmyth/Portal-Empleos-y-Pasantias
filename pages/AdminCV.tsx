import React, { useContext } from 'react';
import { AuthContext } from '../App';
import { Role } from '../types';
import CVBuilder from '../components/CVBuilder';

const AdminCV: React.FC = () => {
  const auth = useContext(AuthContext);

  if (!auth?.currentUser || auth.currentUser.role !== Role.ADMIN) {
    return <div className="text-center text-red-600">Debes iniciar sesión como ADMIN.</div>;
  }

  const user = auth.currentUser;

  return (
    <CVBuilder
      ownerId={user.id}
      title={"Constructor de CV (ADMIN)"}
      backLink="/dashboard/admin"
      defaultEmail={user.email || ''}
    />
  );
};

export default AdminCV;