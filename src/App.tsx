/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  FileText, 
  CheckCircle2, 
  Users, 
  Vote, 
  Archive, 
  Plus, 
  LayoutDashboard,
  Menu,
  X,
  AlertTriangle,
  Info,
  ChevronRight,
  Download,
  AlertCircle,
  ShieldCheck,
  FileSearch,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Role, OSSMeeting, Owner, AgendaItem, MeetingType, AIValidation, GeneratedDocs } from './types';
import { INITIAL_MEETING, AGENDA_TEMPLATES, DEMO_OWNERS } from './constants';
import { generateOSSDocuments, validateOSS } from './services/geminiService';
import { exportToPdf, createArchiveZip } from './lib/export';


// --- Utilities ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (t: string) => void }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'constructor', label: 'Конструктор ОСС', icon: Plus },
    { id: 'documents', label: 'Документы', icon: FileText },
    { id: 'validation', label: 'Проверка', icon: ShieldCheck },
    { id: 'registry', label: 'Реестр уведомлений', icon: Users },
    { id: 'voting', label: 'Голосование', icon: Vote },
    { id: 'archive', label: 'Архив / Экспорт', icon: Archive },
  ];

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 z-50">
      <div className="p-6 flex items-center gap-3 border-bottom border-slate-800">
        <div className="bg-blue-600 p-2 rounded-lg text-white">
          <Building2 size={24} />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-white text-lg tracking-tight">ОСС-ДокМастер</span>
          <span className="text-xs font-mono opacity-60">B2B EDITION</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon size={20} className={cn(isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400")} />
              {item.label}
              {isActive && <motion.div layoutId="activeInd" className="ml-auto w-1 h-1 rounded-full bg-white" />}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 p-4 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">AI Статус</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed uppercase tracking-tighter">
            Модели готовы к генерации и юридической проверке
          </p>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [role, setRole] = useState<Role>('secretary');
  const [meeting, setMeeting] = useState<OSSMeeting>(INITIAL_MEETING);
  const [validation, setValidation] = useState<AIValidation | null>(null);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocs | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('oss_data');
    if (saved) {
      try {
        setMeeting(JSON.parse(saved));
      } catch (e) {
        console.error("Storage error", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('oss_data', JSON.stringify(meeting));
  }, [meeting]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const docs = await generateOSSDocuments(meeting);
      setGeneratedDocs(docs);
      setActiveTab('documents');
    } catch (e) {
      alert("Ошибка при генерации документов");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const res = await validateOSS(meeting);
      setValidation(res);
      setActiveTab('validation');
    } catch (e) {
      alert("Ошибка при проверке");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <header className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
              {activeTab === 'dashboard' && "Обзор системы"}
              {activeTab === 'constructor' && "Создание ОСС"}
              {activeTab === 'documents' && "Пакет документов"}
              {activeTab === 'validation' && "Проверка комплектности"}
              {activeTab === 'registry' && "Реестр собственников"}
              {activeTab === 'voting' && "Результаты голосования"}
              {activeTab === 'archive' && "Экспорт и архив"}
            </h1>
            <p className="text-slate-500 font-medium">Адрес: {meeting.houseAddress}</p>
          </div>

          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4">Роль:</span>
            <div className="flex bg-slate-100 rounded-xl p-1">
              {(['secretary', 'lawyer', 'chairman'] as Role[]).map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                    role === r ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  {r === 'secretary' && "Секретарь"}
                  {r === 'lawyer' && "Юрист"}
                  {r === 'chairman' && "Председатель"}
                </button>
              ))}
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && <Dashboard meeting={meeting} validation={validation} handleValidate={handleValidate} setActiveTab={setActiveTab} />}
            {activeTab === 'constructor' && <Constructor meeting={meeting} setMeeting={setMeeting} onGenerate={handleGenerate} isGenerating={isGenerating} />}
            {activeTab === 'documents' && <Documents docs={generatedDocs} isGenerating={isGenerating} onGenerate={handleGenerate} />}
            {activeTab === 'validation' && <Validation validation={validation} isValidating={isValidating} onValidate={handleValidate} />}
            {activeTab === 'registry' && <Registry meeting={meeting} setMeeting={setMeeting} />}
            {activeTab === 'voting' && <Voting meeting={meeting} setMeeting={setMeeting} />}
            {activeTab === 'archive' && <ArchiveView meeting={meeting} validation={validation} docs={generatedDocs} />}
          </motion.div>
        </AnimatePresence>

        <footer className="mt-20 pt-8 border-t border-slate-200 text-slate-400 flex flex-col items-center gap-4 pb-12">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <ShieldCheck size={14} className="text-blue-500" />
            <span>Юридический дисклеймер</span>
          </div>
          <p className="max-w-2xl text-center text-[10px] leading-relaxed opacity-60 uppercase tracking-tighter">
            Данное приложение является вспомогательным инструментом. Информация, генерируемая ИИ, не является юридической консультацией. Окончательную проверку документов должен проводить квалифицированный юрист. Разработчик не несет ответственности за возможные процедурные ошибки и судебные последствия использования данных шаблонов.
          </p>
        </footer>
      </main>
    </div>
  );
}

// --- Content Components ---

function Dashboard({ meeting, validation, handleValidate, setActiveTab }: { 
  meeting: OSSMeeting; 
  validation: AIValidation | null;
  handleValidate: () => void;
  setActiveTab: (t: string) => void;
}) {
  const stats = useMemo(() => {
    const totalOwners = meeting.owners.length;
    const notified = meeting.owners.filter(o => o.notified).length;
    const progress = Math.round((notified / totalOwners) * 100);
    return { totalOwners, notified, progress };
  }, [meeting]);

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-6">
        <section className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
              <Users size={120} />
            </div>
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Уведомления</h3>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-4xl font-black text-slate-900">{stats.notified}</span>
              <span className="text-slate-400 font-bold mb-1">/ {stats.totalOwners}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-6">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${stats.progress}%` }}
                className="h-full bg-blue-600"
              />
            </div>
            <button 
              onClick={() => setActiveTab('registry')}
              className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all"
            >
              Перейти к реестру <ChevronRight size={14} />
            </button>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
              <Plus size={120} />
            </div>
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Повестка</h3>
            <div className="flex items-end gap-3 mb-6">
              <span className="text-4xl font-black text-slate-900">{meeting.agenda.length}</span>
              <span className="text-slate-400 font-bold mb-1">вопросов</span>
            </div>
            <button 
              onClick={() => setActiveTab('constructor')}
              className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all"
            >
              Редактировать повестку <ChevronRight size={14} />
            </button>
          </div>
        </section>

        <section className="bg-slate-900 p-8 rounded-[40px] text-white">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Быстрый запуск</h2>
              <p className="text-slate-400 text-sm">Все инструменты для успешного ОСС под рукой</p>
            </div>
            <div className="bg-blue-600/20 text-blue-400 px-4 py-1 rounded-full border border-blue-500/30 text-[10px] font-black uppercase tracking-widest">
              Ready
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setActiveTab('constructor')}
              className="bg-slate-800 hover:bg-slate-700 p-6 rounded-2xl flex items-center gap-4 transition-all text-left group"
            >
              <div className="bg-slate-700 group-hover:bg-blue-600 p-3 rounded-xl transition-colors">
                <Plus size={24} />
              </div>
              <div>
                <span className="block font-bold">Новое ОС</span>
                <span className="text-xs text-slate-500 font-mono">STEP-BY-STEP MASTER</span>
              </div>
            </button>
            <button 
              onClick={handleValidate}
              className="bg-slate-800 hover:bg-slate-700 p-6 rounded-2xl flex items-center gap-4 transition-all text-left group"
            >
              <div className="bg-slate-700 group-hover:bg-amber-500 p-3 rounded-xl transition-colors">
                <FileSearch size={24} />
              </div>
              <div>
                <span className="block font-bold">Проверить пакет</span>
                <span className="text-xs text-slate-500 font-mono">AI COMPLIANCE CHECK</span>
              </div>
            </button>
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
             <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
               <AlertTriangle size={20} />
             </div>
             <h3 className="font-bold text-slate-900 tracking-tight">Риски и Ошибки</h3>
          </div>
          
          {validation ? (
            <div className="space-y-4">
              {validation.errors.length > 0 ? (
                validation.errors.slice(0, 3).map((e, i) => (
                  <div key={i} className="bg-red-50 p-4 rounded-xl space-y-1">
                    <span className="block text-red-700 font-bold text-xs">{e.message}</span>
                    <span className="block text-red-500 text-[10px]">{e.howToFix}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 opacity-40 grayscale">
                  <ShieldCheck size={48} className="mx-auto mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Критических ошибок нет</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl">
              <p className="text-xs text-slate-400 font-medium mb-4">Проверка еще не проводилась</p>
              <button 
                onClick={handleValidate}
                className="bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200"
              >
                Запустить аудит
              </button>
            </div>
          )}
        </div>

        <div className="bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden">
          <Building2 size={120} className="absolute -bottom-8 -right-8 opacity-10" />
          <h4 className="font-black text-xs uppercase tracking-widest opacity-60 mb-4 tracking-superwide">Текущее собрание</h4>
          <p className="text-lg font-bold mb-6 leading-tight">{meeting.houseAddress}</p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <span className="block text-[10px] uppercase opacity-60 font-bold">Тип</span>
              <span className="text-xs font-mono font-bold">{meeting.type === 'ochno-zaochno' ? 'Очно-заочное' : 'Заочное'}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase opacity-60 font-bold">Конец</span>
              <span className="text-xs font-mono font-bold">{meeting.dateEnd}</span>
            </div>
          </div>
          <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 py-3 rounded-2xl text-xs font-bold tracking-widest uppercase transition-all">
            Параметры ОСС
          </button>
        </div>
      </div>
    </div>
  );
}

function Constructor({ meeting, setMeeting, onGenerate, isGenerating }: { 
  meeting: OSSMeeting; 
  setMeeting: React.Dispatch<React.SetStateAction<OSSMeeting>>;
  onGenerate: () => void;
  isGenerating: boolean;
}) {
  const [step, setStep] = useState(1);

  const addAgendaItem = (tpl?: typeof AGENDA_TEMPLATES[0]) => {
    const newItem: AgendaItem = {
      id: `item-${Date.now()}`,
      number: meeting.agenda.length + 1,
      title: tpl?.title || "Новый вопрос повестки",
      decisionText: tpl?.decisionText || "Предлагается принять решение...",
      requiresAttachments: tpl?.requiresAttachments || [],
    };
    setMeeting(prev => ({ ...prev, agenda: [...prev.agenda, newItem] }));
  };

  const removeItem = (id: string) => {
    setMeeting(prev => ({
      ...prev,
      agenda: prev.agenda.filter(a => a.id !== id).map((a, i) => ({ ...a, number: i + 1 }))
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-center mb-10">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
               <div 
                 onClick={() => setStep(s)}
                 className={cn(
                   "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all cursor-pointer",
                   step === s ? "bg-blue-600 text-white shadow-lg shadow-blue-500/40" : "bg-white border border-slate-200 text-slate-400"
                 )}
               >
                 {s}
               </div>
               {s < 3 && <div className="w-16 h-[2px] bg-slate-200" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {step === 1 && (
        <section className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-sm space-y-8">
           <h2 className="text-xl font-bold tracking-tight mb-8">Базовые параметры ОСС</h2>
           <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Тип собрания</label>
                 <select 
                   value={meeting.type}
                   onChange={e => setMeeting(p => ({ ...p, type: e.target.value as MeetingType }))}
                   className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                 >
                   <option value="ochno">Очное</option>
                   <option value="zaochno">Заочное</option>
                   <option value="ochno-zaochno">Очно-заочное</option>
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Адрес МКД</label>
                 <input 
                   value={meeting.houseAddress}
                   onChange={e => setMeeting(p => ({ ...p, houseAddress: e.target.value }))}
                   className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Дата начала</label>
                 <input 
                   type="date"
                   value={meeting.dateStart}
                   onChange={e => setMeeting(p => ({ ...p, dateStart: e.target.value }))}
                   className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Дата окончания</label>
                 <input 
                   type="date"
                   value={meeting.dateEnd}
                   onChange={e => setMeeting(p => ({ ...p, dateEnd: e.target.value }))}
                   className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                 />
              </div>
           </div>
           <div className="flex justify-end pt-6">
              <button 
                onClick={() => setStep(2)}
                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
              >
                Далее <ChevronRight size={18} />
              </button>
           </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-6">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold tracking-tight">Повестка дня</h2>
              <button 
                onClick={() => addAgendaItem()}
                className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50"
              >
                <Plus size={14} /> Добавить вопрос
              </button>
           </div>

           <div className="grid grid-cols-4 gap-4 mb-8">
              {AGENDA_TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => addAgendaItem(tpl)}
                  className="p-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-bold text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-all text-left uppercase tracking-tighter"
                >
                  {tpl.title}
                </button>
              ))}
           </div>

           <div className="space-y-4">
              {meeting.agenda.map((item, i) => (
                <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-sm">
                      {item.number}
                    </div>
                    <div className="flex-1 space-y-4">
                      <input 
                        value={item.title}
                        onChange={e => {
                          const newAgenda = [...meeting.agenda];
                          newAgenda[i].title = e.target.value;
                          setMeeting(p => ({ ...p, agenda: newAgenda }));
                        }}
                        className="w-full text-lg font-bold outline-none placeholder:opacity-30"
                        placeholder="Название вопроса..."
                      />
                      <textarea 
                        value={item.decisionText}
                        onChange={e => {
                          const newAgenda = [...meeting.agenda];
                          newAgenda[i].decisionText = e.target.value;
                          setMeeting(p => ({ ...p, agenda: newAgenda }));
                        }}
                        className="w-full text-slate-600 bg-slate-50 p-4 rounded-xl outline-none min-h-[100px] text-sm resize-none"
                        placeholder="Текст решения..."
                      />
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ))}
           </div>

           <div className="flex justify-between pt-10">
              <button 
                onClick={() => setStep(1)}
                className="text-slate-400 px-8 py-4 rounded-2xl font-bold flex items-center gap-2"
              >
                 Назад
              </button>
              <button 
                onClick={() => setStep(3)}
                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all"
              >
                Далее <ChevronRight size={18} />
              </button>
           </div>
        </section>
      )}

      {step === 3 && (
        <section className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-sm space-y-8">
           <div className="text-center space-y-4 mb-10">
             <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
               <ShieldCheck size={40} />
             </div>
             <h2 className="text-2xl font-bold tracking-tight">Всё готово для генерации</h2>
             <p className="text-slate-500 max-w-md mx-auto">Система подготовит полный пакет документов на основе введенных параметров.</p>
           </div>

           <div className="bg-slate-50 p-6 rounded-2xl space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Вопросов повестки</span>
                <span className="font-bold">{meeting.agenda.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Собственников в реестре</span>
                <span className="font-bold">{meeting.owners.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Адрес объекта</span>
                <span className="font-bold text-right max-w-xs">{meeting.houseAddress}</span>
              </div>
           </div>

           <div className="flex flex-col gap-4 pt-10">
              <button 
                disabled={isGenerating}
                onClick={onGenerate}
                className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-lg uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 disabled:opacity-50"
              >
                {isGenerating ? "Генерация..." : "Создать пакет документов"}
              </button>
              <button 
                onClick={() => setStep(2)}
                className="w-full py-4 text-slate-400 font-bold uppercase tracking-widest text-xs"
              >
                Вернуться к редактированию
              </button>
           </div>
        </section>
      )}
    </div>
  );
}

function Documents({ docs, isGenerating, onGenerate }: { docs: GeneratedDocs | null; isGenerating: boolean; onGenerate: () => void }) {
  const [activeDoc, setActiveDoc] = useState('notice');

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-8">
         <motion.div 
           animate={{ rotate: 360 }}
           transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
           className="text-blue-600"
         >
           <Building2 size={80} />
         </motion.div>
         <div className="text-center space-y-2">
           <h3 className="text-2xl font-bold">Генерируем документы...</h3>
           <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">AI Анализирует требования ЖК РФ</p>
         </div>
      </div>
    );
  }

  if (!docs) {
    return (
      <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
         <FileText size={64} className="mx-auto text-slate-200 mb-6" />
         <h3 className="text-xl font-bold text-slate-400 mb-6">Документы еще не созданы</h3>
         <button 
           onClick={onGenerate}
           className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold tracking-widest uppercase text-xs"
         >
           Сгенерировать сейчас
         </button>
      </div>
    );
  }

  const sections = [
    { id: 'notice', label: 'Уведомление', html: docs.noticeHtml },
    { id: 'ballot', label: 'Бюллетень', html: docs.ballotHtml },
    { id: 'minutes', label: 'Протокол', html: docs.minutesHtml },
    { id: 'index', label: 'Опись', html: docs.attachmentsIndexHtml },
  ];

  const currentDoc = sections.find(s => s.id === activeDoc);

  return (
    <div className="flex gap-8">
       <aside className="w-64 space-y-2 shrink-0">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveDoc(s.id)}
              className={cn(
                "w-full p-4 rounded-2xl font-bold text-sm text-left flex items-center gap-3 transition-all border",
                activeDoc === s.id 
                  ? "bg-white border-blue-200 text-blue-600 shadow-sm" 
                  : "bg-transparent border-transparent text-slate-400 hover:text-slate-900"
              )}
            >
              <div className={cn("w-2 h-2 rounded-full", activeDoc === s.id ? "bg-blue-600" : "bg-slate-200")} />
              {s.label}
            </button>
          ))}
       </aside>

       <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[70vh]">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
             <div className="flex items-center gap-3">
                <FileText size={20} className="text-slate-400" />
                <span className="font-bold text-slate-900">{currentDoc?.label}</span>
             </div>
             <div className="flex gap-2">
                <button 
                  onClick={() => currentDoc && exportToPdf(currentDoc.html, currentDoc.label)}
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm shadow-blue-600/20"
                >
                  Скачать PDF
                </button>
             </div>

          </div>
          <div className="flex-1 p-10 overflow-y-auto prose prose-slate max-w-none">
             <div dangerouslySetInnerHTML={{ __html: currentDoc?.html || '' }} />
          </div>
       </div>
    </div>
  );
}

function Validation({ validation, isValidating, onValidate }: { validation: AIValidation | null, isValidating: boolean, onValidate: () => void }) {
  if (isValidating) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }} 
          transition={{ duration: 1, repeat: Infinity }}
          className="text-amber-500"
        >
          <ShieldCheck size={80} />
        </motion.div>
        <p className="font-black text-xs uppercase tracking-widest text-slate-400">Запущен AI Комплаенс-контроль...</p>
      </div>
    );
  }

  if (!validation) {
    return (
      <div className="text-center py-20 bg-white rounded-[40px] border border-slate-200">
         <FileSearch size={64} className="mx-auto text-slate-200 mb-6" />
         <h3 className="text-xl font-bold text-slate-400 mb-6">Проверка не проводилась</h3>
         <button 
           onClick={onValidate}
           className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold tracking-widest uppercase text-xs shadow-lg shadow-blue-500/20"
         >
           Начать проверку
         </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
       <header className={cn(
         "p-8 rounded-[32px] border flex items-center justify-between",
         validation.status === 'ok' ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
       )}>
          <div className="flex items-center gap-6">
             <div className={cn(
               "w-16 h-16 rounded-3xl flex items-center justify-center",
               validation.status === 'ok' ? "bg-green-600 text-white" : "bg-red-600 text-white"
             )}>
                {validation.status === 'ok' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
             </div>
             <div>
                <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                  Статус: {validation.status === 'ok' ? "Принято" : "Требуются правки"}
                </h2>
                <p className="text-slate-500 font-medium">Проверка завершена {new Date().toLocaleDateString('ru-RU')}</p>
             </div>
          </div>
          <button onClick={onValidate} className="bg-white border p-4 rounded-2xl hover:bg-slate-50 transition-all font-bold text-sm">
             Повторный аудит
          </button>
       </header>

       <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-6">
             <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 ml-2">Результаты анализа</h3>
             
             {validation.errors.map((e, i) => (
                <div key={i} className="bg-white p-8 rounded-[32px] border-l-8 border-red-600 border-t border-r border-b border-slate-200 shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 text-red-50 opacity-10">
                     <AlertCircle size={80} />
                   </div>
                   <div className="space-y-4 relative z-10">
                      <span className="text-red-600 font-black text-[10px] uppercase tracking-widest border border-red-200 px-2 py-0.5 rounded-full">Критическая ошибка</span>
                      <h4 className="text-lg font-bold tracking-tight">{e.message}</h4>
                      <div className="bg-slate-50 p-4 rounded-xl space-y-1">
                         <span className="block text-[10px] font-black uppercase text-slate-400">Как исправить:</span>
                         <p className="text-sm text-slate-700">{e.howToFix}</p>
                      </div>
                   </div>
                </div>
             ))}

             {validation.warnings.map((w, i) => (
                <div key={i} className="bg-white p-8 rounded-[32px] border-l-8 border-amber-500 border-t border-r border-b border-slate-200 shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 text-amber-50 opacity-10">
                     <AlertTriangle size={80} />
                   </div>
                   <div className="space-y-4 relative z-10">
                      <span className="text-amber-600 font-black text-[10px] uppercase tracking-widest border border-amber-200 px-2 py-0.5 rounded-full">Предупреждение</span>
                      <h4 className="text-lg font-bold tracking-tight">{w.message}</h4>
                      <div className="bg-slate-50 p-4 rounded-xl space-y-1">
                         <span className="block text-[10px] font-black uppercase text-slate-400">Рекомендация:</span>
                         <p className="text-sm text-slate-700">{w.howToFix}</p>
                      </div>
                   </div>
                </div>
             ))}

             {validation.errors.length === 0 && validation.warnings.length === 0 && (
               <div className="text-center py-20 opacity-30 grayscale items-center flex flex-col bg-white rounded-[40px] border border-slate-200">
                  <ShieldCheck size={100} className="mb-4" />
                  <p className="font-bold uppercase tracking-widest text-xs">Проблем не обнаружено</p>
               </div>
             )}
          </div>

          <div className="bg-slate-900 rounded-[40px] p-8 text-white space-y-8 self-start sticky top-8">
             <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 tracking-superwide">Контрольный список</h3>
             <ul className="space-y-6">
                {Object.entries(validation.checks).map(([key, val]) => (
                  <li key={key} className="flex items-start gap-4">
                     <div className={cn(
                       "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
                       val ? "bg-green-500" : "bg-slate-800"
                     )}>
                        {val ? <CheckCircle2 size={16} className="text-white" /> : <AlertCircle size={16} className="text-slate-600" />}
                     </div>
                     <span className={cn("text-sm font-medium", val ? "text-slate-200" : "text-slate-500 line-through")}>
                        {key === 'requiredFieldsComplete' && "Обязательные поля заполнены"}
                        {key === 'agendaBallotConsistency' && "Повестка и бюллетень совпадают"}
                        {key === 'minutesConsistency' && "Повестка и протокол совпадают"}
                        {key === 'quorumMathValid' && "Математика кворума корректна"}
                        {key === 'attachmentsComplete' && "Приложения соответствуют вопросам"}
                     </span>
                  </li>
                ))}
             </ul>
             <div className="pt-6 border-t border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Финальная проверка ИИ</p>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-600 w-full" />
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}

function Registry({ meeting, setMeeting }: { meeting: OSSMeeting, setMeeting: React.Dispatch<React.SetStateAction<OSSMeeting>> }) {
  const toggleNotified = (id: string) => {
    setMeeting(prev => ({
      ...prev,
      owners: prev.owners.map(o => o.id === id ? { ...o, notified: !o.notified, notificationDate: !o.notified ? new Date().toISOString().split('T')[0] : undefined } : o)
    }));
  };

  return (
    <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden min-h-[60vh] flex flex-col">
       <header className="p-8 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold tracking-tight">Реестр уведомлений собственников</h3>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">Кворум считается от общей площади</p>
          </div>
          <button className="bg-slate-100 text-slate-600 px-6 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all flex items-center gap-2">
             <Download size={16} /> Экспорт реестра
          </button>
       </header>
       
       <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 italic font-serif text-[11px] uppercase tracking-widest text-slate-400">
                <th className="px-8 py-4 font-normal">ФИО</th>
                <th className="px-6 py-4 font-normal">Помещение</th>
                <th className="px-6 py-4 font-normal text-right">Площадь (м²)</th>
                <th className="px-6 py-4 font-normal">Метод</th>
                <th className="px-6 py-4 font-normal">Дата уведомления</th>
                <th className="px-8 py-4 font-normal text-center">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {meeting.owners.map(owner => (
                <tr key={owner.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => toggleNotified(owner.id)}>
                  <td className="px-8 py-4">
                    <span className="font-bold text-slate-700 block">{owner.name}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">{owner.contact}</span>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-500">кв. {owner.room}</td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-900 text-right">{owner.area.toFixed(1)}</td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-black uppercase text-slate-500">Почта РФ</span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">{owner.notificationDate || '—'}</td>
                  <td className="px-8 py-4 text-center">
                    <div className={cn(
                      "w-6 h-6 rounded-full mx-auto flex items-center justify-center transition-all",
                      owner.notified ? "bg-green-500 shadow-sm shadow-green-500/30" : "border-2 border-slate-200"
                    )}>
                      {owner.notified && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
       </div>
    </div>
  );
}

function Voting({ meeting, setMeeting }: { meeting: OSSMeeting, setMeeting: React.Dispatch<React.SetStateAction<OSSMeeting>> }) {
  const handleVoteChange = (itemId: string, field: 'for' | 'against' | 'abstain', value: string) => {
     const numValue = parseFloat(value) || 0;
     setMeeting(prev => ({
       ...prev,
       agenda: prev.agenda.map(a => a.id === itemId ? { ...a, votes: { ...(a.votes || { for: 0, against: 0, abstain: 0 }), [field]: numValue } } : a)
     }));
  };

  const totalArea = useMemo(() => meeting.owners.reduce((sum, o) => sum + o.area, 0), [meeting.owners]);

  return (
    <div className="space-y-8">
       <header className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-sm flex justify-between items-center">
          <div className="flex gap-10">
             <div>
               <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1 tracking-superwide">Общая площадь дома</span>
               <span className="text-3xl font-black text-slate-900">{totalArea.toFixed(1)} <span className="text-slate-300 text-xl font-normal tracking-normal">м²</span></span>
             </div>
             <div className="w-[1px] bg-slate-100" />
             <div>
               <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Собственников</span>
               <span className="text-3xl font-black text-slate-900">{meeting.owners.length}</span>
             </div>
          </div>
          <div className="text-right">
             <div className="flex items-center gap-2 text-green-600 font-bold mb-1">
                <CheckCircle2 size={16} />
                <span className="text-sm">Кворум имеется</span>
             </div>
             <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Процент участия: 68.4%</p>
          </div>
       </header>

       <div className="space-y-6">
          {meeting.agenda.map((item, i) => {
             const votes = item.votes || { for: 0, against: 0, abstain: 0 };
             const currentTotal = votes.for + votes.against + votes.abstain;
             const forPerc = currentTotal > 0 ? (votes.for / currentTotal) * 100 : 0;
             const againstPerc = currentTotal > 0 ? (votes.against / currentTotal) * 100 : 0;
             const abstainPerc = currentTotal > 0 ? (votes.abstain / currentTotal) * 100 : 0;

             return (
               <div key={item.id} className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm flex items-center gap-10">
                  <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shrink-0">
                    {item.number}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 text-lg mb-4 tracking-tight">{item.title}</h4>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                       <div className="bg-green-500 h-full border-r border-white/20" style={{ width: `${forPerc}%` }} />
                       <div className="bg-red-500 h-full border-r border-white/20" style={{ width: `${againstPerc}%` }} />
                       <div className="bg-amber-500 h-full" style={{ width: `${abstainPerc}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-green-600 ml-1">За</label>
                        <input 
                          type="number"
                          value={votes.for || ''}
                          placeholder="0.0"
                          onChange={e => handleVoteChange(item.id, 'for', e.target.value)}
                          className="w-24 bg-slate-50 border border-slate-200 p-3 rounded-xl font-mono text-sm focus:ring-2 focus:ring-green-500 outline-none"
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-red-600 ml-1">Против</label>
                        <input 
                          type="number"
                          value={votes.against || ''}
                          placeholder="0.0"
                          onChange={e => handleVoteChange(item.id, 'against', e.target.value)}
                          className="w-24 bg-slate-50 border border-slate-200 p-3 rounded-xl font-mono text-sm focus:ring-2 focus:ring-red-500 outline-none"
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-amber-600 ml-1">Возд.</label>
                        <input 
                          type="number"
                          value={votes.abstain || ''}
                          placeholder="0.0"
                          onChange={e => handleVoteChange(item.id, 'abstain', e.target.value)}
                          className="w-24 bg-slate-50 border border-slate-200 p-3 rounded-xl font-mono text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                     </div>
                  </div>
               </div>
             );
          })}
       </div>
    </div>
  );
}

function ArchiveView({ meeting, validation, docs }: { meeting: OSSMeeting, validation: AIValidation | null, docs: GeneratedDocs | null }) {
  const isReady = validation?.status === 'ok' && docs !== null;

  return (
    <div className="max-w-3xl mx-auto space-y-10 py-10">
       <div className="bg-slate-900 rounded-[40px] p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-16 opacity-10 rotate-12">
            <Archive size={200} />
          </div>
          
          <div className="relative z-10 space-y-8">
             <div className="space-y-2">
                <h3 className="text-3xl font-black tracking-tight">Готовность архива</h3>
                <p className="text-slate-400">Формирование единого ZIP-пакета для ГИС ЖКХ и личного архива</p>
             </div>

             <div className="grid grid-cols-2 gap-8">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex items-center gap-4">
                   <div className={cn("w-4 h-4 rounded-full", validation?.status === 'ok' ? "bg-green-500" : "bg-red-500")} />
                   <div>
                     <span className="block text-xs font-bold">Проверка ИИ</span>
                     <span className="text-[10px] uppercase opacity-60">{validation?.status === 'ok' ? "Пройдена успешно" : "Есть ошибки"}</span>
                   </div>
                </div>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex items-center gap-4">
                   <div className={cn("w-4 h-4 rounded-full", docs ? "bg-green-500" : "bg-slate-600")} />
                   <div>
                     <span className="block text-xs font-bold">Документы</span>
                     <span className="text-[10px] uppercase opacity-60">{docs ? "Сформированы" : "Отсутствуют"}</span>
                   </div>
                </div>
             </div>

             <button 
               disabled={!isReady}
               onClick={() => meeting && docs && createArchiveZip(meeting, docs)}
               className={cn(
                 "w-full py-6 rounded-3xl font-black text-lg uppercase tracking-widest flex items-center justify-center gap-3 transition-all",
                 isReady ? "bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/40" : "bg-white/5 text-white/20 border border-white/5"
               )}
             >
               <Download size={24} /> Собрать ZIP-архив
             </button>

             {!isReady && (
               <p className="text-center text-[10px] text-amber-400 font-bold uppercase tracking-widest leading-relaxed">
                 Для экспорта необходимо устранить ошибки проверки и сгенерировать тексты всех документов
               </p>
             )}
          </div>
       </div>

       <div className="space-y-6">
          <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 tracking-superwide ml-4">Состав пакета</h4>
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
             {[
               { n: '01', t: 'Уведомление о ОСС', type: 'PDF' },
               { n: '02', t: 'Реестр уведомлений', type: 'PDF' },
               { n: '03', t: 'Бюллетени собственников', type: 'PDF/SCANS' },
               { n: '04', t: 'Протокол общего собрания', type: 'PDF' },
               { n: '05', t: 'Реестр участников (голосования)', type: 'PDF' },
               { n: '06', t: 'Опись приложений', type: 'PDF' },
             ].map(item => (
               <div key={item.n} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                     <span className="font-mono text-slate-300 font-bold">{item.n}</span>
                     <span className="font-bold text-slate-700">{item.t}</span>
                  </div>
                  <span className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-black text-slate-400">{item.type}</span>
               </div>
             ))}
          </div>
       </div>
    </div>
  );
}

