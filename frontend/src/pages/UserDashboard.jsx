import { useEffect, useState } from 'react';
import axios from 'axios';
import QRCode from 'react-qr-code';
import { useNavigate } from 'react-router-dom';
import { LogOut, RefreshCw, Settings, Save, CheckCircle, AlertCircle } from 'lucide-react';

export default function UserDashboard() {
  const [data, setData] = useState({ balance: 0, qrToken: '', email: '' });
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ email: '', password: '' });
  const [successMsg, setSuccessMsg] = useState(''); 
  const [errorMsg, setErrorMsg] = useState('');     
  const navigate = useNavigate();

  // --- POLLING : Mise à jour auto ---
  useEffect(() => {
    // 1. Appel immédiat
    fetchData();

    // 2. Appel répété toutes les 3 secondes
    const interval = setInterval(() => {
        fetchData(true); // true = mode silencieux (ne redirige pas si erreur pour éviter les sauts)
    }, 3000);

    return () => clearInterval(interval); // Nettoyage quand on quitte la page
  }, []);

  const fetchData = (silent = false) => {
    const token = localStorage.getItem('token');
    if(!token && !silent) { navigate('/'); return; }

    axios.get(import.meta.env.VITE_API_URL + '/api/user/me', { he²ers: { Authorization: `Bearer ${token}` } })
    .then(res => {
        // On met à jour les données seulement si elles ont changé pour éviter les clignotements
        setData(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(res.data)) {
                return res.data;
            }
            return prev;
        });
    })
    .catch(() => {
        if (!silent) navigate('/');
    });
  };

  const handleSettingsSave = async (e) => {
      e.preventDefault();
      const token = localStorage.getItem('token');
      setErrorMsg('');
      setSuccessMsg('');

      if (!settingsForm.email || !settingsForm.email.includes('@')) {
          setErrorMsg("Veuillez saisir une adresse email valide.");
          return;
      }

      try {
          await axios.put(import.meta.env.VITE_API_URL + '/api/user/me', settingsForm, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setSuccessMsg("Profil mis à jour avec succès !");
          setSettingsForm({ ...settingsForm, password: '' });
          fetchData();
          setTimeout(() => { setSuccessMsg(''); setShowSettings(false); }, 2000);
      } catch (err) { setErrorMsg(err.response?.data?.error || "Erreur"); }
  };

  return (
    <div className="min-h-[100dvh] bg-neutral-100 flex flex-col items-center pt-8 px-4 pb-20 font-sans">
      <div className="w-full max-w-sm flex justify-between items-center mb-8">
        <h1 className="text-xl font-bold text-neutral-900">Mon Espace</h1>
        <div className="flex gap-4">
            <button onClick={() => { setSettingsForm({email: data.email, password: ''}); setShowSettings(true); }} className="text-neutral-500 hover:text-neutral-900"><Settings size={20} /></button>
            <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-neutral-500 hover:text-red-600"><LogOut size={20} /></button>
        </div>
      </div>

      <div className="w-full max-w-sm bg-gradient-to-br from-neutral-800 to-black text-white p-6 rounded-2xl shadow-xl mb-8 relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
        <p className="text-neutral-400 text-xs font-medium tracking-widest uppercase mb-1">Solde Restant</p>
        <div className="flex items-baseline gap-2">
          {/* Le solde se mettra à jour tout seul ici */}
          <span className="text-5xl font-bold text-amber-400 transition-all duration-300">{data.balance}</span>
          <span className="text-neutral-400">/ 24 coupes</span>
        </div>
        <div className="mt-6 flex justify-between items-end">
            <div><p className="text-xs text-neutral-500">Membre privilège</p></div>
            <div className="w-16 h-1 bg-neutral-700 rounded-full overflow-hidden"><div className="h-full bg-amber-400 transition-all duration-1000" style={{ width: `${(data.balance / 24) * 100}%` }}></div></div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm w-full max-w-sm flex flex-col items-center text-center animate-fade-in" style={{animationDelay: '0.1s'}}>
        <div className="bg-white p-2 rounded-xl border-2 border-dashed border-neutral-200 mb-4">
          {data.qrToken ? <QRCode value={data.qrToken} size={180} bgColor="#FFFFFF" fgColor="#171717" level="H" /> : <div className="w-[180px] h-[180px] flex items-center justify-center text-neutral-300"><RefreshCw className="animate-spin" /></div>}
        </div>
        <h3 className="font-semibold text-neutral-900 mb-1">Votre Pass Coupe</h3>
        <p className="text-sm text-neutral-500 max-w-[200px]">Présentez ce code à votre coiffeur.</p>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
                <h3 className="text-lg font-bold mb-4">Modifier mon profil</h3>
                <form onSubmit={handleSettingsSave} noValidate className="space-y-4">
                    {successMsg && <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 rounded text-sm flex items-center gap-2"><CheckCircle size={18} /><span>{successMsg}</span></div>}
                    {errorMsg && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded text-sm flex items-center gap-2 animate-shake"><AlertCircle size={18} /><span>{errorMsg}</span></div>}
                    <div><label className="text-xs text-neutral-400 uppercase font-bold">Email</label><input className="w-full p-3 rounded-lg bg-neutral-50 border mt-1 outline-none" type="email" value={settingsForm.email} onChange={e => { setSettingsForm({...settingsForm, email: e.target.value}); setErrorMsg(''); }} /></div>
                    <div><label className="text-xs text-neutral-400 uppercase font-bold">Mot de passe</label><input className="w-full p-3 rounded-lg bg-neutral-50 border mt-1 outline-none" type="password" placeholder="••••••" value={settingsForm.password} onChange={e => setSettingsForm({...settingsForm, password: e.target.value})} /></div>
                    <div className="flex gap-3 pt-2"><button type="button" onClick={() => { setShowSettings(false); setSuccessMsg(''); setErrorMsg(''); }} className="flex-1 py-3 rounded-xl border border-neutral-200 text-neutral-500 font-medium">Annuler</button><button type="submit" className="flex-1 py-3 rounded-xl bg-neutral-900 text-white font-medium flex items-center justify-center gap-2"><Save size={18} /> Valider</button></div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
