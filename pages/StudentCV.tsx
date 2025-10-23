import React, { useContext } from 'react';
import { AuthContext } from '../App';
import { Role } from '../types';
import CVBuilder from '../components/CVBuilder';

const StudentCV: React.FC = () => {
  const auth = useContext(AuthContext);
  const user = auth?.currentUser;

  if (!user || (user.role !== Role.STUDENT && user.role !== Role.ADMIN)) {
    return <div className="text-center text-red-600">Debes iniciar sesión como Alumno.</div>;
  }

  return (
    <CVBuilder
      ownerId={user.id}
      title="Constructor de CV"
      backLink="/dashboard/student"
      defaultEmail={user.email || ''}
    />
  );
};

export default StudentCV;