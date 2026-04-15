import { useState, useEffect } from "react";
import { collection, onSnapshot, query, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Transaction, Provider, Patient } from "../types";
import { 
  TrendingUp, 
  Users, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { motion } from "motion/react";

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const unsubT = onSnapshot(collection(db, "transactions"), (s) => 
      setTransactions(s.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)))
    );
    const unsubP = onSnapshot(collection(db, "providers"), (s) => 
      setProviders(s.docs.map(d => ({ id: d.id, ...d.data() } as Provider)))
    );
    const unsubPa = onSnapshot(collection(db, "patients"), (s) => 
      setPatients(s.docs.map(d => ({ id: d.id, ...d.data() } as Patient)))
    );
    return () => { unsubT(); unsubP(); unsubPa(); };
  }, []);

  const totalRevenue = transactions.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
  const totalPayroll = Math.abs(transactions.filter(t => t.amount < 0 && t.category === "Payroll").reduce((acc, t) => acc + t.amount, 0));
  
  const chartData = [
    { name: "Mon", revenue: 4000, payroll: 2400 },
    { name: "Tue", revenue: 3000, payroll: 1398 },
    { name: "Wed", revenue: 2000, payroll: 9800 },
    { name: "Thu", revenue: 2780, payroll: 3908 },
    { name: "Fri", revenue: 1890, payroll: 4800 },
    { name: "Sat", revenue: 2390, payroll: 3800 },
    { name: "Sun", revenue: 3490, payroll: 4300 },
  ];

  const stats = [
    { name: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, change: "+12.5%", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { name: "Active Providers", value: providers.length.toString(), change: "+2", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { name: "Compliance Alerts", value: "3", change: "-1", icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
    { name: "Patient Intake", value: patients.filter(p => p.intakeStatus === "pending").length.toString(), change: "Pending", icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card-minimal">
            <div className="text-[12px] text-text-sub mb-1">{stat.name}</div>
            <div className="text-2xl font-semibold text-text-main">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 card-minimal">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[15px] font-semibold">Revenue vs Payroll</h3>
            <span className="text-[12px] text-brand-primary">Auto-categorized (12 pending)</span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284C7" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0284C7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0284C7" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                <Area type="monotone" dataKey="payroll" stroke="#EF4444" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-minimal">
          <h3 className="text-[14px] font-semibold mb-4">Ohio Compliance Alerts</h3>
          <div className="space-y-0">
            {providers.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-3 border-b border-border-subtle last:border-0">
                <div className={cn("h-2 w-2 rounded-full", 
                  p.status === "active" ? "bg-accent-success" : "bg-accent-danger"
                )} />
                <div className="flex-1">
                  <p className="text-[12px] font-semibold text-text-main">{p.name}</p>
                  <p className="text-[11px] text-text-sub">{p.type} • Exp: {p.licenseExpiry}</p>
                </div>
              </div>
            ))}
            {providers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-text-sub">
                <AlertCircle size={32} className="mb-2 opacity-20" />
                <p className="text-xs">No alerts found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
