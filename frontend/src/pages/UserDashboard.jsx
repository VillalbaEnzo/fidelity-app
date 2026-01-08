import { useEffect, useState } from 'react';
import axios from 'axios';
import QRCode from 'react-qr-code';
import { useNavigate } from 'react-router-dom';
import { LogOut, RefreshCw } from 'lucide-react';

export default function UserDashboard() {
  const [data, setData] = useState({ balance: 0, qrToken: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    const token = localStorage.getItem('token');
    axios.get('http://localhost:5000/api/user/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setData(res.data))
    .catch(() => navigate('/'));
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col items-center pt-8 px-4 pb-20">
      <div className="w-full max-w-sm flex justify-between items-center mb-8">
        <h1 className="text-xl font-bold text-neutral-900">Mon Espace</h1>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-neutral-500 hover:text-red-600 transition-colors">
          <LogOut size={20} />
        </button>
      </div>
      <div className="w-full max-w-sm bg-gradient-to-br from-neutral-800 to-black text-white p-6 rounded-2xl shadow-xl mb-8 relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
        <p className="text-neutral-400 text-xs font-medium tracking-widest uppercase mb-1">Solde Restant</p>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold text-amber-400">{data.balance}</span>
          <span className="text-neutral-400">/ 24 coupes</span>
        </div>
        <div className="mt-6 flex justify-between items-end">
          <div>
            <p className="font-medium text-sm mt-1">Client Privilège</p>
          </div>
          <div className="w-16 h-1 bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all duration-1000"
              style={{ width: `${(data.balance / 24) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm w-full max-w-sm flex flex-col items-center text-center animate-fade-in" style={{animationDelay: '0.1s'}}>
        <div className="bg-white p-2 rounded-xl border-2 border-dashed border-neutral-200 mb-4">
          {data.qrToken ? (
            <QRCode
              value={data.qrToken}
              size={180}
              bgColor="#FFFFFF"
              fgColor="#171717"
              level="H"
            />
          ) : (
            <div className="w-[180px] h-[180px] flex items-center justify-center text-neutral-300">
              <RefreshCw className="animate-spin" />
            </div>
          )}
        </div>
        <h3 className="font-semibold text-neutral-900 mb-1">Votre Pass Coupe</h3>
        <p className="text-sm text-neutral-500 max-w-[200px]">
          Présentez ce code à votre coiffeur pour valider votre passage.
        </p>
      </div>
    </div>
  );
}
