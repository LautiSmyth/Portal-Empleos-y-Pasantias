import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Role } from '../types';

const VerifyEmail: React.FC = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pendingEmail = (auth?.currentUser?.email || localStorage.getItem('pending_verification_email') || '') as string;

  useEffect(() => {
    // Al cargar, intenta refrescar para detectar si ya quedó verificado vía enlace
    (async () => {
      await auth?.verifyEmail();
    })();
  }, []);

  const handleResend = async () => {
    setError(null);
    setMessage(null);
    try {
      await auth?.resendVerificationEmail();
      setMessage('Hemos reenviado el correo de verificación. Revisa tu bandeja y spam.');
    } catch (err: any) {
      setError(err?.message || 'No se pudo reenviar el email.');
    }
  };

  const handleContinue = () => {
    const user = auth?.currentUser;
    if (!user) return navigate('/');
    if (!user.emailVerified) {
      setError('Tu correo aún no aparece como verificado. Por favor, usa el enlace del email para confirmar.');
      return;
    }
    if (user.role === Role.STUDENT) return navigate('/dashboard/student');
    if (user.role === Role.COMPANY) return navigate('/dashboard/company');
    if (user.role === Role.ADMIN) return navigate('/dashboard/admin');
    navigate('/');
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Verifica tu correo</h1>
      <p className="text-gray-700 mb-4">
        Te enviamos un correo a <strong>{pendingEmail || 'tu dirección registrada'}</strong> con un enlace único de verificación.
        Abre ese mensaje y haz clic en el enlace para confirmar tu cuenta.
      </p>
      <p className="text-gray-600 mb-6">
        Si no lo encuentras, revisa la carpeta de spam o solicita reenviarlo.
      </p>

      {message && <div className="mb-4 text-green-700">{message}</div>}
      {error && <div className="mb-4 text-red-600">{error}</div>}

      <div className="space-y-3">
        <button onClick={handleResend} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-semibold">
          Reenviar correo de verificación
        </button>
        <button onClick={handleContinue} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold">
          Continuar
        </button>
      </div>
    </div>
  );
};

export default VerifyEmail;