/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Trophy, Phone, Lock, UserPlus, LogIn, AlertCircle, ShieldCheck, User, Calendar } from 'lucide-react';
import { UserAccount } from '../types';
import { hashPassword } from '../utils/crypto';

interface AuthScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
  allUsers: UserAccount[];
  onRegisterUser: (newUser: UserAccount) => void;
}

export default function AuthScreen({ onLoginSuccess, allUsers, onRegisterUser }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration fields
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Clear error on toggle
  useEffect(() => {
    setError('');
    setPhoneNumber('');
    setPassword('');
    setUsername('');
    setDob('');
    setConfirmPassword('');
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Common validations
    if (mode === 'login') {
      if (!phoneNumber.trim() || !password.trim()) {
        setError('Veuillez remplir tous les champs.');
        return;
      }
    } else {
      if (!username.trim() || !phoneNumber.trim() || !dob || !password || !confirmPassword) {
        setError('Veuillez remplir tous les champs de l\'inscription.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Les deux mots de passe ne correspondent pas.');
        return;
      }
      if (username.trim().length < 3) {
        setError('Le nom d\'utilisateur doit contenir au moins 3 caractères.');
        return;
      }
    }

    if (phoneNumber.trim().length < 8) {
      setError('Le numéro de téléphone doit contenir au moins 8 chiffres.');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }

    // Age validation for registration
    if (mode === 'register') {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        setError('Inscription rejetée : vous devez avoir au moins 18 ans.');
        return;
      }
    }

    setLoading(true);

    try {
      const passwordHash = await hashPassword(password);

      if (mode === 'login') {
        // Authenticate
        const user = allUsers.find(
          (u) => u.phoneNumber === phoneNumber.trim() && u.passwordHash === passwordHash
        );

        if (!user) {
          setError('Numéro de téléphone ou mot de passe incorrect.');
          setLoading(false);
          return;
        }

        if (user.isSuspended) {
          setError('Votre compte a été suspendu par l\'administrateur.');
          setLoading(false);
          return;
        }

        onLoginSuccess(user);
      } else {
        // Register
        const exists = allUsers.some((u) => u.phoneNumber === phoneNumber.trim());
        if (exists) {
          setError('Ce numéro de téléphone est déjà enregistré.');
          setLoading(false);
          return;
        }

        const newUser: UserAccount = {
          userId: `USR-${Math.floor(100000 + Math.random() * 900000)}`,
          username: username.trim(),
          phoneNumber: phoneNumber.trim(),
          dob,
          passwordHash,
          isVip: false,
          isSuspended: false,
          soldeLiveTop: 50000,
          createdAt: new Date().toLocaleDateString('fr-FR')
        };

        onRegisterUser(newUser);
        onLoginSuccess(newUser);
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la connexion/inscription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-md premium-soccer-bg shadow-2xl flex flex-col justify-center p-6 relative font-sans">
      
      {/* Container Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl space-y-6">
        
        {/* App Logo & Title */}
        <div className="text-center space-y-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[#1A237E] shadow-md text-white mx-auto">
            <Trophy className="h-7 w-7 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase font-display">
              SOURSPARK PREDICTIONS
            </h1>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
              Analyses sportives par IA
            </p>
          </div>
        </div>

        {/* Toggle Mode Tab */}
        <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200/50">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-white text-[#1A237E] shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            Se connecter
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all ${
              mode === 'register'
                ? 'bg-white text-[#1A237E] shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            S'enregistrer
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Username Input (Registration only) */}
          {mode === 'register' && (
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                Nom d'utilisateur
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: Randria"
                  className="w-full bg-slate-50 text-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-200 font-medium"
                />
              </div>
            </div>
          )}

          {/* Phone Input */}
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
              Numéro de téléphone
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ex: 0341234567"
                className="w-full bg-slate-50 text-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-200 font-medium"
              />
            </div>
          </div>

          {/* Date of Birth Input (Registration only) */}
          {mode === 'register' && (
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                Date de naissance
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-200 font-medium"
                />
              </div>
            </div>
          )}

          {/* Password Input */}
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                className="w-full bg-slate-50 text-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-200 font-medium"
              />
            </div>
          </div>

          {/* Confirm Password Input (Registration only) */}
          {mode === 'register' && (
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="******"
                  className="w-full bg-slate-50 text-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-200 font-medium"
                />
              </div>
            </div>
          )}

          {/* Error Feedbacks */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-xs font-semibold bg-red-50 p-3 rounded-xl border border-red-100 animate-shake">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#1A237E] hover:bg-indigo-900 disabled:bg-slate-300 py-3.5 text-xs font-extrabold text-white transition-all uppercase tracking-wider shadow-md flex items-center justify-center gap-2 focus:outline-none"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : mode === 'login' ? (
              'CONNEXION'
            ) : (
              'CRÉER MON COMPTE'
            )}
          </button>
        </form>

        {/* Info Disclaimer */}
        <div className="flex items-center gap-1.5 justify-center text-[10px] text-slate-400 font-medium pt-2 border-t border-slate-100">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Accès privé, crypté et sécurisé par Sourspark.</span>
        </div>

      </div>

      {/* Footer Details */}
      <div className="mt-6 text-center text-[10px] text-slate-400 font-medium">
        Sourspark v2.0.2 · Tous droits réservés
      </div>
    </div>
  );
}
