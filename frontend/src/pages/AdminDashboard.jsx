import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LogOut, Check, X, Camera, Trash2, Plus, Users, Pencil, Save, CheckCircle, AlertCircle, Shield, Scissors, Dices } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('scan');
  const [users, setUsers] = useState([]);

  // États CRUD
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ email: '', password: '', balance: 24, role: 'user' });
  const [showModal, setShowModal] = useState(false);
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalError, setModalError] = useState('');

  // États Scanner
  const [scanResult, setScanResult] = useState(null);
  const [data, setData] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [permissionError, setPermissionError] = useState(false); // Pour gérer le refus caméra
  const navigate = useNavigate();
  const scannerRef = useRef(null);

  const generateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let pass = "";
    for (let i = 0; i < 6; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password: pass });
  };
  // --- LOGIQUE SCANNER ---
  useEffect(() => {
    // Si on n'est pas en mode scan ou caméra éteinte, on nettoie tout
    if (activeTab !== 'scan' || !isCameraActive) {
        if (scannerRef.current) {
            scannerRef.current = null;
        }
        const reader = document.getElementById("reader");
        if(reader) reader.innerHTML = "";
        return;
    }

    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    // Démarrage de la caméra
    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => handleScan(decodedText, html5QrCode),
      () => {} // Erreur de scan silencieuse (pas de QR détecté frame par frame)
    ).catch((err) => {
        console.error("Erreur caméra:", err);
        setPermissionError(true);
        setIsCameraActive(false); // On éteint l'état caméra pour revenir au bouton
    });

    return () => {
       if (html5QrCode.isScanning) {
           html5QrCode.stop().then(() => html5QrCode.clear()).catch(()=>{});
       }
    };
  }, [isCameraActive, activeTab]);

  const handleScan = async (qrData, scannerInstance) => {
    scannerInstance.pause();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(import.meta.env.VITE_API_URL + '/api/admin/scan', 
        { qrData }, { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(res.data);
      setScanResult('success');
    } catch (err) {
      setData(err.response?.data || { error: "Erreur inconnue" });
      setScanResult('error');
    }

    // Délai avant de relancer le scan
    setTimeout(() => {
        setScanResult(null);
        setData(null);
        try{ scannerInstance.resume(); } catch(e){}
    }, 3500);
  };

  // --- LOGIQUE UTILISATEURS ---
  const fetchUsers = async () => {
      const token = localStorage.getItem('token');
      try {
          const res = await axios.get(import.meta.env.VITE_API_URL + '/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
          setUsers(res.data);
      } catch (err) { console.error(err); }
  };

  const openModal = (user = null) => {
    setEditingUser(user);
    setModalSuccess(''); setModalError('');
    if (user) setFormData({ email: user.email, password: '', balance: user.balance, role: user.role || 'user' });
    else setFormData({ email: '', password: '', balance: 24, role: 'user' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
      e.preventDefault();
      setModalError(''); setModalSuccess('');

      if (!formData.email || !formData.email.includes('@')) {
        setModalError("Veuillez saisir une adresse email valide.");
        return;
      }

      const token = localStorage.getItem('token');
      try {
          if (editingUser) {
              await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/users/${editingUser._id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
              setModalSuccess("Utilisateur mis à jour !");
          } else {
              await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/users`, formData, { headers: { Authorization: `Bearer ${token}` } });
              setModalSuccess("Utilisateur créé avec succès !");
              setFormData({ email: '', password: '', balance: 24, role: 'user' });
          }
          fetchUsers();
          setTimeout(() => { setShowModal(false); setModalSuccess(''); }, 1500);
      } catch (err) { setModalError(err.response?.data?.error || "Erreur"); }
  };

  const handleDelete = async (id) => {
      if(!confirm("Supprimer cet utilisateur ?")) return;
      const token = localStorage.getItem('token');
      try {
          await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          fetchUsers();
      } catch (err) { alert("Erreur suppression"); }
  };

  useEffect(() => { if(activeTab === 'list') fetchUsers(); }, [activeTab]);

  return (
    <div className="flex flex-col h-[100dvh] bg-neutral-50 text-neutral-900 font-sans overflow-hidden">

      {/* Header fixe */}
      <header className="px-6 py-4 flex justify-between items-center bg-white shadow-sm z-20 shrink-0 h-16">
        <div>
          <h1 className="text-lg font-bold text-neutral-900">Pacheco • Admin</h1>
          <p className="text-neutral-400 text-[10px] uppercase tracking-widest">{activeTab === 'scan' ? 'Scanner' : 'Gestion Utilisateurs'}</p>
        </div>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="p-2 bg-neutral-100 rounded-full text-neutral-500"><LogOut size={18} /></button>
      </header>

      {/* Main scrollable */}
      <main className="flex-1 overflow-hidden relative w-full">

        {/* Vue Scanner */}
    {activeTab === 'scan' && (
    <div className="h-full flex flex-col items-center justify-center p-6 animate-fade-in w-full">
        {permissionError && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-center text-sm max-w-xs border border-red-100">
                <AlertCircle className="mx-auto mb-2" />
                <p>L'accès à la caméra a été refusé.</p>
            </div>
        )}

        {/* --- CHANGEMENT ICI : On garde les deux blocs dans le DOM, on joue sur 'hidden' --- */}
        {/* Bloc d'activation (Bouton) */}
        <div className={`text-center ${isCameraActive ? 'hidden' : 'block'}`}>
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border border-neutral-100">
                <Camera size={32} className="text-neutral-300" />
            </div>
            <button onClick={() => { setPermissionError(false); setIsCameraActive(true); }} className="px-6 py-3 bg-neutral-900 text-white rounded-xl shadow-lg font-medium flex items-center gap-2 mx-auto">
                <Camera size={18} /> Activer la caméra
            </button>
        </div>

        {/* Bloc Caméra (Scanner) */}
        <div className={`w-full max-w-sm relative flex flex-col items-center ${isCameraActive ? 'block' : 'hidden'}`}>
             <div className="relative w-full aspect-square bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                {/* La div reader existe toujours, donc pas de crash au stop() */}
                <div id="reader" className="w-full h-full"></div>
             </div>
             <button onClick={() => {setIsCameraActive(false)}} className="mt-8 px-6 py-3 bg-white border border-neutral-200 rounded-xl text-sm font-medium shadow-sm text-red-500">Arrêter la caméra</button>
        </div>
    </div>
    )}

        {/* Vue Liste */}
        {activeTab === 'list' && (
            <div className="h-full overflow-y-auto p-4 animate-fade-in w-full pb-24">
                <button onClick={() => openModal()} className="w-full bg-neutral-900 text-white p-4 rounded-xl font-medium mb-6 flex justify-center items-center gap-2 shadow-lg">
                    <Plus size={20} /> Ajouter un utilisateur
                </button>

                <div className="space-y-3">
                    {users.map(u => (
                        <div key={u._id} className={`p-4 rounded-xl shadow-sm border flex justify-between items-center ${u.role === 'admin' ? 'bg-neutral-100 border-neutral-200' : 'bg-white border-neutral-100'}`}>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-sm text-neutral-800">{u.email}</p>
                                    {u.role === 'admin' && <span className="bg-neutral-900 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1"><Scissors size={8} /> Coiffeur</span>}
                                </div>
                                {u.role === 'user' ? <p className="text-xs text-neutral-400">Solde: <span className="text-amber-500 font-bold">{u.balance}</span></p> : <p className="text-[10px] text-neutral-400 italic mt-0.5">Accès Gestionnaire</p>}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => openModal(u)} className="p-2 bg-white border border-neutral-100 rounded-lg text-neutral-400 hover:text-blue-600"><Pencil size={16} /></button>
                                {u.role !== 'admin' && (
                                <button onClick={() => handleDelete(u._id)} className="p-2 bg-white border border-neutral-100 rounded-lg text-neutral-400 hover:text-red-600">
                                    <Trash2 size={16} />
                                </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </main>

      {/* Modal & Overlay restent ici... (J'ai coupé pour la lisibilité mais garde le même code de modal qu'avant) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                <h3 className="text-lg font-bold mb-4">{editingUser ? 'Modifier' : 'Nouveau'}</h3>
                <form onSubmit={handleSave} noValidate className="space-y-4">
                    {modalSuccess && <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 rounded text-sm flex items-center gap-2"><CheckCircle size={18} /><span>{modalSuccess}</span></div>}
                    {modalError && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded text-sm flex items-center gap-2 animate-shake"><AlertCircle size={18} /><span>{modalError}</span></div>}
                    <div><label className="text-xs text-neutral-400 uppercase font-bold">Statut</label><div className="relative mt-1"><select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-3 rounded-lg bg-neutral-50 border border-neutral-200 outline-none"><option value="user">Client</option><option value="admin">Coiffeur</option></select></div></div>
                    <div><label className="text-xs text-neutral-400 uppercase font-bold">Email</label><input className="w-full p-3 rounded-lg bg-neutral-50 border mt-1 outline-none" type="email" value={formData.email} onChange={e => { setFormData({...formData, email: e.target.value}); setModalError(''); }} required /></div>
                    <div>
                        <label className="text-xs text-neutral-400 uppercase font-bold">Mot de passe</label>
                        <div className="flex gap-2 mt-1">
                            <input 
                                className="w-full p-3 rounded-lg bg-neutral-50 border outline-none" 
                                type="text" 
                                placeholder={editingUser ? "Laisser vide pour ne pas changer" : "Obligatoire"} 
                                value={formData.password} 
                                onChange={e => setFormData({...formData, password: e.target.value})} 
                            />
                            {/* Bouton de génération aléatoire */}
                            <button 
                                type="button" 
                                onClick={generateRandomPassword}
                                className="p-3 bg-neutral-100 border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-200"
                                title="Générer aléatoire"
                            >
                                <Dices size={20} />
                            </button>
                        </div>
                    </div>
                    {formData.role === 'user' && (<div><label className="text-xs text-neutral-400 uppercase font-bold">Solde</label><input className="w-full p-3 rounded-lg bg-neutral-50 border mt-1 font-mono text-lg outline-none" type="number" value={formData.balance} onChange={e => setFormData({...formData, balance: e.target.value})} /></div>)}
                    <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-neutral-200 text-neutral-500 font-medium">Annuler</button><button type="submit" className="flex-1 py-3 rounded-xl bg-neutral-900 text-white font-medium flex items-center justify-center gap-2"><Save size={18} /> Sauvegarder</button></div>
                </form>
            </div>
        </div>
      )}

      {/* Overlay Résultat Scan */}
      <div className={`fixed inset-x-0 bottom-0 p-6 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] transform transition-transform duration-300 ease-out z-50 ${scanResult ? 'translate-y-0' : 'translate-y-full'}`}>
        {scanResult === 'success' && <div className="text-center"><div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600"><Check size={24} /></div><h2 className="text-lg font-bold mb-1">Validé !</h2><p className="text-sm text-neutral-500">Nouveau solde : <b>{data?.newBalance}/24</b></p></div>}
        {scanResult === 'error' && <div className="text-center"><div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-red-600"><X size={24} /></div><h2 className="text-lg font-bold mb-1">Erreur</h2><p className="text-sm text-neutral-500">{data?.error}</p></div>}
      </div>

      {/* Navbar Basse */}
      <nav className="bg-white border-t border-neutral-100 flex justify-around p-2 pb-safe z-30 shrink-0 h-16">
          <button onClick={() => setActiveTab('scan')} className={`flex flex-col items-center justify-center p-2 w-full transition-colors ${activeTab === 'scan' ? 'text-neutral-900' : 'text-neutral-300'}`}><Camera size={24} /><span className="text-[10px] font-medium mt-1">Scanner</span></button>
          <button onClick={() => setActiveTab('list')} className={`flex flex-col items-center justify-center p-2 w-full transition-colors ${activeTab === 'list' ? 'text-neutral-900' : 'text-neutral-300'}`}><Users size={24} /><span className="text-[10px] font-medium mt-1">Utilisateurs</span></button>
      </nav>
    </div>
  );
}
