import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { Role } from '../types';

const Login: React.FC = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await auth?.login(email, password);
      const user = auth?.currentUser;
      if (!user) return;
      if (!user.emailVerified) {
        navigate('/auth/verify-email');
        return;
      }
      if (user.role === Role.STUDENT) navigate('/dashboard/student');
      else if (user.role === Role.COMPANY) navigate('/dashboard/company');
      else if (user.role === Role.ADMIN) navigate('/dashboard/admin');
      else navigate('/');
    } catch (err: any) {
      setError(err?.message ?? 'Error al iniciar sesión');
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      await auth?.loginWithGoogle();
      // OAuth redirige; no navegamos manualmente aquí
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo iniciar sesión con Google');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Iniciar sesión</h1>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full border rounded-md p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full border rounded-md p-2" />
        </div>
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold">Entrar</button>
      </form>
      <div className="mt-4">
        <button onClick={handleGoogle} className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-md font-semibold">Entrar con Google (Alumnos)</button>
      </div>
      <p className="mt-6 text-sm text-gray-600">¿No tienes cuenta? <Link to="/auth/register" className="text-blue-600 hover:underline">Regístrate</Link></p>
    </div>
  );
};

export default Login;