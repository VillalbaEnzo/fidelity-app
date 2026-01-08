import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode'; // On importe le moteur, pas le scanner
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LogOut, Check, X, User, Camera, AlertCircle } from 'lucide-react';

export default function AdminScanner() {
  const [scanResult, setScanResult] = useState(null); 
  const [data, setData] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const navigate = useNavigate();
  const scannerRef = useRef(null); // Stocke l'instance du scanner

  // Démarrer la caméra quand on clique sur le bouton
  useEffect(() => {
    if (!isCameraActive) return;

    // 1. Création de l'instance
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    // 2. Démarrage explicite (C'est ça qui force la popup permission)
    html5QrCode.start(
      { facingMode: "environment" }, // Force la caméra arrière
      config,
      (decodedText) => {
        // Succès
        handleScan(decodedText, html5QrCode);
      },
      (errorMessage) => {
        // Erreur de lecture (c'est normal tant qu'on ne scanne rien)
      }
    ).catch((err) => {
      // 3. Gestion des erreurs de permission (Caméra bloquée ou refusée)
      console.error("Erreur caméra:", err);
      setIsCameraActive(false);
      setPermissionError(true);
    });

    // 4. Nettoyage propre quand on quitte
    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(console.error);
      } else {
        html5QrCode.clear().catch(console.error);
      }
    };
  }, [isCameraActive]);

  const handleScan = async (qrData, scannerInstance) => {
    // Pause visuelle
    scannerInstance.pause();

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/scan`,
        { qrData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(res.data);
      setScanResult('success');
    } catch (err) {
      setData(err.response?.data || { error: "Erreur inconnue" });
      setScanResult('error');
    }

    // Relance automatique après 3.5 secondes
    setTimeout(() => {
        setScanResult(null);
        setData(null);
        try { scannerInstance.resume(); } catch(e) {}
    }, 3500);
  };

  const handleManualStop = () => {
    setIsCameraActive(false);
    setScanResult(null);
  };

  return (
    <div className="flex flex-col h-screen bg-white text-neutral-900 font-sans">
      <header className="px-6 py-6 flex justify-between items-center z-10 bg-white shadow-sm border-b border-neutral-100">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Pacheco • Coiffeur & barbier Admin</h1>
          <p className="text-neutral-400 text-xs uppercase tracking-widest mt-0.5">Mode Coiffeur</p>
        </div>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-neutral-400">
          <LogOut size={20} />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">

        {permissionError && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm max-w-sm">
            <AlertCircle size={24} />
            <div>
              <p className="font-bold">Accès refusé</p>
              <p>Vérifiez que vous avez autorisé la caméra dans votre navigateur.</p>
            </div>
          </div>
        )}

        {!isCameraActive ? (
          <div className="flex flex-col items-center text-center animate-fade-in">
            <div className="w-24 h-24 bg-neutral-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-neutral-100">
              <Camera size={40} className="text-neutral-300" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Prêt à scanner ?</h2>
            <p className="text-neutral-500 mb-8 max-w-xs text-sm">
              Cliquez ci-dessous pour activer la caméra arrière.
            </p>
            <button
              onClick={() => { setPermissionError(false); setIsCameraActive(true); }}
              className="px-8 py-4 bg-neutral-900 text-white rounded-xl font-medium shadow-lg hover:bg-neutral-800 transition-all flex items-center gap-3"
            >
              <Camera size={20} />
              Activer la caméra
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm flex flex-col items-center animate-fade-in">
            <div className="relative w-full aspect-square bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-white ring-1 ring-neutral-100">
                <div id="reader" className="w-full h-full absolute inset-0 [&>video]:object-cover [&>video]:w-full [&>video]:h-full"></div>

                {!scanResult && (
                  <div className="absolute inset-0 pointer-events-none z-20">
                    <div className="w-full h-[2px] bg-red-500 shadow-[0_0_15px_rgba(239,68,68,1)] absolute top-0 animate-[scan_2s_infinite_ease-in-out]"></div>
                  </div>
                )}

                <div className="absolute inset-0 pointer-events-none z-20 p-8 flex flex-col justify-between opacity-50">
                   <div className="flex justify-between">
                      <div className="w-12 h-12 border-l-4 border-t-4 border-white rounded-tl-lg"></div>
                      <div className="w-12 h-12 border-r-4 border-t-4 border-white rounded-tr-lg"></div>
                   </div>
                   <div className="flex justify-between">
                      <div className="w-12 h-12 border-l-4 border-b-4 border-white rounded-bl-lg"></div>
                      <div className="w-12 h-12 border-r-4 border-b-4 border-white rounded-br-lg"></div>
                   </div>
                </div>
            </div>

            <button onClick={handleManualStop} className="mt-8 text-neutral-400 text-sm underline hover:text-neutral-600">
                Arrêter la caméra
            </button>
          </div>
        )}

      </main>

      <div className={`fixed inset-x-0 bottom-0 p-6 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] transform transition-transform duration-300 ease-out z-50 ${scanResult ? 'translate-y-0' : 'translate-y-full'}`}>
        {scanResult === 'success' && (
            <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                    <Check size={32} strokeWidth={3} />
                </div>
                <h2 className="text-xl font-bold text-neutral-900 mb-6">Coupe Validée !</h2>
                <div className="w-full bg-neutral-50 rounded-2xl p-5 mb-2 flex items-center justify-between border border-neutral-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-full border border-neutral-100 text-neutral-400">
                            <User size={20} />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] text-neutral-400 uppercase font-bold">Client</p>
                            <p className="text-sm font-semibold text-neutral-900 truncate max-w-[120px]">{data?.email?.split('@')[0]}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-neutral-400 uppercase font-bold">Solde</p>
                        <p className="text-2xl font-bold text-neutral-900 leading-none">{data?.newBalance}<span className="text-sm text-neutral-400 font-normal">/24</span></p>
                    </div>
                </div>
            </div>
        )}

        {scanResult === 'error' && (
            <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                    <X size={32} strokeWidth={3} />
                </div>
                <h2 className="text-xl font-bold text-neutral-900 mb-2">Erreur</h2>
                <p className="text-neutral-500 mb-6 text-sm">{data?.error}</p>
                <button onClick={() => { setScanResult(null); try { scannerRef.current?.resume(); } catch(e){} }} className="w-full bg-neutral-900 text-white py-3 rounded-xl font-medium">Réessayer</button>
            </div>
        )}
      </div>

      {scanResult && <div className="fixed inset-0 bg-neutral-900/20 backdrop-blur-[2px] z-40"></div>}
    </div>
  );
}
