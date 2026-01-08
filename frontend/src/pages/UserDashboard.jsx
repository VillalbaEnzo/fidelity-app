import { useEffect, useState } from 'react';
import axios from 'axios';
import QRCode from 'react-qr-code';
import { useNavigate } from 'react-router-dom';
import { LogOut, RefreshCw, Settings, Save } from 'lucide-react';

export default function UserDashboard() {
  const [data, setData] = useState({ balance: 0, qrToken: '', email: '' }); // Ajout email dans state
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  useEffect(() => { fetchData(); }, []);

  const fetchData = () => {
    const token = localStorage.getItem('token');
    // Le backend renvoie aussi l'email maintenant (vérifie ton token si besoin, ou on le recupère ici)
    axios.get(import.meta.env.VITE_API_URL + '/api/user/me', { headers: { Authorization: `Bearer ${token}` } })
    .then(res => {
        setData(res.data);
        // On initialise le formulaire avec l'email actuel (si dispo, sinon on décode ou on laisse vide)
    })
    .catch(() => navigate('/'));
  };

  const handleSettingsSave = async (e) => {
      e.preventDefault();
      const token = localStorage.getItem('token');
      try {
          await axios.put(import.meta.env.VITE_API_URL + '/api/user/me', settingsForm, {
              headers: { Authorization: `Bearer ${token}` }
          });
          alert("Profil mis à jour !");
          setShowSettings(false);
          setSettingsForm({ ...settingsForm, password: '' }); // Reset password field only
          fetchData(); // Rafraichir les données (pour l'email)
      } catch (err) {
          alert("Erreur : Email déjà pris ou invalide");
      }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col items-center pt-8 px-4 pb-20">
      <div className="w-full max-w-sm flex justify-between items-center mb-8">
        <h1 className="text-xl font-bold text-neutral-900">Mon Espace</h1>
        <div className="flex gap-4">
            <button onClick={() => { setSettingsForm({email: '', password: ''}); setShowSettings(true); }} className="text-neutral-500 hover:text-neutral-900 transition-colors">
                <Settings size={20} />
            </button>
            <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-neutral-500 hover:text-red-600 transition-colors">
                <LogOut size={20} />
            </button>
        </div>
      </div>

      <div className="w-full max-w-sm bg-gradient-to-br from-neutral-800 to-black text-white p-6 rounded-2xl shadow-xl mb-8 relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
        <p className="text-neutral-400 text-xs font-medium tracking-widest uppercase mb-1">Solde Restant</p>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold text-amber-400">{data.balance}</span>
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
        <p className="text-sm text-neutral-500 max-w-[200px]">Présentez ce code à votre coiffeur pour valider votre passage.</p>
      </div>

      {/* MODAL RÉGLAGES UTILISATEUR */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
                <h3 className="text-lg font-bold mb-4">Modifier mon profil</h3>
                <form onSubmit={handleSettingsSave} className="space-y-4">
                    <div>
                        <label className="text-xs text-neutral-400 uppercase font-bold">Nouvel Email</label>
                        <input className="w-full p-3 rounded-lg bg-neutral-50 border border-neutral-200 mt-1" type="email" placeholder="Nouvel email (optionnel)" value={settingsForm.email} onChange={e => setSettingsForm({...settingsForm, email: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs text-neutral-400 uppercase font-bold">Nouveau mot de passe</label>
                        <input className="w-full p-3 rounded-lg bg-neutral-50 border border-neutral-200 mt-1" type="password" placeholder="•••••• (laisser vide si inchangé)" value={settingsForm.password} onChange={e => setSettingsForm({...settingsForm, password: e.target.value})} />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setShowSettings(false)} className="flex-1 py-3 rounded-xl border border-neutral-200 text-neutral-500 font-medium">Annuler</button>
                        <button type="submit" className="flex-1 py-3 rounded-xl bg-neutral-900 text-white font-medium flex items-center justify-center gap-2"><Save size={18} /> Valider</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
