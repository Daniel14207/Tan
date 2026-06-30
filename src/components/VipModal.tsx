/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Check, ShieldCheck, Crown, Landmark, Wallet, AlertCircle, Sparkles } from 'lucide-react';

interface VipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPayment: (method: 'orange' | 'airtel' | 'mvola' | 'usdt', reference: string, amount: string) => void;
  currentUserPhone?: string;
  onSelectPaymentMethod?: (method: 'orange' | 'airtel' | 'mvola' | 'usdt') => void;
}

type Step = 'benefits' | 'methods' | 'details' | 'success';
type PaymentMethod = 'orange' | 'airtel' | 'mvola' | 'usdt';

export default function VipModal({ isOpen, onClose, onSubmitPayment, currentUserPhone, onSelectPaymentMethod }: VipModalProps) {
  const [step, setStep] = useState<Step>('benefits');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('orange');
  const [reference, setReference] = useState('');
  const [userPhone, setUserPhone] = useState(currentUserPhone || '');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const benefits = [
    'Unlock all VIP predictions',
    'Live Premium Tips',
    'Daily Premium Signals',
    'Premium BTTS',
    'Premium HT/FT',
    'Premium Over/Under',
    'Premium Single Tips'
  ];

  const handleNextToMethods = () => {
    setStep('methods');
  };

  const handleSelectMethod = (method: PaymentMethod) => {
    if (onSelectPaymentMethod) {
      onSelectPaymentMethod(method);
      onClose();
    } else {
      setSelectedMethod(method);
      setStep('details');
    }
  };

  const handleBackToBenefits = () => {
    setStep('benefits');
  };

  const handleBackToMethods = () => {
    setStep('methods');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) {
      setError('Veuillez saisir la référence de transaction.');
      return;
    }
    if (!userPhone.trim()) {
      setError('Veuillez saisir votre numéro de téléphone.');
      return;
    }

    onSubmitPayment(selectedMethod, reference.trim(), '30,000 MGA');
    setStep('success');
  };

  const getMethodDetails = () => {
    switch (selectedMethod) {
      case 'orange':
        return {
          name: 'Orange Money',
          color: '#F16E00',
          textColor: 'text-[#F16E00]',
          bgLight: 'bg-[#F16E00]/5',
          borderCol: 'border-[#F16E00]/30',
          instructions: 'Effectuez un transfert de 30 000 MGA au numéro Orange Money : 032 45 678 90 (Nom: SOURSPARK VIP). Gardez le SMS reçu et copiez la référence de la transaction ci-dessous.'
        };
      case 'airtel':
        return {
          name: 'Airtel Money',
          color: '#FF0000',
          textColor: 'text-red-600',
          bgLight: 'bg-red-50',
          borderCol: 'border-red-200',
          instructions: 'Effectuez un transfert de 30 000 MGA au numéro Airtel Money : 033 12 345 67 (Nom: SOURSPARK VIP). Gardez le SMS reçu et copiez la référence de la transaction ci-dessous.'
        };
      case 'mvola':
        return {
          name: 'Mvola',
          color: '#00BE33',
          textColor: 'text-green-600',
          bgLight: 'bg-green-50',
          borderCol: 'border-green-200',
          instructions: 'Effectuez un transfert de 30 000 MGA au numéro MVola : 034 98 765 43 (Nom: SOURSPARK VIP). Gardez le SMS reçu et copiez la référence de la transaction ci-dessous.'
        };
      case 'usdt':
        return {
          name: 'USDT (TRC20)',
          color: '#26A17B',
          textColor: 'text-[#26A17B]',
          bgLight: 'bg-[#26A17B]/5',
          borderCol: 'border-[#26A17B]/20',
          instructions: 'Envoyez exactement 7.5 USDT (équivalent de 30 000 MGA) à l\'adresse de dépôt TRC20 ci-dessous. Copiez le TxHash de la transaction après envoi.\n\nAdresse: TYgq932KJsjSJDHw92iSJs9182sTRC20'
        };
    }
  };

  const methodInfo = getMethodDetails();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white border border-slate-100 text-slate-800 shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button
          id="btn-vip-modal-close"
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors focus:outline-none z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="p-6 pt-8">
          
          {/* STEP 1: BENEFITS */}
          {step === 'benefits' && (
            <div>
              {/* Header Banner */}
              <div className="flex justify-between items-start mb-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 uppercase tracking-wider">
                  <Crown className="h-3.5 w-3.5 fill-current" />
                  ACCÈS VIP PREMIUM
                </span>
                <span className="text-xs text-slate-400 font-sans font-medium">
                  30,000 MGA
                </span>
              </div>

              {/* Heading */}
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
                Débloquez tous les pronostics VIP
              </h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Profitez de la meilleure analyse footballistique assistée par l'intelligence artificielle pour maximiser vos gains.
              </p>

              {/* Benefits Checklist */}
              <div className="mt-5 space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">AVANTAGES PREMIUM</span>
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Banner */}
              <div className="mt-5 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100/40 flex justify-between items-center">
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-500 block">Tarif Unique</span>
                  <span className="text-lg font-black text-[#1A237E]">30,000 MGA</span>
                </div>
                <span className="text-[10px] font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-100 shadow-sm">
                  Accès Illimité
                </span>
              </div>

              {/* Action Buttons */}
              <button
                id="btn-vip-continue"
                onClick={handleNextToMethods}
                className="w-full mt-6 rounded-2xl bg-[#1A237E] hover:bg-indigo-900 py-3.5 text-sm font-extrabold text-white transition-colors shadow-lg shadow-indigo-600/10 uppercase tracking-wider focus:outline-none flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                S'ABONNER MAINTENANT
              </button>
            </div>
          )}

          {/* STEP 2: CHOOSE PAYMENT METHOD */}
          {step === 'methods' && (
            <div>
              {/* Back Button */}
              <button
                onClick={handleBackToBenefits}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mb-4"
              >
                ← Avantages
              </button>

              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Choisir le moyen de paiement
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Sélectionnez votre moyen de paiement pour activer vos accès VIP.
              </p>

              {/* Methods List */}
              <div className="mt-5 space-y-3">
                
                {/* Mobile Money Group */}
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-1">MOBILE MONEY</span>
                  
                  {/* Orange Money */}
                  <button
                    onClick={() => handleSelectMethod('orange')}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 shadow-sm text-left transition-all focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <svg viewBox="0 0 200 60" className="h-10 w-28 shrink-0 rounded-lg shadow-sm">
                        <rect width="200" height="60" fill="#000000" rx="6" />
                        <rect x="10" y="10" width="40" height="40" fill="#F16E00" rx="4" />
                        <text x="60" y="32" fill="#FFFFFF" fontSize="13" fontWeight="bold" fontFamily="sans-serif">orange</text>
                        <text x="60" y="46" fill="#F16E00" fontSize="11" fontWeight="extrabold" fontFamily="sans-serif">money</text>
                      </svg>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Orange Money</span>
                        <span className="text-[10px] text-slate-400">Paiement instantané</span>
                      </div>
                    </div>
                  </button>

                  {/* Airtel Money */}
                  <button
                    onClick={() => handleSelectMethod('airtel')}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 shadow-sm text-left transition-all focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <svg viewBox="0 0 200 60" className="h-10 w-28 shrink-0 rounded-lg shadow-sm">
                        <rect width="200" height="60" fill="#FF0000" rx="6" />
                        <path d="M25,40 C18,40 12,35 12,28 C12,20 18,15 25,15 C32,15 37,20 37,28 L37,40 L33,40 L33,37 C31,39 28,40 25,40 Z M25,36 C29,36 33,33 33,28 C33,23 29,19 25,19 C21,19 17,23 17,28 C17,33 21,36 25,36 Z" fill="#FFFFFF" />
                        <text x="55" y="30" fill="#FFFFFF" fontSize="13" fontWeight="bold" fontFamily="sans-serif">airtel</text>
                        <text x="55" y="44" fill="#FFFFFF" fontSize="10" fontWeight="normal" fontFamily="sans-serif">Money</text>
                      </svg>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Airtel Money</span>
                        <span className="text-[10px] text-slate-400">Paiement instantané</span>
                      </div>
                    </div>
                  </button>

                  {/* MVola */}
                  <button
                    onClick={() => handleSelectMethod('mvola')}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 shadow-sm text-left transition-all focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <svg viewBox="0 0 200 60" className="h-10 w-28 shrink-0 rounded-lg shadow-sm">
                        <rect width="200" height="60" fill="#00BE33" rx="6" />
                        <circle cx="30" cy="30" r="18" fill="#FFF200" />
                        <text x="30" y="37" fill="#00BE33" fontSize="22" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">M</text>
                        <text x="58" y="36" fill="#FFFFFF" fontSize="16" fontWeight="black" fontFamily="sans-serif">Vola</text>
                      </svg>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">MVola</span>
                        <span className="text-[10px] text-slate-400">Paiement instantané</span>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Crypto Group */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-1">CRYPTO</span>

                  {/* USDT */}
                  <button
                    onClick={() => handleSelectMethod('usdt')}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#26A17B]/5 hover:bg-[#26A17B]/10 border border-[#26A17B]/20 shadow-sm text-left transition-all focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <svg viewBox="0 0 200 60" className="h-10 w-28 shrink-0 rounded-lg shadow-sm">
                        <rect width="200" height="60" fill="#1C1E22" rx="6" />
                        <circle cx="30" cy="30" r="15" fill="#26A17B" />
                        <path d="M24,22 L36,22 L36,25 L31.5,25 L31.5,37 L28.5,37 L28.5,25 L24,25 Z M22,20 L38,20 L38,21 L22,21 Z" fill="#FFFFFF" />
                        <text x="55" y="30" fill="#FFFFFF" fontSize="12" fontWeight="extrabold" fontFamily="sans-serif">USDT</text>
                        <text x="55" y="44" fill="#26A17B" fontSize="10" fontWeight="bold" fontFamily="sans-serif">TRC20 Network</text>
                      </svg>
                      <div>
                        <span className="text-xs font-bold text-[#26A17B] block font-extrabold">USDT (TRC20)</span>
                        <span className="text-[10px] text-slate-400">Réseau Tron · 7.5 USDT</span>
                      </div>
                    </div>
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* STEP 3: SUBMIT TRANSACTION INFO */}
          {step === 'details' && (
            <div>
              {/* Back Button */}
              <button
                onClick={handleBackToMethods}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mb-4"
              >
                ← Moyens de paiement
              </button>

              <div className="flex items-center gap-2 mb-2">
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                  <Landmark className="h-4 w-4" />
                </span>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Payer avec {methodInfo?.name}
                </h2>
              </div>

              {/* Method Specific Instructions */}
              <div className={`p-4 rounded-2xl border ${methodInfo?.bgLight} ${methodInfo?.borderCol} text-xs font-medium text-slate-700 leading-relaxed mb-4`}>
                <span className={`text-[10px] font-extrabold uppercase tracking-wider ${methodInfo?.textColor} block mb-1.5`}>
                  INSTRUCTIONS DE TRANSFERT
                </span>
                <p className="whitespace-pre-line">
                  {methodInfo?.instructions}
                </p>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {selectedMethod === 'usdt' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs select-all">
                    <span className="text-[10px] text-slate-400 font-mono block select-none">Adresse TRC20 :</span>
                    <span className="font-mono text-[10px] text-slate-700 font-bold">TYgq932KJsjSJDHw92iSJs9182s</span>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                    {selectedMethod === 'usdt' ? 'Transaction Hash (TxHash)' : 'Référence de la transaction'}
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => {
                      setReference(e.target.value);
                      setError('');
                    }}
                    placeholder={selectedMethod === 'usdt' ? 'Saisir le TxHash de transfert...' : 'Saisir la référence SMS reçu...'}
                    className="w-full bg-slate-50 text-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Votre numéro de téléphone (Vérification)
                  </label>
                  <input
                    type="text"
                    value={userPhone}
                    onChange={(e) => {
                      setUserPhone(e.target.value);
                      setError('');
                    }}
                    placeholder="Saisir votre numéro de téléphone..."
                    className="w-full bg-slate-50 text-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-200"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-1.5 text-red-600 text-[11px] font-semibold bg-red-50 p-2.5 rounded-xl border border-red-100">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  id="btn-confirm-payment"
                  type="submit"
                  className="w-full rounded-2xl bg-[#1A237E] hover:bg-indigo-900 py-3.5 text-sm font-extrabold text-white transition-colors uppercase tracking-wider focus:outline-none shadow-md"
                >
                  CONFIRMER LE PAIEMENT
                </button>
              </form>
            </div>
          )}

          {/* STEP 4: SUCCESS VIEW */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto">
                <ShieldCheck className="h-8 w-8 stroke-[2.5]" />
              </span>

              <div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight leading-snug">
                  Paiement soumis avec succès !
                </h2>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-[300px] mx-auto">
                  Votre transaction a été transmise à notre équipe pour vérification manuelle. Votre compte Premium VIP sera activé sous peu (généralement en moins de 15 minutes).
                </p>
              </div>

              <button
                id="btn-success-close"
                onClick={onClose}
                className="w-full rounded-2xl bg-[#1A237E] hover:bg-indigo-900 py-3.5 text-xs font-extrabold text-white transition-colors uppercase tracking-wider focus:outline-none"
              >
                RETOURNER AUX PRONOSTICS
              </button>
            </div>
          )}

          {/* Footer Securise */}
          {step !== 'success' && (
            <div className="mt-6 flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 p-3 text-[10px] text-slate-500 text-center">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Paiement sécurisé et vérifié par l'administration Sourspark.</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
