import { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, updateDoc, doc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Transaction } from "../types";
import { 
  Sparkles, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Trash2,
  Filter,
  Download,
  FileText
} from "lucide-react";
import { motion } from "motion/react";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function FinanceAutomation() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    return onSnapshot(collection(db, "transactions"), (s) => {
      setTransactions(s.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    });
  }, []);

  const runSmartSense = async () => {
    setIsProcessing(true);
    const pending = transactions.filter(t => t.status === "pending");
    
    if (pending.length === 0) {
      setIsProcessing(false);
      return;
    }

    try {
      const prompt = `Categorize the following home health care agency transactions. 
      Categories: Payroll, Medical Supplies, Rent, Utilities, Insurance, Contractor Payout, Marketing, Other.
      Format as JSON array of objects with {id, category, taxForm}.
      Transactions: ${JSON.stringify(pending.map(t => ({ id: t.id, desc: t.description, amount: t.amount })))}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                category: { type: Type.STRING },
                taxForm: { type: Type.STRING }
              },
              required: ["id", "category", "taxForm"]
            }
          }
        }
      });

      const results = JSON.parse(response.text);
      const batch = writeBatch(db);
      
      results.forEach((res: any) => {
        const tRef = doc(db, "transactions", res.id);
        batch.update(tRef, { 
          category: res.category, 
          taxForm: res.taxForm,
          status: "categorized" 
        });
      });

      await batch.commit();
    } catch (error) {
      console.error("Smart Sense failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const bulkValidate = async () => {
    const batch = writeBatch(db);
    selectedIds.forEach(id => {
      batch.update(doc(db, "transactions", id), { status: "validated" });
    });
    await batch.commit();
    setSelectedIds([]);
  };

  return (
    <div className="p-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-sm">Financial Ledger</span>
          <div className="status-badge-minimal">
            <span className="text-[8px]">●</span> SMART SENSE ACTIVE
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={runSmartSense}
            disabled={isProcessing}
            className="btn-minimal-primary flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles size={14} className={isProcessing ? "animate-spin" : ""} />
            {isProcessing ? "Processing..." : "Run Smart Sense"}
          </button>
          <button className="flex items-center gap-2 rounded-md border border-border-subtle bg-white px-4 py-2 text-xs font-semibold text-text-main hover:bg-slate-50 transition-colors">
            <Upload size={14} />
            Import CSV
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <div className="card-minimal">
          <div className="text-[12px] text-text-sub mb-1">Tax Readiness (1120-S)</div>
          <div className="text-2xl font-semibold text-accent-success">84%</div>
          <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-accent-success w-[84%]" />
          </div>
        </div>
        <div className="card-minimal">
          <div className="text-[12px] text-text-sub mb-1">Pending Review</div>
          <div className="text-2xl font-semibold text-accent-warning">
            {transactions.filter(t => t.status === "pending").length}
          </div>
        </div>
        <div className="card-minimal">
          <div className="text-[12px] text-text-sub mb-1">MTD Expenses</div>
          <div className="text-2xl font-semibold text-text-main">
            ${Math.abs(transactions.filter(t => t.amount < 0).reduce((acc, t) => acc + t.amount, 0)).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="card-minimal p-0 overflow-hidden">
        <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-4">
            <h2 className="text-[14px] font-semibold">Transaction Queue</h2>
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                <span className="text-[11px] font-bold text-brand-primary bg-sky-50 px-2 py-1 rounded">
                  {selectedIds.length} SELECTED
                </span>
                <button 
                  onClick={bulkValidate}
                  className="text-[11px] font-bold text-white bg-brand-primary px-3 py-1 rounded hover:bg-sky-700"
                >
                  VALIDATE SELECTED
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button className="p-1.5 text-text-sub hover:text-text-main hover:bg-slate-100 rounded transition-all">
              <Filter size={14} />
            </button>
            <button className="p-1.5 text-text-sub hover:text-text-main hover:bg-slate-100 rounded transition-all">
              <Download size={14} />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="px-6 py-3 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-border-subtle text-brand-primary focus:ring-brand-primary"
                    onChange={(e) => setSelectedIds(e.target.checked ? transactions.map(t => t.id) : [])}
                  />
                </th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-text-sub">Date</th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-text-sub">Description</th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-text-sub">Amount</th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-text-sub">Category</th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-text-sub">Tax Form</th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-text-sub">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {transactions.map((t) => (
                <tr key={t.id} className={cn("group hover:bg-slate-50/50 transition-colors", selectedIds.includes(t.id) && "bg-sky-50/30")}>
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(t.id)}
                      onChange={() => toggleSelect(t.id)}
                      className="rounded border-border-subtle text-brand-primary focus:ring-brand-primary" 
                    />
                  </td>
                  <td className="px-6 py-4 text-[13px] text-text-sub">{t.date}</td>
                  <td className="px-6 py-4 text-[13px] font-semibold text-text-main">{t.description}</td>
                  <td className={cn("px-6 py-4 text-[13px] font-bold", t.amount < 0 ? "text-accent-danger" : "text-accent-success")}>
                    {t.amount < 0 ? "-" : "+"}${Math.abs(t.amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={t.category}
                      onChange={async (e) => await updateDoc(doc(db, "transactions", t.id), { category: e.target.value, status: "categorized" })}
                      className="text-[10px] font-bold bg-slate-100 border-none rounded px-2 py-0.5 focus:ring-2 focus:ring-brand-primary uppercase text-text-sub"
                    >
                      <option value="">Uncategorized</option>
                      <option value="Payroll">Payroll</option>
                      <option value="Medical Supplies">Medical Supplies</option>
                      <option value="Rent">Rent</option>
                      <option value="Contractor Payout">Contractor Payout</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-[11px] font-bold text-brand-primary uppercase">{t.taxForm || "-"}</td>
                  <td className="px-6 py-4">
                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase", 
                      t.status === "validated" ? "bg-emerald-100 text-emerald-800" : 
                      t.status === "categorized" ? "bg-sky-100 text-brand-primary" : "bg-amber-100 text-amber-800"
                    )}>
                      {t.status === "validated" && <CheckCircle2 size={10} />}
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
