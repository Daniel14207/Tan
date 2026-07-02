/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, AlertCircle, Sparkles, Lock } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminLoginModal({ isOpen, onClose, onSuccess }: AdminLoginModalProps) {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Accept 9729 or 2026 as secure administration codes
    if (pin === '9729' || pin === '2026') {
      onSuccess();
      onClose();
    } else {
      setError('Code incorrect');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-[#0B0F19] border border-slate-800/80 rounded-3xl p-6 shadow-2xl relative text-center space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Shield Icon Header */}
        <div className="flex flex-col items-center space-y-2 pt-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 relative">
            <Lock className="h-8 w-8 text-white animate-pulse" />
            <div className="absolute inset-0 rounded-2xl border border-white/20" />
          </div>
          <h2 className="text-lg font-black tracking-tight text-white uppercase font-display flex items-center gap-1.5 mt-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            Administration sécurisée
          </h2>
          <p className="text-[11px] text-slate-400 max-w-[240px]">
            Saisissez le code d'accès sécurisé pour débloquer le terminal de contrôle.
          </p>
        </div>

        {/* Form Area */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider">
              Code d'accès
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError('');
              }}
              placeholder="••••••"
              maxLength={12}
              autoFocus
              className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl px-4 py-3 text-white text-center font-bold tracking-widest text-lg focus:outline-none focus:border-indigo-500 placeholder-slate-700 transition-all focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>

          {error && (
            <div className="flex items-center justify-center gap-1.5 text-rose-500 text-[11px] font-bold py-1 bg-rose-500/10 border border-rose-500/20 rounded-xl animate-bounce">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold py-3.5 rounded-2xl uppercase tracking-widest text-[11px] transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-1.5"
          >
            Se connecter
          </button>
        </form>

        {/* Secure connection indicator */}
        <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-500 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>CONNEXION SÉCURISÉE SSL 256-BIT</span>
        </div>

      </div>
    </div>
  );
}
