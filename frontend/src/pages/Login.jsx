import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Scissors, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError("Format d'email invalide.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      if(res.data.role === 'admin') navigate('/admin');
      else navigate('/user');
    } catch (err) {
      setError("Email ou mot de passe incorrect.");
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-900 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-neutral-100 p-4 rounded-full shadow-sm">
              <Scissors className="w-8 h-8 text-neutral-900" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-center text-neutral-900 mb-1">Pacheco • Coiffeur & barbier </h2>
          <p className="text-center text-neutral-500 mb-8 text-sm">Espace Fidélité</p>

          <form onSubmit={handleLogin} noValidate className="space-y-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded text-sm flex items-center gap-2 animate-shake">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 ml-1">Email</label>
              <input
                className={`w-full px-4 py-3 rounded-lg bg-neutral-50 border focus:ring-1 outline-none transition-all
                  ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-neutral-200 focus:border-neutral-900 focus:ring-neutral-200'}`}
                type="email"
                required
                placeholder="client@exemple.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 ml-1">Mot de passe</label>
              <input
                className={`w-full px-4 py-3 rounded-lg bg-neutral-50 border focus:ring-1 outline-none transition-all
                  ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-neutral-200 focus:border-neutral-900 focus:ring-neutral-200'}`}
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
              />
            </div>
            <button
              disabled={loading}
              className="w-full bg-neutral-900 text-white font-medium py-3.5 rounded-lg hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Connexion...
                </span>
              ) : 'Se connecter'}
            </button>
          </form>
        </div>
        <div className="bg-neutral-50 px-8 py-4 border-t border-neutral-100 text-center">
          <p className="text-xs text-neutral-400">© 2026 Pacheco • Coiffeur & barbier </p>
        </div>
      </div>
    </div>
  );
}
