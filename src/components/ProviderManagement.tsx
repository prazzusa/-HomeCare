import { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Provider } from "../types";
import { 
  Plus, 
  Users,
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  ShieldAlert,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { motion } from "motion/react";
import { format, isBefore, addDays } from "date-fns";

export default function ProviderManagement() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    return onSnapshot(collection(db, "providers"), (s) => {
      setProviders(s.docs.map(d => ({ id: d.id, ...d.data() } as Provider)));
    });
  }, []);

  const filteredProviders = providers.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || p.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getComplianceStatus = (expiry: string) => {
    const expiryDate = new Date(expiry);
    const today = new Date();
    const thirtyDaysFromNow = addDays(today, 30);

    if (isBefore(expiryDate, today)) return { label: "Expired", color: "text-rose-600 bg-rose-50", icon: XCircle };
    if (isBefore(expiryDate, thirtyDaysFromNow)) return { label: "Expiring Soon", color: "text-amber-600 bg-amber-50", icon: ShieldAlert };
    return { label: "Compliant", color: "text-emerald-600 bg-emerald-50", icon: CheckCircle2 };
  };

  return (
    <div className="p-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-sm">Staff & Providers</span>
          <div className="status-badge-minimal">
            <span className="text-[8px]">●</span> ACTIVE DIRECTORY
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-minimal-primary"
        >
          + Add Provider
        </button>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub" size={16} />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-border-subtle bg-white pl-10 pr-4 py-2 text-sm focus:border-brand-primary focus:outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-text-sub" />
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-border-subtle bg-white px-4 py-2 text-sm focus:border-brand-primary focus:outline-none transition-all"
          >
            <option value="all">All Types</option>
            <option value="W2">W-2 Employee</option>
            <option value="Contractor">Contractor</option>
            <option value="Outsourced_PT">Outsourced PT</option>
            <option value="Outsourced_OT">Outsourced OT</option>
          </select>
        </div>
      </div>

      <div className="card-minimal p-0 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-text-sub">Provider</th>
              <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-text-sub">Type</th>
              <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-text-sub">Compliance</th>
              <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-text-sub">License Expiry</th>
              <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-text-sub">Status</th>
              <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-text-sub"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {filteredProviders.map((p) => {
              const compliance = getComplianceStatus(p.licenseExpiry);
              return (
                <motion.tr 
                  layout
                  key={p.id} 
                  className="group hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-[13px] font-semibold text-text-main">{p.name}</p>
                      <p className="text-[11px] text-text-sub">{p.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-text-sub uppercase">
                      {p.type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase", 
                      compliance.label === "Compliant" ? "bg-emerald-100 text-emerald-800" : 
                      compliance.label === "Expiring Soon" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                    )}>
                      {compliance.label}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-text-sub">
                    {format(new Date(p.licenseExpiry), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("h-2 w-2 rounded-full inline-block mr-2", 
                      p.status === "active" ? "bg-accent-success" : "bg-slate-300"
                    )} />
                    <span className="text-[13px] text-text-main capitalize">{p.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-text-sub hover:text-text-main">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        {filteredProviders.length === 0 && (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
              <Users size={32} />
            </div>
            <p className="text-slate-500">No providers found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Add Provider Modal (Simplified) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">New Provider</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form className="space-y-4" onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                name: formData.get("name") as string,
                email: formData.get("email") as string,
                type: formData.get("type") as any,
                licenseExpiry: formData.get("licenseExpiry") as string,
                status: "active",
                phone: "",
                certifications: [],
                backgroundCheckDate: new Date().toISOString().split("T")[0]
              };
              await addDoc(collection(db, "providers"), data);
              setIsModalOpen(false);
            }}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input name="name" required className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input name="email" type="email" required className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select name="type" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10">
                    <option value="W2">W-2 Employee</option>
                    <option value="Contractor">Contractor</option>
                    <option value="Outsourced_PT">Outsourced PT</option>
                    <option value="Outsourced_OT">Outsourced OT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">License Expiry</label>
                  <input name="licenseExpiry" type="date" required className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10" />
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-700 transition-all">
                  Create Provider Profile
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
