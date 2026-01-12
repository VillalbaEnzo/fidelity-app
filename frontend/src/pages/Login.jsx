import { useState, useEffect } from 'react'; // Ajout de useEffect
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Scissors, AlertCircle, ArrowRight, Server } from 'lucide-react'; // Ajout icone Server

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // --- NOUVEAU : État pour le réveil du serveur ---
  const [isServerWakingUp, setIsServerWakingUp] = useState(true);
  // ------------------------------------------------

  const navigate = useNavigate();

  // --- NOUVEAU : Ping le serveur au chargement de la page ---
  useEffect(() => {
    const wakeUpServer = async () => {
      try {
        await axios.get(import.meta.env.VITE_API_URL + '/api/ping');
        
        // --- TRICHE POUR LE TEST (A supprimer après) ---
        // On attend 5 secondes avant de dire que c'est bon
        setTimeout(() => {
            setIsServerWakingUp(false);
        }, 5000); 
        // -----------------------------------------------

      } catch (err) {
        // En cas d'erreur, on laisse aussi le délai pour voir l'effet
        setTimeout(() => {
            setIsServerWakingUp(false);
        }, 5000);
      }
    };
    wakeUpServer();
  }, []);
  // -----------------------------------------------------------

  const handleLogin = async (e) => {
    e.preventDefault();

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

      <div className="mb-10 text-center animate-fade-in">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border border-neutral-100">
            <Scissors size={32} strokeWidth={1.5} className="text-neutral-800" />
        </div>
        <h1 className="text-3xl font-light tracking-tight text-neutral-900 mb-2">Pacheco</h1>
        <p className="text-sm text-neutral-400 uppercase tracking-widest font-medium">Espace Fidélité</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-neutral-100 p-8 animate-fade-in relative overflow-hidden" style={{animationDelay: '0.1s'}}>
          
          {/* --- NOUVEAU : Barre de chargement Serveur Render --- */}
          {isServerWakingUp && (
            <div className="absolute top-0 left-0 w-full bg-amber-50 border-b border-amber-100 p-3 flex items-center justify-center gap-3 animate-pulse z-10">
                <Server size={16} className="text-amber-600 animate-bounce" />
                <span className="text-xs font-medium text-amber-700">Démarrage serveur...</span>
                {/* Barre de progression infinie en bas du bandeau */}
                <div className="absolute bottom-0 left-0 h-[2px] bg-amber-200 w-full overflow-hidden">
                    <div className="w-full h-full bg-amber-500 origin-left animate-[loading_1.5s_ease-in-out_infinite]"></div>
                </div>
            </div>
          )}
          {/* -------------------------------------------------- */}

          <h2 className={`text-xl font-bold mb-6 text-neutral-800 ${isServerWakingUp ? 'mt-8' : ''}`}>Bon retour</h2>

          <form onSubmit={handleLogin} noValidate className="space-y-5">
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
              disabled={loading || isServerWakingUp} // On désactive aussi si le serveur se réveille (optionnel, mais conseillé pour éviter les timeouts)
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
      
      {/* Style inline pour l'animation de la barre */}
      <style>{`
        @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}