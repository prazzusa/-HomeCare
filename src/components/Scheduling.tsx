import { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Schedule, Provider, Patient } from "../types";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion } from "motion/react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";

export default function Scheduling() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const unsubS = onSnapshot(collection(db, "schedules"), (s) => 
      setSchedules(s.docs.map(d => ({ id: d.id, ...d.data() } as Schedule)))
    );
    const unsubP = onSnapshot(collection(db, "providers"), (s) => 
      setProviders(s.docs.map(d => ({ id: d.id, ...d.data() } as Provider)))
    );
    const unsubPa = onSnapshot(collection(db, "patients"), (s) => 
      setPatients(s.docs.map(d => ({ id: d.id, ...d.data() } as Patient)))
    );
    return () => { unsubS(); unsubP(); unsubPa(); };
  }, []);

  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getSchedulesForDay = (date: Date) => {
    return schedules.filter(s => isSameDay(new Date(s.visitDate), date));
  };

  return (
    <div className="p-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-sm">Scheduling</span>
          <div className="status-badge-minimal">
            <span className="text-[8px]">●</span> CARE COORDINATION
          </div>
        </div>
        <button className="btn-minimal-primary flex items-center gap-2">
          <Plus size={14} />
          New Visit
        </button>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Calendar Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card-minimal">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold">{format(selectedDate, "MMMM yyyy")}</h3>
              <div className="flex gap-1">
                <button onClick={() => setSelectedDate(addDays(selectedDate, -7))} className="p-1 hover:bg-slate-50 rounded border border-border-subtle"><ChevronLeft size={14}/></button>
                <button onClick={() => setSelectedDate(addDays(selectedDate, 7))} className="p-1 hover:bg-slate-50 rounded border border-border-subtle"><ChevronRight size={14}/></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {["S", "M", "T", "W", "T", "F", "S"].map(d => (
                <span key={d} className="text-[10px] font-bold text-text-sub uppercase">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map(day => (
                <button 
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "h-8 w-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all",
                    isSameDay(day, selectedDate) ? "bg-brand-primary text-white shadow-sm" : "hover:bg-slate-50 text-text-sub"
                  )}
                >
                  {format(day, "d")}
                </button>
              ))}
            </div>
          </div>

          <div className="card-minimal">
            <h3 className="text-[14px] font-semibold mb-4 flex items-center gap-2">
              <AlertCircle size={14} className="text-accent-warning" />
              Unassigned Visits
            </h3>
            <div className="space-y-3">
              {schedules.filter(s => !s.providerId).map(s => (
                <div key={s.id} className="p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                  <p className="text-[11px] font-bold text-amber-900 mb-1 uppercase tracking-tight">Physical Therapy</p>
                  <p className="text-[10px] text-amber-700">Patient ID: {s.patientId}</p>
                  <button className="mt-2 w-full py-1.5 bg-white border border-amber-200 rounded text-[10px] font-bold text-amber-700 hover:bg-amber-100 transition-all uppercase">
                    Assign Provider
                  </button>
                </div>
              ))}
              {schedules.filter(s => !s.providerId).length === 0 && (
                <p className="text-[11px] text-text-sub text-center py-4 italic">All visits assigned</p>
              )}
            </div>
          </div>
        </div>

        {/* Main Schedule View */}
        <div className="lg:col-span-3">
          <div className="card-minimal p-0 overflow-hidden">
            <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-slate-50/30">
              <h2 className="text-[15px] font-semibold">
                Visits for {format(selectedDate, "EEEE, MMM d")}
              </h2>
              <span className="text-[10px] font-bold text-text-sub bg-slate-100 px-3 py-1 rounded uppercase tracking-wider">
                {getSchedulesForDay(selectedDate).length} Scheduled
              </span>
            </div>
            <div className="divide-y divide-border-subtle">
              {getSchedulesForDay(selectedDate).map((s) => {
                const patient = patients.find(p => p.id === s.patientId);
                const provider = providers.find(p => p.id === s.providerId);
                return (
                  <div key={s.id} className="p-6 flex items-start gap-6 hover:bg-slate-50/50 transition-colors">
                    <div className="flex flex-col items-center gap-1 min-w-[60px]">
                      <span className="text-[14px] font-bold text-text-main">{format(new Date(s.visitDate), "h:mm")}</span>
                      <span className="text-[10px] font-bold text-text-sub uppercase tracking-widest">{format(new Date(s.visitDate), "a")}</span>
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded bg-sky-50 flex items-center justify-center text-brand-primary">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-text-main">{patient?.name || "Unknown Patient"}</p>
                          <p className="text-[11px] text-text-sub flex items-center gap-1 mt-1">
                            <MapPin size={10} /> {patient?.region || "No Region"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded bg-slate-50 flex items-center justify-center text-text-sub">
                          <CalendarIcon size={18} />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-text-main">{provider?.name || "Unassigned"}</p>
                          <p className="text-[11px] text-text-sub mt-1 uppercase font-bold tracking-tight">
                            {provider?.type || "Pending Assignment"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", 
                        s.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-sky-100 text-brand-primary"
                      )}>
                        {s.status}
                      </span>
                      {s.status === "completed" && <CheckCircle2 size={14} className="text-accent-success" />}
                    </div>
                  </div>
                );
              })}
              {getSchedulesForDay(selectedDate).length === 0 && (
                <div className="py-24 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                    <CalendarIcon size={32} />
                  </div>
                  <p className="text-slate-500">No visits scheduled for this day</p>
                  <button className="mt-4 text-sm font-bold text-indigo-600 hover:underline">Schedule first visit</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
