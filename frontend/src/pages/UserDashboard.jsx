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

  // 1. Chargement initial (QR Code + Solde + Email) - UNE SEULE FOIS
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }

    axios.get(import.meta.env.VITE_API_URL + '/api/user/me', { headers: { Authorization: `Bearer ${token}` } })
    .then(res => setData(res.data))
    .catch(() => navigate('/'));
  }, []); // [] vide = s'exécute une seule fois au chargement

  // 2. Polling uniquement sur le solde (toutes les 3s)
  useEffect(() => {
    const interval = setInterval(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Appel à la route légère (Assure-toi d'avoir ajouté la route /balance dans le backend)
        axios.get(import.meta.env.VITE_API_URL + '/api/user/balance', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
            // Mise à jour uniquement du solde si changement
            setData(prev => {
                if (prev.balance !== res.data.balance) {
                    return { ...prev, balance: res.data.balance };
                }
                return prev;
            });
        })
        .catch(err => console.log("Polling silent error"));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleSettingsSave = async (e) => {
      e.preventDefault();
      const token = localStorage.getItem('token');
      setErrorMsg(''); setSuccessMsg('');

      // On n'envoie que le password désormais
      if (!settingsForm.password) {
        setErrorMsg("Veuillez entrer un mot de passe.");
        return;
      }

      try {
          await axios.put(import.meta.env.VITE_API_URL + '/api/user/me', { password: settingsForm.password }, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setSuccessMsg("Mot de passe mis à jour avec succès !");
          setSettingsForm({ ...settingsForm, password: '' });
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
          {/* Transition douce quand le chiffre change */}
          <span className="text-5xl font-bold text-amber-400 transition-all duration-500">{data.balance}</span>
          <span className="text-neutral-400">/ 24 coupes</span>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm w-full max-w-sm flex flex-col items-center text-center animate-fade-in" style={{animationDelay: '0.1s'}}>
        <div className="bg-white p-2 rounded-xl border-2 border-dashed border-neutral-200 mb-4">
          {/* Le QR Code ne clignote plus car qrToken n'est plus mis à jour par le polling */}
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
                    <div>
                      <label className="text-xs text-neutral-400 uppercase font-bold">Email</label>
                      <input 
                          className="w-full p-3 rounded-lg bg-neutral-200 border mt-1 outline-none text-neutral-500 cursor-not-allowed" 
                          type="email" 
                          value={settingsForm.email} 
                          disabled={true} // <--- DÉSACTIVÉ
                          readOnly 
                      />
                      <p className="text-[10px] text-neutral-400 mt-1">L'email ne peut pas être modifié.</p>
                    </div>
                    <div><label className="text-xs text-neutral-400 uppercase font-bold">Nouveau mot de passe</label><input className="w-full p-3 rounded-lg bg-neutral-50 border mt-1 outline-none" type="password" placeholder="••••••" value={settingsForm.password} onChange={e => setSettingsForm({...settingsForm, password: e.target.value})} /></div>
                    <div className="flex gap-3 pt-2"><button type="button" onClick={() => { setShowSettings(false); setSuccessMsg(''); setErrorMsg(''); }} className="flex-1 py-3 rounded-xl border border-neutral-200 text-neutral-500 font-medium">Annuler</button><button type="submit" className="flex-1 py-3 rounded-xl bg-neutral-900 text-white font-medium flex items-center justify-center gap-2"><Save size={18} /> Valider</button></div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}