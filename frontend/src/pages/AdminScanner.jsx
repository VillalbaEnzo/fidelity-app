import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LogOut, Check, X, User, Camera, Trash2, Plus, Users, Search } from 'lucide-react';

export default function AdminScanner() {
  // --- STATES ---
  const [activeTab, setActiveTab] = useState('scan'); // 'scan' ou 'list'
  const [users, setUsers] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('');

  // States Scanner
  const [scanResult, setScanResult] = useState(null);
  const [data, setData] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const navigate = useNavigate();
  const scannerRef = useRef(null);

  // --- LOGIQUE SCANNER ---
  useEffect(() => {
    if (activeTab !== 'scan' || !isCameraActive) {
        if (scannerRef.current) {
            scannerRef.current.stop().catch(() => {}).then(() => scannerRef.current.clear().catch(() => {}));
            scannerRef.current = null;
        }
        return;
    }

    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => handleScan(decodedText, html5QrCode),
      () => {}
    ).catch((err) => {
      console.error(err);
      setIsCameraActive(false);
      setPermissionError(true);
    });

    return () => {
      if (html5QrCode.isScanning) html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
    };
  }, [isCameraActive, activeTab]);

  const handleScan = async (qrData, scannerInstance) => {
    scannerInstance.pause();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/scan`,
        { qrData }, { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(res.data);
      setScanResult('success');
    } catch (err) {
      setData(err.response?.data || { error: "Erreur inconnue" });
      setScanResult('error');
    }
    setTimeout(() => {
        setScanResult(null);
        setData(null);
        try { scannerInstance.resume(); } catch(e) {}
    }, 3500);
  };

  // --- LOGIQUE CLIENTS ---
  const fetchUsers = async () => {
      const token = localStorage.getItem('token');
      try {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setUsers(res.data);
      } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
      if(!confirm("Supprimer ce client ?")) return;
      const token = localStorage.getItem('token');
      try {
          await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          fetchUsers(); // Rafraichir la liste
      } catch (err) { alert("Erreur suppression"); }
  };

  const handleAddUser = async (e) => {
      e.preventDefault();
      const token = localStorage.getItem('token');
      try {
          await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/users`,
            { email: newUserEmail, password: newUserPass },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setNewUserEmail(''); setNewUserPass('');
          fetchUsers();
          alert("Client ajouté !");
      } catch (err) { alert(err.response?.data?.error || "Erreur ajout"); }
  };

  // Charger la liste quand on clique sur l'onglet
  useEffect(() => {
      if(activeTab === 'list') fetchUsers();
  }, [activeTab]);

  return (
    <div className="flex flex-col h-screen bg-neutral-50 text-neutral-900 font-sans">
      
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center bg-white shadow-sm z-20">
        <div>
          <h1 className="text-lg font-bold text-neutral-900">Atelier Admin</h1>
          <p className="text-neutral-400 text-[10px] uppercase tracking-widest">
             {activeTab === 'scan' ? 'Mode Scanner' : 'Gestion Clients'}
          </p>
        </div>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="p-2 bg-neutral-100 rounded-full text-neutral-500">
          <LogOut size={18} />
        </button>
      </header>

      {/* Contenu Principal */}
      <main className="flex-1 overflow-hidden relative">
        
        {/* --- VUE SCANNER --- */}
        {activeTab === 'scan' && (
            <div className="h-full flex flex-col items-center justify-center p-6 animate-fade-in">
                {permissionError && <p className="text-red-500 mb-4 text-sm bg-red-50 p-3 rounded">Activez la caméra dans les réglages.</p>}
                
                {!isCameraActive ? (
                    <div className="text-center">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                            <Camera size={32} className="text-neutral-300" />
                        </div>
                        <button onClick={() => { setPermissionError(false); setIsCameraActive(true); }} className="px-6 py-3 bg-neutral-900 text-white rounded-xl shadow-lg font-medium flex items-center gap-2 mx-auto">
                            <Camera size={18} /> Lancer le Scan
                        </button>
                    </div>
                ) : (
                    <div className="w-full max-w-sm relative">
                         <div className="relative w-full aspect-square bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                            <div id="reader" className="w-full h-full absolute inset-0 [&>video]:object-cover [&>video]:w-full [&>video]:h-full"></div>
                            {!scanResult && (
                                <div className="absolute inset-0 pointer-events-none z-20 border-[40px] border-black/30">
                                    <div className="w-full h-[2px] bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.8)] absolute top-1/2 animate-pulse"></div>
                                </div>
                            )}
                         </div>
                         <button onClick={() => setIsCameraActive(false)} className="mt-6 text-sm text-neutral-400 underline w-full text-center">Arrêter</button>
                    </div>
                )}
            </div>
        )}

        {/* --- VUE LISTE CLIENTS --- */}
        {activeTab === 'list' && (
            <div className="h-full overflow-y-auto p-4 animate-fade-in pb-24">
                
                {/* Formulaire Ajout */}
                <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-neutral-100">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Plus size={16}/> Nouveau Client</h3>
                    <form onSubmit={handleAddUser} className="flex flex-col gap-3">
                        <input className="bg-neutral-50 p-3 rounded-lg text-sm border-transparent focus:border-neutral-300 focus:ring-0" placeholder="Email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} required />
                        <input className="bg-neutral-50 p-3 rounded-lg text-sm border-transparent focus:border-neutral-300 focus:ring-0" placeholder="Mot de passe provisoire" value={newUserPass} onChange={e => setNewUserPass(e.target.value)} required />
                        <button className="bg-neutral-900 text-white p-3 rounded-lg text-sm font-medium">Ajouter</button>
                    </form>
                </div>

                {/* Liste */}
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3 ml-1">Clients existants ({users.length})</h3>
                <div className="space-y-2">
                    {users.map(u => (
                        <div key={u._id} className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-sm">{u.email}</p>
                                <p className="text-xs text-neutral-400">Solde: <span className="text-amber-500 font-bold">{u.balance}</span></p>
                            </div>
                            <button onClick={() => handleDelete(u._id)} className="p-2 text-neutral-300 hover:text-red-500 transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                    {users.length === 0 && <p className="text-center text-sm text-neutral-400 mt-8">Aucun client trouvé.</p>}
                </div>
            </div>
        )}
      </main>

      {/* Navigation Bas (Onglets) */}
      <nav className="bg-white border-t border-neutral-100 flex justify-around p-2 pb-safe z-30">
          <button 
            onClick={() => setActiveTab('scan')}
            className={`flex flex-col items-center p-2 rounded-lg w-full transition-colors ${activeTab === 'scan' ? 'text-neutral-900' : 'text-neutral-300'}`}
          >
              <Camera size={24} />
              <span className="text-[10px] font-medium mt-1">Scanner</span>
          </button>
          <button 
            onClick={() => setActiveTab('list')}
            className={`flex flex-col items-center p-2 rounded-lg w-full transition-colors ${activeTab === 'list' ? 'text-neutral-900' : 'text-neutral-300'}`}
          >
              <Users size={24} />
              <span className="text-[10px] font-medium mt-1">Clients</span>
          </button>
      </nav>

      {/* Overlay Résultat Scan */}
      <div className={`fixed inset-x-0 bottom-0 p-6 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] transform transition-transform duration-300 ease-out z-50 ${scanResult ? 'translate-y-0' : 'translate-y-full'}`}>
        {scanResult === 'success' && (
            <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600"><Check size={24} /></div>
                <h2 className="text-lg font-bold mb-1">Validé !</h2>
                <p className="text-sm text-neutral-500">Nouveau solde : <b>{data?.newBalance}/24</b></p>
            </div>
        )}
        {scanResult === 'error' && (
            <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-red-600"><X size={24} /></div>
                <h2 className="text-lg font-bold mb-1">Erreur</h2>
                <p className="text-sm text-neutral-500">{data?.error}</p>
            </div>
        )}
      </div>

    </div>
  );
}
