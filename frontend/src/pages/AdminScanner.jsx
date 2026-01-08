import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LogOut, Check, X, Camera, Trash2, Plus, Users, Pencil, Save, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminScanner() {
  const [activeTab, setActiveTab] = useState('scan');
  const [users, setUsers] = useState([]);
  
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ email: '', password: '', balance: 24 });
  const [showModal, setShowModal] = useState(false);
  
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalError, setModalError] = useState('');

  const [scanResult, setScanResult] = useState(null); 
  const [data, setData] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const navigate = useNavigate();
  const scannerRef = useRef(null);

  // --- LOGIQUE SCANNER ---
  useEffect(() => {
    if (activeTab !== 'scan' || !isCameraActive) {
        if (scannerRef.current) {
            scannerRef.current.stop().catch(()=>{}).then(()=>scannerRef.current.clear().catch(()=>{}));
            scannerRef.current = null;
        }
        return;
    }
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;
    html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => handleScan(decodedText, html5QrCode), () => {}
    ).catch(() => setIsCameraActive(false));
    return () => { if (html5QrCode.isScanning) html5QrCode.stop().then(() => html5QrCode.clear()).catch(()=>{}); };
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
    setTimeout(() => { setScanResult(null); setData(null); try{scannerInstance.resume();}catch(e){} }, 3500);
  };

  // --- LOGIQUE CLIENTS ---
  const fetchUsers = async () => {
      const token = localStorage.getItem('token');
      try {
          const res = await axios.get(import.meta.env.VITE_API_URL + '/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
          setUsers(res.data);
      } catch (err) { console.error(err); }
  };

  const openModal = (user = null) => {
    setEditingUser(user);
    setModalSuccess(''); 
    setModalError('');
    if (user) setFormData({ email: user.email, password: '', balance: user.balance });
    else setFormData({ email: '', password: '', balance: 24 });
    setShowModal(true);
  };

  const handleSave = async (e) => {
      e.preventDefault();
      setModalError('');
      setModalSuccess('');

      // --- VALIDATION FRONTEND ---
      // On empêche la sauvegarde si l'email est vide ou invalide
      if (!formData.email || !formData.email.includes('@')) {
        setModalError("Veuillez saisir une adresse email valide.");
        return; 
      }
      
      if (!formData.balance && formData.balance !== 0) {
          setModalError("Le solde ne peut pas être vide.");
          return;
      }

      const token = localStorage.getItem('token');
      try {
          if (editingUser) {
              await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/users/${editingUser._id}`, formData, {
                  headers: { Authorization: `Bearer ${token}` }
              });
              setModalSuccess("Client mis à jour !");
          } else {
              await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/users`, formData, {
                  headers: { Authorization: `Bearer ${token}` }
              });
              setModalSuccess("Client créé avec succès !");
              setFormData({ email: '', password: '', balance: 24 });
          }
          fetchUsers();
          setTimeout(() => { setShowModal(false); setModalSuccess(''); }, 1500);
      } catch (err) { 
          setModalError(err.response?.data?.error || "Une erreur est survenue"); 
      }
  };

  const handleDelete = async (id) => {
      if(!confirm("Supprimer ce client ?")) return;
      const token = localStorage.getItem('token');
      try {
          await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          fetchUsers();
      } catch (err) { alert("Erreur suppression"); }
  };

  useEffect(() => { if(activeTab === 'list') fetchUsers(); }, [activeTab]);

  return (
    <div className="flex flex-col h-screen bg-neutral-50 text-neutral-900 font-sans">
      <header className="px-6 py-4 flex justify-between items-center bg-white shadow-sm z-10">
        <div>
          <h1 className="text-lg font-bold text-neutral-900">Pacheco Admin</h1>
          <p className="text-neutral-400 text-[10px] uppercase tracking-widest">{activeTab === 'scan' ? 'Scanner' : 'Gestion Clients'}</p>
        </div>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="p-2 bg-neutral-100 rounded-full text-neutral-500"><LogOut size={18} /></button>
      </header>

      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'scan' && (
            <div className="h-full flex flex-col items-center justify-center p-6 animate-fade-in">
                {!isCameraActive ? (
                    <div className="text-center">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md"><Camera size={32} className="text-neutral-300" /></div>
                        <button onClick={() => setIsCameraActive(true)} className="px-6 py-3 bg-neutral-900 text-white rounded-xl shadow-lg font-medium flex items-center gap-2 mx-auto"><Camera size={18} /> Activer</button>
                    </div>
                ) : (
                    <div className="w-full max-w-sm relative">
                         <div className="relative w-full aspect-square bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                            <div id="reader" className="w-full h-full absolute inset-0 [&>video]:object-cover [&>video]:w-full [&>video]:h-full"></div>
                         </div>
                         <button onClick={() => setIsCameraActive(false)} className="mt-6 text-sm text-neutral-400 underline w-full text-center">Arrêter</button>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'list' && (
            <div className="h-full overflow-y-auto p-4 animate-fade-in pb-24">
                <button onClick={() => openModal()} className="w-full bg-neutral-900 text-white p-4 rounded-xl font-medium mb-6 flex justify-center items-center gap-2 shadow-lg hover:scale-[1.02] transition-transform">
                    <Plus size={20} /> Ajouter un client
                </button>

                <div className="space-y-3">
                    {users.map(u => (
                        <div key={u._id} className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-sm">{u.email}</p>
                                <p className="text-xs text-neutral-400">Solde: <span className="text-amber-500 font-bold">{u.balance}</span></p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => openModal(u)} className="p-2 bg-neutral-50 rounded-lg text-neutral-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil size={16} /></button>
                                <button onClick={() => handleDelete(u._id)} className="p-2 bg-neutral-50 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </main>

      {/* MODAL AVEC VALIDATION ET STYLE UNIFIÉ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                <h3 className="text-lg font-bold mb-4">{editingUser ? 'Modifier le client' : 'Nouveau client'}</h3>
                
                {/* On ajoute noValidate pour gérer nous même les erreurs */}
                <form onSubmit={handleSave} noValidate className="space-y-4">
                    
                    {/* POPUP SUCCES */}
                    {modalSuccess && (
                        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 rounded text-sm flex items-center gap-2 animate-fade-in">
                            <CheckCircle size={18} className="shrink-0" /> <span>{modalSuccess}</span>
                        </div>
                    )}
                    
                    {/* POPUP ERREUR (STYLE LOGIN) */}
                    {modalError && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded text-sm flex items-start gap-2 animate-shake">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" /> <span>{modalError}</span>
                        </div>
                    )}

                    <div>
                        <label className="text-xs text-neutral-400 uppercase font-bold">Email</label>
                        <input 
                            className={`w-full p-3 rounded-lg bg-neutral-50 border mt-1 focus:outline-none transition-all
                                ${modalError && !formData.email ? 'border-red-300 focus:border-red-500' : 'border-neutral-200 focus:border-neutral-900'}`}
                            type="email" 
                            value={formData.email} 
                            onChange={e => { setFormData({...formData, email: e.target.value}); setModalError(''); }} 
                            required 
                        />
                    </div>
                    <div>
                        <label className="text-xs text-neutral-400 uppercase font-bold">Mot de passe {editingUser && '(vide = inchangé)'}</label>
                        <input className="w-full p-3 rounded-lg bg-neutral-50 border border-neutral-200 mt-1 focus:border-neutral-900 outline-none" type="text" placeholder={editingUser ? "••••••" : "Obligatoire"} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required={!editingUser} />
                    </div>
                    <div>
                        <label className="text-xs text-neutral-400 uppercase font-bold">Solde de coupes</label>
                        <input className="w-full p-3 rounded-lg bg-neutral-50 border border-neutral-200 mt-1 font-mono text-lg focus:border-neutral-900 outline-none" type="number" value={formData.balance} onChange={e => setFormData({...formData, balance: e.target.value})} required />
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-neutral-200 text-neutral-500 font-medium hover:bg-neutral-50">Annuler</button>
                        <button type="submit" className="flex-1 py-3 rounded-xl bg-neutral-900 text-white font-medium flex items-center justify-center gap-2 hover:bg-neutral-800"><Save size={18} /> Sauvegarder</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* RESULTAT SCAN */}
      <div className={`fixed inset-x-0 bottom-0 p-6 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] transform transition-transform duration-300 ease-out z-50 ${scanResult ? 'translate-y-0' : 'translate-y-full'}`}>
        {scanResult === 'success' && <div className="text-center"><div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600"><Check size={24} /></div><h2 className="text-lg font-bold mb-1">Validé !</h2><p className="text-sm text-neutral-500">Nouveau solde : <b>{data?.newBalance}/24</b></p></div>}
        {scanResult === 'error' && <div className="text-center"><div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-red-600"><X size={24} /></div><h2 className="text-lg font-bold mb-1">Erreur</h2><p className="text-sm text-neutral-500">{data?.error}</p></div>}
      </div>

      <nav className="bg-white border-t border-neutral-100 flex justify-around p-2 pb-safe z-30">
          <button onClick={() => setActiveTab('scan')} className={`flex flex-col items-center p-2 rounded-lg w-full transition-colors ${activeTab === 'scan' ? 'text-neutral-900' : 'text-neutral-300'}`}><Camera size={24} /><span className="text-[10px] font-medium mt-1">Scanner</span></button>
          <button onClick={() => setActiveTab('list')} className={`flex flex-col items-center p-2 rounded-lg w-full transition-colors ${activeTab === 'list' ? 'text-neutral-900' : 'text-neutral-300'}`}><Users size={24} /><span className="text-[10px] font-medium mt-1">Clients</span></button>
      </nav>
    </div>
  );
}