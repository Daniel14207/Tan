/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  Sparkles, 
  Clock, 
  ArrowLeft, 
  Activity, 
  Check, 
  Loader2,
  Lock,
  ChevronRight,
  RefreshCw,
  Trophy
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  base64?: string;
  isText: boolean;
  textContent?: string;
}

interface AnalysePremiumProps {
  onBack: () => void;
}

export default function AnalysePremium({ onBack }: AnalysePremiumProps) {
  // Navigation / Tab structure within Analyse Premium
  // Step 1: Upload and extract history (Base Historique)
  // Step 2: Upload and extract matches & show results
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // STEP 1 STATE
  const [historyFiles, setHistoryFiles] = useState<FileItem[]>([]);
  const [isProcessingHistory, setIsProcessingHistory] = useState(false);
  const [historyStageIndex, setHistoryStageIndex] = useState(-1);
  const [memorizedHistory, setMemorizedHistory] = useState<any | null>(() => {
    const saved = sessionStorage.getItem("analyse_premium_history_base");
    return saved ? JSON.parse(saved) : null;
  });

  // STEP 2 STATE
  const [matchFiles, setMatchFiles] = useState<FileItem[]>([]);
  const [isProcessingMatches, setIsProcessingMatches] = useState(false);
  const [matchStageIndex, setMatchStageIndex] = useState(-1);
  const [analysisResults, setAnalysisResults] = useState<string[]>([]);

  // Drag and Drop State
  const [isDraggingHistory, setIsDraggingHistory] = useState(false);
  const [isDraggingMatches, setIsDraggingMatches] = useState(false);

  // Global Error state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // File Input Refs
  const historyInputRef = useRef<HTMLInputElement>(null);
  const matchesInputRef = useRef<HTMLInputElement>(null);

  // ANIMATION STAGES DEFINITIONS
  const historyStages = [
    "Lecture OCR",
    "Extraction des historiques",
    "Extraction des scores",
    "Reconstruction des journées",
    "Analyse offensive",
    "Analyse défensive",
    "Détection des cycles",
    "Construction de la base statistique",
    "Vérification"
  ];

  const matchStages = [
    "Lecture des matchs",
    "Comparaison historique",
    "Analyse des trajectoires",
    "Analyse offensive",
    "Analyse défensive",
    "Analyse des cycles",
    "Calcul des scores exacts",
    "Validation finale"
  ];

  // Auto-restore step if history is already memorized
  useEffect(() => {
    if (memorizedHistory && currentStep === 1) {
      setCurrentStep(2);
    }
  }, [memorizedHistory]);

  // IMAGE COMPRESSION HELPER (Max size 1200px for speedy OCR & standard uploads)
  const compressImageFile = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          
          const MAX_BOUND = 1400;
          if (width > height) {
            if (width > MAX_BOUND) {
              height *= MAX_BOUND / width;
              width = MAX_BOUND;
            }
          } else {
            if (height > MAX_BOUND) {
              width *= MAX_BOUND / height;
              height = MAX_BOUND;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressed = canvas.toDataURL("image/jpeg", 0.70);
          resolve({
            base64: compressed.split(",")[1],
            mimeType: "image/jpeg"
          });
        };
        img.onerror = () => reject(new Error("Erreur de décodage de l'image."));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Erreur de lecture du fichier."));
      reader.readAsDataURL(file);
    });
  };

  // GENERIC FILE LOADER & PROCESSOR
  const processFiles = async (files: FileList, targetSetter: React.Dispatch<React.SetStateAction<FileItem[]>>, currentList: FileItem[]) => {
    setErrorMsg(null);
    const updatedList = [...currentList];

    if (currentList.length + files.length > 20) {
      setErrorMsg("Vous pouvez charger un maximum de 20 fichiers.");
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validation size: limit 20MB
      const maxSizeBytes = 20 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        setErrorMsg(`Le fichier "${file.name}" dépasse la limite autorisée de 20 Mo.`);
        continue;
      }

      // Check extensions
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      const allowedExtensions = ["png", "jpg", "jpeg", "webp", "pdf", "txt"];
      if (!allowedExtensions.includes(extension)) {
        setErrorMsg(`Le format du fichier "${file.name}" n'est pas supporté (Uniquement PNG, JPG, JPEG, WEBP, PDF, TXT).`);
        continue;
      }

      const fileId = "file_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
      
      try {
        if (["png", "jpg", "jpeg", "webp"].includes(extension)) {
          // Compress and convert to Base64
          const compressed = await compressImageFile(file);
          updatedList.push({
            id: fileId,
            name: file.name,
            size: file.size,
            type: file.type || "image/jpeg",
            base64: compressed.base64,
            isText: false
          });
        } else if (extension === "txt") {
          const text = await file.text();
          updatedList.push({
            id: fileId,
            name: file.name,
            size: file.size,
            type: "text/plain",
            textContent: text,
            isText: true
          });
        } else if (extension === "pdf") {
          // PDF to base64
          const base64Str = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const result = e.target?.result as string;
              resolve(result.split(",")[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          updatedList.push({
            id: fileId,
            name: file.name,
            size: file.size,
            type: "application/pdf",
            base64: base64Str,
            isText: false
          });
        }
      } catch (err: any) {
        setErrorMsg(`Erreur lors du traitement de "${file.name}": ${err.message}`);
      }
    }

    targetSetter(updatedList);
  };

  // HANDLE STEP 1: ANALYSER L'HISTORIQUE
  const startHistoryAnalysis = async () => {
    if (historyFiles.length === 0) {
      setErrorMsg("Veuillez charger au moins un fichier pour construire la base historique.");
      return;
    }

    setErrorMsg(null);
    setIsProcessingHistory(true);
    setHistoryStageIndex(0);

    // Progressive loading timer: Step 1 must take between 5 to 10 seconds.
    // Let's divide 7 seconds (7000ms) over 9 stages. That's approx 750ms per stage.
    const intervalTime = 750;
    const stageTimer = setInterval(() => {
      setHistoryStageIndex((prev) => {
        if (prev < historyStages.length - 1) {
          return prev + 1;
        } else {
          clearInterval(stageTimer);
          return prev;
        }
      });
    }, intervalTime);

    try {
      // Trigger API call concurrently
      const payloadFiles = historyFiles.map(f => ({
        name: f.name,
        mimeType: f.type,
        base64: f.base64,
        isText: f.isText,
        textContent: f.textContent
      }));

      const res = await fetch("/api/analyse-premium/historique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: payloadFiles })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Erreur de communication avec le serveur.");
      }

      const data = await res.json();
      
      // Wait for both the minimum animation duration (completion of stages timer)
      // and server response before moving to the next state
      setTimeout(() => {
        clearInterval(stageTimer);
        setMemorizedHistory(data.baseStatistique);
        sessionStorage.setItem("analyse_premium_history_base", JSON.stringify(data.baseStatistique));
        setIsProcessingHistory(false);
        setHistoryStageIndex(-1);
        setCurrentStep(2);
      }, Math.max(0, 7000 - (historyStageIndex * intervalTime)));

    } catch (err: any) {
      clearInterval(stageTimer);
      setIsProcessingHistory(false);
      setHistoryStageIndex(-1);
      setErrorMsg(err.message || "Une erreur est survenue lors de l'extraction de l'historique.");
    }
  };

  // HANDLE STEP 2: LANCER ANALYSE PREMIUM
  const startMatchesAnalysis = async () => {
    if (matchFiles.length === 0) {
      setErrorMsg("Veuillez charger au moins un fichier contenant les matchs à analyser.");
      return;
    }

    setErrorMsg(null);
    setIsProcessingMatches(true);
    setMatchStageIndex(0);

    // Progressive loading timer: Step 2 must take between 8 to 15 seconds.
    // Let's divide 10 seconds (10000ms) over 8 stages. That's approx 1250ms per stage.
    const intervalTime = 1250;
    const stageTimer = setInterval(() => {
      setMatchStageIndex((prev) => {
        if (prev < matchStages.length - 1) {
          return prev + 1;
        } else {
          clearInterval(stageTimer);
          return prev;
        }
      });
    }, intervalTime);

    try {
      const payloadFiles = matchFiles.map(f => ({
        name: f.name,
        mimeType: f.type,
        base64: f.base64,
        isText: f.isText,
        textContent: f.textContent
      }));

      const res = await fetch("/api/analyse-premium/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: payloadFiles,
          baseStatistique: memorizedHistory
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Erreur de communication avec le serveur.");
      }

      const data = await res.json();

      // Wait for both animation sequence and response completion
      setTimeout(() => {
        clearInterval(stageTimer);
        setAnalysisResults(data.predictions);
        setIsProcessingMatches(false);
        setMatchStageIndex(-1);
      }, Math.max(0, 10000 - (matchStageIndex * intervalTime)));

    } catch (err: any) {
      clearInterval(stageTimer);
      setIsProcessingMatches(false);
      setMatchStageIndex(-1);
      setErrorMsg(err.message || "Une erreur s'est produite lors du calcul des pronostics.");
    }
  };

  const removeFile = (id: string, isHistory: boolean) => {
    if (isHistory) {
      setHistoryFiles(prev => prev.filter(f => f.id !== id));
    } else {
      setMatchFiles(prev => prev.filter(f => f.id !== id));
    }
  };

  const clearHistorySession = () => {
    sessionStorage.removeItem("analyse_premium_history_base");
    setMemorizedHistory(null);
    setHistoryFiles([]);
    setMatchFiles([]);
    setAnalysisResults([]);
    setCurrentStep(1);
  };

  return (
    <div className="space-y-6 text-white pb-20">
      
      {/* HEADER ROW */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-all bg-slate-950/60 hover:bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 cursor-pointer shadow-md"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Menu</span>
        </button>

        <span className="text-[10px] font-black uppercase text-indigo-400 flex items-center gap-1 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
          🏆 ANALYSE PREMIUM
        </span>
      </div>

      {/* DYNAMIC PROGRESS SCREEN OVERLAY - STEP 1 */}
      <AnimatePresence>
        {isProcessingHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#060b13] flex flex-col justify-center p-6 max-w-md mx-auto relative overflow-hidden"
          >
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 p-24 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 p-24 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-8 relative z-10">
              <div className="text-center space-y-2">
                <Loader2 className="h-10 w-10 text-indigo-400 animate-spin mx-auto" />
                <h3 className="text-lg font-black uppercase tracking-wider text-white">
                  Extraction Historique
                </h3>
                <p className="text-xs text-slate-400">
                  Veuillez patienter pendant que le moteur d'analyse statistique compile vos documents...
                </p>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <motion.div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((historyStageIndex + 1) / historyStages.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Progressive Steps Display */}
              <div className="space-y-2 max-w-xs mx-auto">
                {historyStages.map((stage, idx) => {
                  const isCompleted = idx < historyStageIndex;
                  const isActive = idx === historyStageIndex;
                  const isUpcoming = idx > historyStageIndex;

                  return (
                    <div 
                      key={stage} 
                      className={`flex items-center justify-between text-xs font-bold transition-all ${
                        isCompleted ? "text-emerald-400" : isActive ? "text-white scale-105" : "text-slate-600"
                      }`}
                    >
                      <span>{stage}</span>
                      {isCompleted ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : isActive ? (
                        <Activity className="h-4 w-4 text-indigo-400 animate-pulse" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-slate-800" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DYNAMIC PROGRESS SCREEN OVERLAY - STEP 2 */}
      <AnimatePresence>
        {isProcessingMatches && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#060b13] flex flex-col justify-center p-6 max-w-md mx-auto relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-24 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 p-24 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-8 relative z-10">
              <div className="text-center space-y-2">
                <Sparkles className="h-10 w-10 text-indigo-400 animate-bounce mx-auto" />
                <h3 className="text-lg font-black uppercase tracking-wider text-white">
                  Analyse Premium en Cours
                </h3>
                <p className="text-xs text-slate-400">
                  Calcul des prédictions de score exact avec la logique d'analyse de forme...
                </p>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <motion.div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((matchStageIndex + 1) / matchStages.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Progressive Steps Display */}
              <div className="space-y-2 max-w-xs mx-auto">
                {matchStages.map((stage, idx) => {
                  const isCompleted = idx < matchStageIndex;
                  const isActive = idx === matchStageIndex;

                  return (
                    <div 
                      key={stage} 
                      className={`flex items-center justify-between text-xs font-bold transition-all ${
                        isCompleted ? "text-emerald-400" : isActive ? "text-white scale-105" : "text-slate-600"
                      }`}
                    >
                      <span>{stage}</span>
                      {isCompleted ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : isActive ? (
                        <Activity className="h-4 w-4 text-indigo-400 animate-pulse" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-slate-800" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN LAYOUT WRAPPER */}
      <div className="space-y-6">

        {/* ERROR CONTAINER */}
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-2xl flex gap-3 items-start text-xs leading-relaxed">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
            <div>
              <span className="font-extrabold uppercase block mb-0.5">Erreur Moteur</span>
              {errorMsg}
            </div>
          </div>
        )}

        {/* STEPPER NAV BAR */}
        <div className="flex gap-2 p-1.5 bg-slate-950/60 rounded-2xl border border-slate-800">
          <button
            onClick={() => setCurrentStep(1)}
            className={`flex-1 text-center py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              currentStep === 1 
                ? "bg-indigo-600 text-white shadow-md font-extrabold" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            1. Base Historique
          </button>
          <button
            onClick={() => {
              if (memorizedHistory) {
                setCurrentStep(2);
              }
            }}
            disabled={!memorizedHistory}
            className={`flex-1 text-center py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              currentStep === 2 
                ? "bg-indigo-600 text-white shadow-md font-extrabold" 
                : memorizedHistory 
                ? "text-slate-400 hover:text-white cursor-pointer" 
                : "text-slate-600 opacity-60 cursor-not-allowed"
            }`}
          >
            2. Matchs & Pronostics
          </button>
        </div>

        {/* STEP 1 SCREEN: BASE HISTORIQUE */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Clock className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Charger la Base Historique</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    Déposez les données historiques de championnats récents (images, pdf, txt) pour calibrer le moteur statistique de la session.
                  </p>
                </div>
              </div>

              {/* Upload Drag/Drop Box */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingHistory(true); }}
                onDragLeave={() => setIsDraggingHistory(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingHistory(false);
                  if (e.dataTransfer.files) {
                    processFiles(e.dataTransfer.files, setHistoryFiles, historyFiles);
                  }
                }}
                onClick={() => historyInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 min-h-[140px] ${
                  isDraggingHistory 
                    ? "border-indigo-400 bg-indigo-500/10" 
                    : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/80"
                }`}
              >
                <input
                  type="file"
                  multiple
                  ref={historyInputRef}
                  onChange={(e) => {
                    if (e.target.files) {
                      processFiles(e.target.files, setHistoryFiles, historyFiles);
                    }
                  }}
                  className="hidden"
                  accept=".png,.jpg,.jpeg,.webp,.pdf,.txt"
                />
                <Upload className="h-8 w-8 text-indigo-400" />
                <div>
                  <p className="text-xs font-bold text-slate-200">
                    Cliquez ou glissez-déposez vos fichiers ici
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    PNG, JPG, JPEG, WEBP, PDF, TXT · Max 20 fichiers · Jusqu'à 20 Mo chacun
                  </p>
                </div>
              </div>

              {/* File List */}
              {historyFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase">
                      Fichiers Chargés ({historyFiles.length})
                    </span>
                    <button 
                      onClick={() => setHistoryFiles([])}
                      className="text-[10px] font-bold text-slate-500 hover:text-red-400 transition-colors"
                    >
                      Tout effacer
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                    {historyFiles.map(file => (
                      <div key={file.id} className="flex justify-between items-center bg-slate-950/60 border border-slate-850 p-2.5 rounded-xl text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
                          <span className="truncate font-medium text-slate-300">{file.name}</span>
                          <span className="text-[9px] text-slate-500 font-mono">({(file.size / (1024 * 1024)).toFixed(2)} Mo)</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFile(file.id, true); }}
                          className="text-slate-500 hover:text-red-400 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ACTION BUTTON */}
              <button
                onClick={startHistoryAnalysis}
                disabled={historyFiles.length === 0}
                className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md ${
                  historyFiles.length > 0
                    ? "bg-gradient-to-r from-indigo-600 to-emerald-600 hover:scale-[1.02] cursor-pointer text-white"
                    : "bg-slate-950 text-slate-500 border border-slate-850 cursor-not-allowed"
                }`}
              >
                <Activity className="h-4 w-4" />
                <span>Analyser l'historique</span>
              </button>
            </div>

            {/* If History already memorized */}
            {memorizedHistory && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-black text-white uppercase">Base mémorisée</h4>
                    <p className="text-[10px] text-emerald-300/85">
                      Une base historique est déjà enregistrée pour cette session.
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearHistorySession}
                  className="text-[10px] font-black text-slate-400 hover:text-white uppercase bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-xl transition-all"
                >
                  Remplacer
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2 SCREEN: MATCHS & PRONOSTICS */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Charger les Matchs</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    Déposez les matchs du jour à pronostiquer. Le moteur calculera automatiquement les scores exacts.
                  </p>
                </div>
              </div>

              {/* Upload Matchs Drag/Drop Box */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingMatches(true); }}
                onDragLeave={() => setIsDraggingMatches(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingMatches(false);
                  if (e.dataTransfer.files) {
                    processFiles(e.dataTransfer.files, setMatchFiles, matchFiles);
                  }
                }}
                onClick={() => matchesInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 min-h-[140px] ${
                  isDraggingMatches 
                    ? "border-indigo-400 bg-indigo-500/10" 
                    : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/80"
                }`}
              >
                <input
                  type="file"
                  multiple
                  ref={matchesInputRef}
                  onChange={(e) => {
                    if (e.target.files) {
                      processFiles(e.target.files, setMatchFiles, matchFiles);
                    }
                  }}
                  className="hidden"
                  accept=".png,.jpg,.jpeg,.webp,.pdf,.txt"
                />
                <Upload className="h-8 w-8 text-indigo-400" />
                <div>
                  <p className="text-xs font-bold text-slate-200">
                    Glissez-déposez les fichiers de match ici
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    PNG, JPG, JPEG, WEBP, PDF, TXT · Max 20 fichiers · Jusqu'à 20 Mo chacun
                  </p>
                </div>
              </div>

              {/* Match File list */}
              {matchFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase">
                      Fichiers Match ({matchFiles.length})
                    </span>
                    <button 
                      onClick={() => setMatchFiles([])}
                      className="text-[10px] font-bold text-slate-500 hover:text-red-400 transition-colors"
                    >
                      Tout effacer
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                    {matchFiles.map(file => (
                      <div key={file.id} className="flex justify-between items-center bg-slate-950/60 border border-slate-850 p-2.5 rounded-xl text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
                          <span className="truncate font-medium text-slate-300">{file.name}</span>
                          <span className="text-[9px] text-slate-500 font-mono">({(file.size / (1024 * 1024)).toFixed(2)} Mo)</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFile(file.id, false); }}
                          className="text-slate-500 hover:text-red-400 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LAUNCH PREMIUM ANALYSIS BUTTON */}
              <button
                onClick={startMatchesAnalysis}
                disabled={matchFiles.length === 0}
                className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md ${
                  matchFiles.length > 0
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:scale-[1.02] cursor-pointer text-white"
                    : "bg-slate-950 text-slate-500 border border-slate-850 cursor-not-allowed"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>Lancer Analyse Premium</span>
              </button>
            </div>

            {/* RESULTS CONTAINER */}
            {analysisResults.length > 0 && (
              <div className="space-y-3.5">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy className="h-4 w-4" /> Résultats d'Analyse Premium
                  </span>
                  <button
                    onClick={() => setAnalysisResults([])}
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Effacer
                  </button>
                </div>

                <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-inner relative overflow-hidden">
                  {/* Subtle decorative glow */}
                  <div className="absolute bottom-0 right-0 p-12 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

                  {/* Clean Prediction rows strictly respecting formatting: Equipe A vs Equipe B : 1 (2-0) */}
                  <div className="divide-y divide-slate-900">
                    {analysisResults.map((result, idx) => {
                      // We can parse the parts for premium visual presentation, while still printing the exact text to be flawless
                      const parts = result.split(":");
                      const matchText = parts[0]?.trim() || "";
                      const predictionText = parts[1]?.trim() || "";

                      return (
                        <div key={idx} className="py-3 first:pt-0 last:pb-0 flex justify-between items-center gap-4 text-xs font-bold">
                          <span className="text-slate-300 truncate">{matchText}</span>
                          <span className="text-amber-400 font-mono shrink-0 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                            {predictionText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SESSION INFORMATION */}
        <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-2xl text-[10px] text-slate-500 leading-relaxed text-center">
          <p>
            Analyse Premium est un moteur d'analyse statistique multimodal sécurisé.
          </p>
          <p className="mt-0.5">
            Toutes les données extraites restent stockées temporairement pendant la session de l'utilisateur.
          </p>
        </div>

      </div>
    </div>
  );
}
