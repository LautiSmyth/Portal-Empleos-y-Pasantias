import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { Role } from '../types';

const Register: React.FC = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [role, setRole] = useState<Role>(Role.STUDENT);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    try {
      await auth?.register(email, password, role, name);
      navigate('/auth/verify-email');
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo registrar');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Crear cuenta</h1>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Rol</label>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="mt-1 w-full border rounded-md p-2">
            <option value={Role.STUDENT}>Alumno</option>
            <option value={Role.COMPANY}>Empresa</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 w-full border rounded-md p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full border rounded-md p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full border rounded-md p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Confirmar contraseña</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="mt-1 w-full border rounded-md p-2" />
        </div>
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold">Registrarme</button>
      </form>
      <p className="mt-6 text-sm text-gray-600">¿Ya tienes cuenta? <Link to="/auth/login" className="text-blue-600 hover:underline">Inicia sesión</Link></p>
    </div>
  );
};

export default Register;