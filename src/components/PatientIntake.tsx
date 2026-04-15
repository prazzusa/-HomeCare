import { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Patient } from "../types";
import { 
  UserPlus, 
  Plus,
  FileCheck, 
  ClipboardList, 
  Signature, 
  CheckCircle2, 
  Clock,
  Search,
  MoreVertical,
  ShieldCheck
} from "lucide-react";
import { motion } from "motion/react";

export default function PatientIntake() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    return onSnapshot(collection(db, "patients"), (s) => {
      setPatients(s.docs.map(d => ({ id: d.id, ...d.data() } as Patient)));
    });
  }, []);

  return (
    <div className="p-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-sm">Patient Intake</span>
          <div className="status-badge-minimal">
            <span className="text-[8px]">●</span> OHIO COMPLIANCE READY
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-minimal-primary flex items-center gap-2"
        >
          <UserPlus size={14} />
          New Intake
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <div className="card-minimal">
          <div className="text-[12px] text-text-sub mb-1">Pending Review</div>
          <div className="text-2xl font-semibold text-accent-warning">
            {patients.filter(p => p.intakeStatus === "pending").length}
          </div>
        </div>
        <div className="card-minimal">
          <div className="text-[12px] text-text-sub mb-1">Active Patients</div>
          <div className="text-2xl font-semibold text-accent-success">
            {patients.filter(p => p.intakeStatus === "completed").length}
          </div>
        </div>
        <div className="card-minimal">
          <div className="text-[12px] text-text-sub mb-1">Compliance Rate</div>
          <div className="text-2xl font-semibold text-text-main">100%</div>
        </div>
      </div>

      <div className="card-minimal p-0 overflow-hidden">
        <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-slate-50/30">
          <h2 className="text-[14px] font-semibold">Intake Pipeline</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub" size={14} />
            <input 
              type="text" 
              placeholder="Search patients..." 
              className="w-full rounded border border-border-subtle bg-white pl-9 pr-4 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-text-sub">Patient</th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-text-sub">Medicaid ID</th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-text-sub">Region</th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-text-sub">Onboarding Progress</th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-text-sub">Status</th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-text-sub"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {patients.map((p) => (
                <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-text-sub font-bold text-[11px]">
                        {p.name[0]}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-text-main">{p.name}</p>
                        <p className="text-[10px] text-text-sub uppercase font-bold tracking-tight">DOB: {p.dob}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-text-sub font-mono">{p.medicaidId || "N/A"}</td>
                  <td className="px-6 py-4 text-[13px] text-text-sub">{p.region}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={cn("h-full bg-brand-primary transition-all", p.intakeStatus === "completed" ? "w-full" : "w-1/2")} />
                      </div>
                      <span className="text-[10px] font-bold text-text-sub">
                        {p.intakeStatus === "completed" ? "100%" : "50%"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase", 
                      p.intakeStatus === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    )}>
                      {p.intakeStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-text-sub hover:text-text-main">
                      <MoreVertical size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                      <ClipboardList size={32} />
                    </div>
                    <p className="text-slate-500">No patient records found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simplified Intake Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">New Patient Intake</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form className="grid grid-cols-2 gap-6" onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                name: formData.get("name") as string,
                dob: formData.get("dob") as string,
                medicaidId: formData.get("medicaidId") as string,
                region: formData.get("region") as string,
                careRequirements: formData.get("requirements") as string,
                intakeStatus: "pending",
                createdAt: new Date().toISOString()
              };
              await addDoc(collection(db, "patients"), data);
              setIsModalOpen(false);
            }}>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input name="name" required className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                <input name="dob" type="date" required className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Medicaid ID</label>
                <input name="medicaidId" required className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ohio Region</label>
                <select name="region" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10">
                  <option value="Central">Central (Columbus)</option>
                  <option value="Northeast">Northeast (Cleveland)</option>
                  <option value="Southwest">Southwest (Cincinnati)</option>
                  <option value="Northwest">Northwest (Toledo)</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Care Requirements</label>
                <textarea name="requirements" rows={3} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10" />
              </div>
              <div className="col-span-2 pt-4">
                <button type="submit" className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-700 transition-all">
                  <FileCheck size={20} />
                  Start Onboarding Process
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
