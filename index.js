import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Download, TrendingUp, Wallet, Banknote, 
  ArrowLeftRight, Calculator, Calendar as CalendarIcon, 
  Settings, LogOut, BarChart3, FileText, CheckCircle2, XCircle,
  Save, User, Lock, Printer, Database, ShieldAlert, ShieldCheck
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  onSnapshot, 
  updateDoc, 
  deleteDoc,
  query
} from 'firebase/firestore';

// --- Firebase Configuration ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'medical-pharmacy-app';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'reports' | 'admin'
  const [entries, setEntries] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  
  const [appSettings, setAppSettings] = useState({
    adminUser: 'mdcpharma',
    adminPass: 'mdc@123'
  });

  // Fixed Admin Credentials for Panel Access & Deletion
  const SUPER_ADMIN = {
    user: 'fadmin',
    pass: 'mdc@fardin0415'
  };

  // Auth Logic
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Data from Firestore
  useEffect(() => {
    if (!user) return;

    const entriesCol = collection(db, 'artifacts', appId, 'public', 'data', 'entries');
    const unsubEntries = onSnapshot(entriesCol, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEntries(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    }, (err) => console.error("Entries fetch error:", err));

    const settingsDoc = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config');
    const unsubSettings = onSnapshot(settingsDoc, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setAppSettings({
          adminUser: data.adminUser || 'mdcpharma',
          adminPass: data.adminPass || 'mdc@123'
        });
      } else {
        setDoc(settingsDoc, {
          adminUser: 'mdcpharma',
          adminPass: 'mdc@123'
        });
      }
    }, (err) => console.error("Settings fetch error:", err));

    return () => {
      unsubEntries();
      unsubSettings();
    };
  }, [user]);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdminAuthenticated(false);
    setView('dashboard');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
    </div>
  );

  if (!isLoggedIn) {
    return <LoginScreen settings={appSettings} onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <nav className="bg-teal-800 text-white shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="bg-white p-1.5 rounded-lg shadow-inner">
              <Calculator className="text-teal-800 w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Medical Pharmacy</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <NavButton active={view === 'dashboard'} icon={<Database size={18}/>} label="Ledger" onClick={() => setView('dashboard')} />
            <NavButton active={view === 'reports'} icon={<BarChart3 size={18}/>} label="Reports" onClick={() => setView('reports')} />
            <NavButton 
              active={view === 'admin'} 
              icon={isAdminAuthenticated ? <ShieldCheck size={18} className="text-emerald-400"/> : <Settings size={18}/>} 
              label="Admin Panel" 
              onClick={() => setView('admin')} 
            />
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-teal-700 transition-colors text-teal-100"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>

          <div className="md:hidden flex gap-4">
             <button onClick={() => setView('dashboard')} className={view === 'dashboard' ? 'text-white' : 'text-teal-300'}><Database size={20}/></button>
             <button onClick={() => setView('reports')} className={view === 'reports' ? 'text-white' : 'text-teal-300'}><BarChart3 size={20}/></button>
             <button onClick={() => setView('admin')} className={view === 'admin' ? 'text-white' : 'text-teal-300'}><Settings size={20}/></button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 mt-4">
        {view === 'dashboard' && <Dashboard entries={entries} isAdmin={isAdminAuthenticated} />}
        {view === 'reports' && <ReportsView entries={entries} />}
        {view === 'admin' && (
          isAdminAuthenticated ? (
            <AdminPanel settings={appSettings} onRevoke={() => setIsAdminAuthenticated(false)} />
          ) : (
            <AdminLogin superAdmin={SUPER_ADMIN} onAuthenticated={() => setIsAdminAuthenticated(true)} />
          )
        )}
      </main>
      
      {/* Admin Power Badge */}
      {isAdminAuthenticated && view !== 'admin' && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-bounce cursor-default z-40">
          <ShieldCheck size={18} />
          <span className="text-sm font-bold">Admin Power Active</span>
        </div>
      )}
    </div>
  );
};

// --- Login for App (User) ---
const LoginScreen = ({ settings, onLogin }) => {
  const [form, setForm] = useState({ user: '', pass: '' });
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (form.user === settings.adminUser && form.pass === settings.adminPass) {
      onLogin();
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-teal-900 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-teal-700 p-8 text-center text-white">
          <Calculator className="w-12 h-12 mx-auto mb-4 bg-white/20 p-2 rounded-xl" />
          <h2 className="text-2xl font-bold">Medical Pharmacy</h2>
          <p className="text-teal-100 mt-2">Sign in to manage your financials</p>
        </div>
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && <div className="p-3 bg-rose-50 text-rose-600 rounded-lg text-sm flex items-center gap-2 border border-rose-100 font-medium"><XCircle size={16}/> {error}</div>}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                autoComplete="username"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                placeholder="Enter username"
                onChange={e => setForm({...form, user: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                autoComplete="current-password"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                placeholder="Enter password"
                onChange={e => setForm({...form, pass: e.target.value})}
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-teal-600/20 transition-all active:scale-95">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Login for Admin Panel (Super Admin) ---
const AdminLogin = ({ superAdmin, onAuthenticated }) => {
  const [form, setForm] = useState({ user: '', pass: '' });
  const [error, setError] = useState('');

  const handleAdminAuth = (e) => {
    e.preventDefault();
    if (form.user === superAdmin.user && form.pass === superAdmin.pass) {
      onAuthenticated();
    } else {
      setError('Admin access denied. Incorrect super-admin credentials.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <ShieldAlert className="text-rose-500 w-10 h-10" />
          <div>
            <h2 className="text-xl font-bold">Admin Verification</h2>
            <p className="text-slate-500 text-sm">Restricted Area - Super Admin Only</p>
          </div>
        </div>
        
        <form onSubmit={handleAdminAuth} className="space-y-5">
          {error && <div className="p-3 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold border border-rose-100 flex items-center gap-2"><XCircle size={14}/> {error}</div>}
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Admin User</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none bg-slate-50"
              onChange={e => setForm({...form, user: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Admin Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none bg-slate-50"
              onChange={e => setForm({...form, pass: e.target.value})}
            />
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2">
            Unlock Admin Power
          </button>
        </form>
      </div>
    </div>
  );
};

const Dashboard = ({ entries, isAdmin }) => {
  const addEntry = async () => {
    const newDoc = doc(collection(db, 'artifacts', appId, 'public', 'data', 'entries'));
    await setDoc(newDoc, {
      date: new Date().toISOString().split('T')[0],
      sales: 0,
      expenses: 0,
      refunds: 0,
      dues: 0,
      bankDeposit: 0,
      timestamp: Date.now()
    });
  };

  const updateEntry = async (id, field, value) => {
    const entryDoc = doc(db, 'artifacts', appId, 'public', 'data', 'entries', id);
    const val = field === 'date' ? value : (parseFloat(value) || 0);
    await updateDoc(entryDoc, { [field]: val });
  };

  const deleteEntry = async (id) => {
    if (!isAdmin) {
      alert("Only admins can delete entries. Please log in to Admin Panel first.");
      return;
    }
    if (window.confirm("Admin Action: Delete this entry?")) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'entries', id));
    }
  };

  const processedEntries = useMemo(() => {
    return entries.map(e => ({
      ...e,
      cashInHand: (Number(e.sales) || 0) - (Number(e.expenses) || 0) - (Number(e.refunds) || 0) - (Number(e.dues) || 0) - (Number(e.bankDeposit) || 0),
      pl: (Number(e.sales) || 0) - (Number(e.expenses) || 0)
    }));
  }, [entries]);

  const totals = useMemo(() => {
    return processedEntries.reduce((acc, curr) => ({
      sales: acc.sales + (Number(curr.sales) || 0),
      expenses: acc.expenses + (Number(curr.expenses) || 0),
      cash: acc.cash + (Number(curr.cashInHand) || 0),
      pl: acc.pl + (Number(curr.pl) || 0)
    }), { sales: 0, expenses: 0, cash: 0, pl: 0 });
  }, [processedEntries]);

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const exportCSV = () => {
    const headers = ["Date", "Sales", "Expenses", "Refunds", "Dues", "Bank Deposit", "Cash In Hand", "P/L"];
    const csvRows = processedEntries.map(e => [e.date, e.sales, e.expenses, e.refunds, e.dues, e.bankDeposit, e.cashInHand, e.pl].join(","));
    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `medical_pharmacy_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Sales" value={formatINR(totals.sales)} icon={<TrendingUp className="text-emerald-500" />} color="border-emerald-500" />
        <StatCard title="Total Expense" value={formatINR(totals.expenses)} icon={<ArrowLeftRight className="text-rose-500" />} color="border-rose-500" />
        <StatCard title="Cash in Hand" value={formatINR(totals.cash)} icon={<Wallet className="text-amber-500" />} color="border-amber-500" />
        <StatCard title="Total P/L" value={formatINR(totals.pl)} icon={<Banknote className="text-blue-500" />} color="border-blue-500" />
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold">Daily Entries Ledger</h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-1">
              {isAdmin ? "Admin Editing Mode Active" : "View-Only Mode (Edit Entry Data)"}
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={addEntry} className="flex-1 sm:flex-none bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 transition-all">
              <Plus size={18} /> New Entry
            </button>
            <button onClick={exportCSV} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
              <Download size={20} />
            </button>
            <button onClick={() => window.print()} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
              <Printer size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b border-slate-200">
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Sales (₹)</th>
                <th className="p-4 text-right">Expense (₹)</th>
                <th className="p-4 text-right">Refund (₹)</th>
                <th className="p-4 text-right">Dues (₹)</th>
                <th className="p-4 text-right">Bank Deposit (₹)</th>
                <th className="p-4 text-right bg-teal-50 text-teal-800">Cash Hand</th>
                <th className="p-4 text-right bg-blue-50 text-blue-800">Day P/L</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processedEntries.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="p-2">
                    <input 
                      type="date" 
                      value={row.date || ""}
                      onChange={(e) => updateEntry(row.id, 'date', e.target.value)}
                      className="w-full bg-white px-3 py-2 rounded border border-transparent hover:border-slate-300 focus:border-teal-500 outline-none text-sm font-medium"
                    />
                  </td>
                  <EditCell value={row.sales} onChange={(v) => updateEntry(row.id, 'sales', v)} />
                  <EditCell value={row.expenses} onChange={(v) => updateEntry(row.id, 'expenses', v)} color="text-rose-600" />
                  <EditCell value={row.refunds} onChange={(v) => updateEntry(row.id, 'refunds', v)} />
                  <EditCell value={row.dues} onChange={(v) => updateEntry(row.id, 'dues', v)} />
                  <EditCell value={row.bankDeposit} onChange={(v) => updateEntry(row.id, 'bankDeposit', v)} />
                  <td className="p-4 text-right font-bold text-teal-700 bg-teal-50/30">
                    {formatINR(row.cashInHand)}
                  </td>
                  <td className={`p-4 text-right font-bold bg-blue-50/30 ${row.pl >= 0 ? 'text-blue-700' : 'text-rose-600'}`}>
                    {formatINR(row.pl)}
                  </td>
                  <td className="p-4 text-center">
                    {isAdmin ? (
                      <button onClick={() => deleteEntry(row.id)} className="text-rose-400 hover:text-rose-600 transition-colors p-1" title="Admin Delete">
                        <Trash2 size={18} />
                      </button>
                    ) : (
                      <div className="text-slate-200" title="Delete Restricted to Admin">
                        <Trash2 size={18} />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const EditCell = ({ value, onChange, color = "text-slate-700" }) => (
  <td className="p-2">
    <input 
      type="number"
      value={value === 0 ? "" : value}
      placeholder="0"
      onChange={(e) => onChange(e.target.value)}
      className={`w-full text-right p-2 rounded border border-transparent hover:border-slate-300 focus:border-teal-500 focus:bg-white bg-transparent outline-none font-semibold transition-all ${color}`}
    />
  </td>
);

const ReportsView = ({ entries }) => {
  const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  const reports = useMemo(() => {
    const monthly = {};
    const yearly = {};

    entries.forEach(e => {
      const d = new Date(e.date);
      if (isNaN(d.getTime())) return;
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const yKey = `${d.getFullYear()}`;

      const process = (target, key) => {
        if (!target[key]) target[key] = { sales: 0, expenses: 0, bank: 0 };
        target[key].sales += (Number(e.sales) || 0);
        target[key].expenses += (Number(e.expenses) || 0);
        target[key].bank += (Number(e.bankDeposit) || 0);
      };

      process(monthly, mKey);
      process(yearly, yKey);
    });

    return { 
      monthly: Object.entries(monthly).sort((a,b) => b[0].localeCompare(a[0])),
      yearly: Object.entries(yearly).sort((a,b) => b[0].localeCompare(a[0]))
    };
  }, [entries]);

  const SummaryTable = ({ title, data, isMonth = false }) => (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
        <FileText className="text-teal-600" />
        <h3 className="font-bold text-slate-800">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
            <tr>
              <th className="p-4">{isMonth ? 'Month' : 'Year'}</th>
              <th className="p-4 text-right">Sales</th>
              <th className="p-4 text-right">Expenses</th>
              <th className="p-4 text-right">Net Profit</th>
              <th className="p-4 text-right">Bank Flow</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map(([key, vals]) => (
              <tr key={key} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-slate-700">
                   {isMonth ? new Date(key + '-02').toLocaleString('default', { month: 'long', year: 'numeric' }) : key}
                </td>
                <td className="p-4 text-right text-emerald-600 font-semibold">{formatINR(vals.sales)}</td>
                <td className="p-4 text-right text-rose-600 font-semibold">{formatINR(vals.expenses)}</td>
                <td className="p-4 text-right text-blue-700 font-bold">{formatINR(vals.sales - vals.expenses)}</td>
                <td className="p-4 text-right text-slate-500 italic">{formatINR(vals.bank)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Financial Summary</h2>
        <div className="bg-teal-100 text-teal-800 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2">
           <CheckCircle2 size={16}/> Live Cloud Data
        </div>
      </div>
      <SummaryTable title="Monthly Summary" data={reports.monthly} isMonth />
      <SummaryTable title="Yearly Summary" data={reports.yearly} />
    </div>
  );
};

const AdminPanel = ({ settings, onRevoke }) => {
  const [form, setForm] = useState(settings);
  const [msg, setMsg] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    const settingsDoc = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config');
    await setDoc(settingsDoc, form);
    setMsg('System credentials updated!');
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-slate-100 mt-10">
      <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-emerald-600 w-8 h-8" />
          <div>
            <h2 className="text-xl font-bold text-emerald-900">Admin Control Panel</h2>
            <p className="text-slate-500 text-sm">Authorized Super-Admin Session</p>
          </div>
        </div>
        <button 
          onClick={onRevoke}
          className="text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors underline"
        >
          Exit Admin Mode
        </button>
      </div>

      <form onSubmit={handleUpdate} className="space-y-6">
        {msg && <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-bold border border-emerald-100 flex items-center gap-2 animate-pulse"><CheckCircle2 size={16}/> {msg}</div>}
        
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Pharmacy App Username</label>
          <input 
            type="text" 
            value={form.adminUser || ""}
            onChange={e => setForm({...form, adminUser: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Pharmacy App Password</label>
          <input 
            type="text" 
            value={form.adminPass || ""}
            onChange={e => setForm({...form, adminPass: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <button type="submit" className="w-full bg-emerald-700 text-white font-bold py-3 rounded-xl hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20">
          <Save size={18}/> Update System Credentials
        </button>
      </form>
      
      <div className="mt-10 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <h4 className="text-slate-800 font-bold text-sm mb-2 flex items-center gap-2 uppercase tracking-tighter">
          <ShieldAlert size={14} className="text-rose-500"/> Critical Admin Privileges
        </h4>
        <ul className="text-slate-600 text-[11px] space-y-1.5 list-disc pl-4">
          <li>You can now delete any entry from the Ledger.</li>
          <li>You can change the credentials for general users.</li>
          <li>System settings are synchronized across all devices instantly.</li>
        </ul>
      </div>
    </div>
  );
};

const NavButton = ({ active, icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-semibold text-sm ${
      active ? 'bg-white text-teal-800 shadow-lg' : 'text-teal-100 hover:bg-teal-700'
    }`}
  >
    {icon} {label}
  </button>
);

const StatCard = ({ title, value, icon, color }) => (
  <div className={`bg-white p-5 rounded-2xl shadow-lg border-l-4 ${color} transition-all`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-xl sm:text-2xl font-black text-slate-800">{value}</h3>
      </div>
      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
        {icon}
      </div>
    </div>
  </div>
);

export default App;