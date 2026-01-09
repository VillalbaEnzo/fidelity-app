import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Scissors, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    // Validation locale simple
    if (!email.includes('@')) {
      setError("Format d'email invalide");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axios.post(import.meta.env.VITE_API_URL + '/api/login', { email, password });
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 px-6 font-sans text-neutral-900">

      {/* Header visuel */}
      <div className="mb-10 text-center animate-fade-in">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border border-neutral-100">
            <Scissors size={32} strokeWidth={1.5} className="text-neutral-800" />
        </div>
        <h1 className="text-3xl font-light tracking-tight text-neutral-900 mb-2">Pacheco</h1>
        <p className="text-sm text-neutral-400 uppercase tracking-widest font-medium">Espace Fidélité</p>
      </div>

      {/* Carte de Connexion */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-neutral-100 p-8 animate-fade-in" style={{animationDelay: '0.1s'}}>

          <h2 className="text-xl font-bold mb-6 text-neutral-800">Bon retour</h2>

          <form onSubmit={handleLogin} noValidate className="space-y-5">

            {/* Message d'erreur Shake */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-600 p-4 rounded-lg text-sm flex items-start gap-3 animate-shake">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide ml-1">Email</label>
              <input
                className={`w-full px-4 py-3.5 rounded-xl bg-neutral-50 border outline-none transition-all
                  ${error ? 'border-red-200 focus:border-red-500 focus:bg-white' : 'border-neutral-200 focus:border-neutral-900 focus:bg-white focus:ring-4 focus:ring-neutral-100'}`}
                type="email"
                placeholder="nom@exemple.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide ml-1">Mot de passe</label>
              <input
                className={`w-full px-4 py-3.5 rounded-xl bg-neutral-50 border outline-none transition-all
                  ${error ? 'border-red-200 focus:border-red-500 focus:bg-white' : 'border-neutral-200 focus:border-neutral-900 focus:bg-white focus:ring-4 focus:ring-neutral-100'}`}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
              />
            </div>

            <button
              disabled={loading}
              className="w-full bg-neutral-900 text-white font-medium py-4 rounded-xl hover:bg-black active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2 group shadow-lg shadow-neutral-200"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Se connecter
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
      </div>

      <div className="mt-8 text-center">
         <p className="text-xs text-neutral-400">© 2026 Pacheco • Coiffeur & barbier</p>
      </div>

    </div>
  );
}
