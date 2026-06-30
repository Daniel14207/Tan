/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Radio,
  MessageSquare,
  Plus,
  Trash2,
  Settings,
  ShieldAlert,
  DollarSign,
  Check,
  X,
  Search,
  Database,
  Save,
  Clock,
  Activity,
  Trophy,
  Megaphone,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { Match, League, UserAccount, PaymentRequest, LiveSignal, ChatMessage } from '../types';

interface AdminPanelProps {
  onClose: () => void;
  matches: Match[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  leagues: League[];
  setLeagues: React.Dispatch<React.SetStateAction<League[]>>;
  users: UserAccount[];
  setUsers: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  paymentRequests: PaymentRequest[];
  setPaymentRequests: React.Dispatch<React.SetStateAction<PaymentRequest[]>>;
  liveSignals: LiveSignal[];
  setLiveSignals: React.Dispatch<React.SetStateAction<LiveSignal[]>>;
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

type AdminSubTab = 'users' | 'payments' | 'signals' | 'chat' | 'matches';

export default function AdminPanel({
  onClose,
  matches,
  setMatches,
  leagues,
  setLeagues,
  users,
  setUsers,
  paymentRequests,
  setPaymentRequests,
  liveSignals,
  setLiveSignals,
  chatMessages,
  setChatMessages,
}: AdminPanelProps) {
  const [subTab, setSubTab] = useState<AdminSubTab>('users');

  // --- Search state for Users ---
  const [userSearch, setUserSearch] = useState('');

  // --- New Signal State ---
  const [sigType, setSigType] = useState<'signal' | 'announcement'>('signal');
  const [sigTitle, setSigTitle] = useState('');
  const [sigContent, setSigContent] = useState('');
  const [sigMatch, setSigMatch] = useState('');
  const [sigPrediction, setSigPrediction] = useState('');
  const [sigOdds, setSigOdds] = useState('');
  const [sigIsPremium, setSigIsPremium] = useState(false);

  // --- Support Conversation State ---
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');

  // --- Match Edit / Add State ---
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [newMatchHome, setNewMatchHome] = useState('');
  const [newMatchAway, setNewMatchAway] = useState('');
  const [newMatchTime, setNewMatchTime] = useState('20:00');
  const [newMatchDate, setNewMatchDate] = useState('2026-06-30');
  const [newMatchLeague, setNewMatchLeague] = useState(leagues[0]?.id || 'eng');
  const [newMatchRound, setNewMatchRound] = useState('Journée 2');
  const [newMatchHomeScore, setNewMatchHomeScore] = useState('0');
  const [newMatchAwayScore, setNewMatchAwayScore] = useState('0');
  const [newMatchStatus, setNewMatchStatus] = useState<'FT' | 'LIVE' | 'Pending'>('Pending');
  const [newMatchLiveMin, setNewMatchLiveMin] = useState('0');
  const [newMatchIsVip, setNewMatchIsVip] = useState(false);
  const [newMatchIsFree, setNewMatchIsFree] = useState(true);

  // Filtered users
  const filteredUsers = users.filter(
    (u) =>
      u.phoneNumber.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.userId.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Group chats by unique user
  const uniqueChatUserIds = Array.from(new Set(chatMessages.map((msg) => msg.userId)));
  const usersWithChats = uniqueChatUserIds.map((uid) => {
    const userAcc = users.find((u) => u.userId === uid);
    const messages = chatMessages.filter((m) => m.userId === uid);
    const lastMessage = messages[messages.length - 1];
    return {
      userId: uid,
      phoneNumber: userAcc?.phoneNumber || 'Inconnu',
      lastText: lastMessage?.text || '',
      lastSender: lastMessage?.sender || 'user',
      messages,
    };
  });

  // Handle manual activation
  const handleToggleVip = (userId: string) => {
    const updated = users.map((u) => {
      if (u.userId === userId) {
        return { ...u, isVip: !u.isVip };
      }
      return u;
    });
    setUsers(updated);
    localStorage.setItem('sourspark_users', JSON.stringify(updated));

    // Also update active user if they changed themselves
    const active = localStorage.getItem('sourspark_current_user');
    if (active) {
      const parsed = JSON.parse(active);
      if (parsed.userId === userId) {
        parsed.isVip = !parsed.isVip;
        localStorage.setItem('sourspark_current_user', JSON.stringify(parsed));
        localStorage.setItem('vip_active', parsed.isVip ? 'true' : 'false');
      }
    }
  };

  // Handle suspension
  const handleToggleSuspend = (userId: string) => {
    const updated = users.map((u) => {
      if (u.userId === userId) {
        return { ...u, isSuspended: !u.isSuspended };
      }
      return u;
    });
    setUsers(updated);
    localStorage.setItem('sourspark_users', JSON.stringify(updated));
  };

  // Handle Payment Request Approval
  const handleApprovePayment = (reqId: string, userId: string) => {
    // 1. Mark payment approved
    const updatedReqs = paymentRequests.map((r) => {
      if (r.id === reqId) return { ...r, status: 'Approved' as const };
      return r;
    });
    setPaymentRequests(updatedReqs);
    localStorage.setItem('sourspark_payment_requests', JSON.stringify(updatedReqs));

    // 2. Set user as VIP
    const updatedUsers = users.map((u) => {
      if (u.userId === userId) return { ...u, isVip: true };
      return u;
    });
    setUsers(updatedUsers);
    localStorage.setItem('sourspark_users', JSON.stringify(updatedUsers));

    // 3. Update active user if same
    const active = localStorage.getItem('sourspark_current_user');
    if (active) {
      const parsed = JSON.parse(active);
      if (parsed.userId === userId) {
        parsed.isVip = true;
        localStorage.setItem('sourspark_current_user', JSON.stringify(parsed));
        localStorage.setItem('vip_active', 'true');
      }
    }

    alert('Paiement approuvé ! L\'accès Premium VIP de l\'utilisateur a été activé.');
  };

  const handleRejectPayment = (reqId: string) => {
    const updatedReqs = paymentRequests.map((r) => {
      if (r.id === reqId) return { ...r, status: 'Rejected' as const };
      return r;
    });
    setPaymentRequests(updatedReqs);
    localStorage.setItem('sourspark_payment_requests', JSON.stringify(updatedReqs));
    alert('Demande de paiement rejetée.');
  };

  // Handle Publish Signal/Announcement
  const handlePublishSignal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sigTitle.trim() || !sigContent.trim()) {
      alert('Veuillez remplir le titre et le contenu.');
      return;
    }

    const newSignal: LiveSignal = {
      id: `sig-${Date.now()}`,
      type: sigType,
      title: sigTitle.trim(),
      content: sigContent.trim(),
      matchInfo: sigType === 'signal' ? sigMatch.trim() : undefined,
      prediction: sigType === 'signal' ? sigPrediction.trim() : undefined,
      odds: sigType === 'signal' && sigOdds ? parseFloat(sigOdds) : undefined,
      isPremium: sigType === 'signal' ? sigIsPremium : false,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [newSignal, ...liveSignals];
    setLiveSignals(updated);
    localStorage.setItem('sourspark_live_signals', JSON.stringify(updated));

    // Reset Form
    setSigTitle('');
    setSigContent('');
    setSigMatch('');
    setSigPrediction('');
    setSigOdds('');
    setSigIsPremium(false);

    alert('Publié instantanément pour tous les utilisateurs !');
  };

  // Delete Signal
  const handleDeleteSignal = (sigId: string) => {
    const updated = liveSignals.filter((s) => s.id !== sigId);
    setLiveSignals(updated);
    localStorage.setItem('sourspark_live_signals', JSON.stringify(updated));
  };

  // Reply to private chat
  const handleSendAdminReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChatUser || !adminReplyText.trim()) return;

    const newMsg: ChatMessage = {
      id: `admin-msg-${Date.now()}`,
      userId: selectedChatUser,
      sender: 'admin',
      text: adminReplyText.trim(),
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [...chatMessages, newMsg];
    setChatMessages(updated);
    localStorage.setItem('sourspark_chat_messages', JSON.stringify(updated));
    setAdminReplyText('');
  };

  // Save/Create Match Action
  const handleSaveMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatchHome.trim() || !newMatchAway.trim()) {
      alert('Veuillez indiquer les noms des équipes.');
      return;
    }

    const leagueObj = leagues.find((l) => l.id === newMatchLeague);

    if (editingMatchId) {
      // Edit Match
      const updated = matches.map((m) => {
        if (m.id === editingMatchId) {
          return {
            ...m,
            homeTeam: newMatchHome.trim(),
            awayTeam: newMatchAway.trim(),
            matchTime: newMatchTime,
            date: newMatchDate,
            leagueId: newMatchLeague,
            leagueName: leagueObj?.name || 'Inconnue',
            round: newMatchRound,
            matchStatus: newMatchStatus,
            liveMinute: newMatchStatus === 'LIVE' ? parseInt(newMatchLiveMin) : undefined,
            finalScoreHome: newMatchStatus !== 'Pending' ? parseInt(newMatchHomeScore) : null,
            finalScoreAway: newMatchStatus !== 'Pending' ? parseInt(newMatchAwayScore) : null,
            predictions: {
              ...m.predictions,
              isVip: newMatchIsVip,
              isFree: newMatchIsFree,
            },
          };
        }
        return m;
      });
      setMatches(updated);
      localStorage.setItem('sourspark_matches', JSON.stringify(updated));
      setEditingMatchId(null);
      alert('Match modifié avec succès.');
    } else {
      // Create Match
      const newMatch: Match = {
        id: `match-${Date.now()}`,
        homeTeam: newMatchHome.trim(),
        awayTeam: newMatchAway.trim(),
        matchTime: newMatchTime,
        date: newMatchDate,
        leagueId: newMatchLeague,
        leagueName: leagueObj?.name || 'Inconnue',
        round: newMatchRound,
        matchStatus: newMatchStatus,
        liveMinute: newMatchStatus === 'LIVE' ? parseInt(newMatchLiveMin) : undefined,
        finalScoreHome: newMatchStatus !== 'Pending' ? parseInt(newMatchHomeScore) : null,
        finalScoreAway: newMatchStatus !== 'Pending' ? parseInt(newMatchAwayScore) : null,
        homeLogo: 'bg-indigo-600 text-white',
        awayLogo: 'bg-indigo-900 text-white',
        halfTimeScoreHome: newMatchStatus !== 'Pending' ? Math.max(0, parseInt(newMatchHomeScore) - 1) : null,
        halfTimeScoreAway: newMatchStatus !== 'Pending' ? Math.max(0, parseInt(newMatchAwayScore) - 1) : null,
        goalMinutes: { home: [], away: [] },
        odds: { homeWin: 1.85, draw: 3.40, awayWin: 4.10 },
        predictions: {
          btts: 'Yes',
          bttsOdds: 1.80,
          overUnder25: 'Over',
          overUnderOdds: 1.90,
          singleTip: '1',
          singleTipOdds: 1.85,
          htFt: '1/1',
          htFtOdds: 2.80,
          isVip: newMatchIsVip,
          isBest: false,
          isFree: newMatchIsFree,
          status: 'Pending',
        },
      };

      const updated = [newMatch, ...matches];
      setMatches(updated);
      localStorage.setItem('sourspark_matches', JSON.stringify(updated));
      alert('Match ajouté avec succès.');
    }

    // Reset Match Form
    setNewMatchHome('');
    setNewMatchAway('');
    setNewMatchTime('20:00');
    setNewMatchStatus('Pending');
    setNewMatchHomeScore('0');
    setNewMatchAwayScore('0');
    setNewMatchIsVip(false);
    setNewMatchIsFree(true);
  };

  const handleEditMatchClick = (m: Match) => {
    setEditingMatchId(m.id);
    setNewMatchHome(m.homeTeam);
    setNewMatchAway(m.awayTeam);
    setNewMatchTime(m.matchTime);
    setNewMatchDate(m.date);
    setNewMatchLeague(m.leagueId);
    setNewMatchRound(m.round);
    setNewMatchStatus(m.matchStatus);
    setNewMatchLiveMin(m.liveMinute ? m.liveMinute.toString() : '0');
    setNewMatchHomeScore(m.finalScoreHome ? m.finalScoreHome.toString() : '0');
    setNewMatchAwayScore(m.finalScoreAway ? m.finalScoreAway.toString() : '0');
    setNewMatchIsVip(m.predictions.isVip);
    setNewMatchIsFree(m.predictions.isFree);
    setSubTab('matches');
  };

  const handleDeleteMatch = (mId: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce match ?')) {
      const updated = matches.filter((m) => m.id !== mId);
      setMatches(updated);
      localStorage.setItem('sourspark_matches', JSON.stringify(updated));
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-md bg-slate-50 flex flex-col relative font-sans">
      {/* Admin Header */}
      <header className="bg-slate-900 text-white px-4 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-amber-400 animate-spin" />
          <div>
            <h1 className="text-sm font-black tracking-wider uppercase">PANEL ADMIN SOURSPARK</h1>
            <span className="text-[9px] text-amber-400 uppercase tracking-widest font-extrabold">MODE ADMINISTRATEUR SÉCURISÉ</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all focus:outline-none"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </header>

      {/* Admin Horizontal Tabs */}
      <div className="flex bg-slate-800 text-slate-400 text-[10px] font-bold overflow-x-auto scrollbar-none border-t border-slate-700">
        <button
          onClick={() => setSubTab('users')}
          className={`flex-1 py-3 px-2 text-center border-b-2 whitespace-nowrap focus:outline-none flex items-center justify-center gap-1 ${
            subTab === 'users' ? 'text-white border-amber-400 bg-slate-700/50' : 'border-transparent'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          Comptes
        </button>
        <button
          onClick={() => setSubTab('payments')}
          className={`flex-1 py-3 px-2 text-center border-b-2 whitespace-nowrap focus:outline-none flex items-center justify-center gap-1 ${
            subTab === 'payments' ? 'text-white border-amber-400 bg-slate-700/50' : 'border-transparent'
          }`}
        >
          <DollarSign className="h-3.5 w-3.5" />
          Paiements ({paymentRequests.filter((p) => p.status === 'Pending').length})
        </button>
        <button
          onClick={() => setSubTab('signals')}
          className={`flex-1 py-3 px-2 text-center border-b-2 whitespace-nowrap focus:outline-none flex items-center justify-center gap-1 ${
            subTab === 'signals' ? 'text-white border-amber-400 bg-slate-700/50' : 'border-transparent'
          }`}
        >
          <Radio className="h-3.5 w-3.5" />
          Signaux
        </button>
        <button
          onClick={() => setSubTab('chat')}
          className={`flex-1 py-3 px-2 text-center border-b-2 whitespace-nowrap focus:outline-none flex items-center justify-center gap-1 ${
            subTab === 'chat' ? 'text-white border-amber-400 bg-slate-700/50' : 'border-transparent'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Chats ({usersWithChats.length})
        </button>
        <button
          onClick={() => setSubTab('matches')}
          className={`flex-1 py-3 px-2 text-center border-b-2 whitespace-nowrap focus:outline-none flex items-center justify-center gap-1 ${
            subTab === 'matches' ? 'text-white border-amber-400 bg-slate-700/50' : 'border-transparent'
          }`}
        >
          <Database className="h-3.5 w-3.5" />
          Matchs / Ligues
        </button>
      </div>

      {/* Panel Inner Scrollable Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        
        {/* TAB 1: USER ACCOUNTS */}
        {subTab === 'users' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Users className="h-4 w-4 text-indigo-600" />
                Gestion des Utilisateurs ({users.length})
              </h2>

              <div className="relative">
                <Search className="absolute top-3 left-3 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par numéro ou ID..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto pr-1">
                {filteredUsers.map((u) => (
                  <div key={u.userId} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800">{u.phoneNumber}</span>
                        {u.isVip && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase">
                            VIP
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">ID: {u.userId} · Créé: {u.createdAt}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleVip(u.userId)}
                        className={`px-2 py-1 text-[10px] font-black uppercase rounded ${
                          u.isVip
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        VIP
                      </button>
                      <button
                        onClick={() => handleToggleSuspend(u.userId)}
                        className={`px-2 py-1 text-[10px] font-black uppercase rounded flex items-center gap-1 ${
                          u.isSuspended
                            ? 'bg-red-600 text-white'
                            : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
                        }`}
                      >
                        <ShieldAlert className="h-3 w-3" />
                        {u.isSuspended ? 'Suspendu' : 'Suspendre'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PAYMENT REQUESTS */}
        {subTab === 'payments' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Demandes d'abonnements Premium
              </h2>

              {paymentRequests.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400 font-medium">
                  Aucune demande de paiement enregistrée.
                </p>
              ) : (
                <div className="space-y-3 max-h-[450px] overflow-y-auto">
                  {paymentRequests.map((r) => (
                    <div key={r.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-bold text-slate-800 block">Tél: {r.userPhone}</span>
                          <span className="text-[9px] text-slate-400 block font-mono">ID: {r.userId} · {r.timestamp}</span>
                        </div>
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          r.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                          r.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {r.status === 'Approved' ? 'Approuvé' : r.status === 'Rejected' ? 'Rejeté' : 'En attente'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] py-2 border-t border-b border-slate-200/50 mb-2">
                        <div>
                          <span className="text-slate-400 block text-[9px]">MÉTHODE :</span>
                          <span className="font-extrabold text-slate-700 uppercase">{r.method}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px]">RÉFÉRENCE :</span>
                          <span className="font-mono font-extrabold text-indigo-700">{r.reference}</span>
                        </div>
                      </div>

                      {r.status === 'Pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprovePayment(r.id, r.userId)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 font-bold rounded flex items-center justify-center gap-1 text-[11px]"
                          >
                            <Check className="h-3.5 w-3.5" /> Approuver
                          </button>
                          <button
                            onClick={() => handleRejectPayment(r.id)}
                            className="flex-1 bg-red-100 text-red-600 hover:bg-red-200 py-1.5 font-bold rounded flex items-center justify-center gap-1 text-[11px]"
                          >
                            <X className="h-3.5 w-3.5" /> Rejeter
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SIGNALS & ANNOUNCEMENTS */}
        {subTab === 'signals' && (
          <div className="space-y-4">
            {/* Publish Form */}
            <form onSubmit={handlePublishSignal} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4 text-xs">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Megaphone className="h-4 w-4 text-amber-500" />
                Publier un Signal / Annonce
              </h2>

              {/* Type Switch */}
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setSigType('signal')}
                  className={`flex-1 py-1.5 text-center font-bold rounded-lg transition-all ${
                    sigType === 'signal' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  📡 Signal Match
                </button>
                <button
                  type="button"
                  onClick={() => setSigType('announcement')}
                  className={`flex-1 py-1.5 text-center font-bold rounded-lg transition-all ${
                    sigType === 'announcement' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  📢 Annonce Générale
                </button>
              </div>

              {/* Title & Content */}
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Titre de la publication</label>
                  <input
                    type="text"
                    value={sigTitle}
                    onChange={(e) => setSigTitle(e.target.value)}
                    placeholder="Ex: Alerte But en Direct, Annonce Importante"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Contenu / Description</label>
                  <textarea
                    value={sigContent}
                    onChange={(e) => setSigContent(e.target.value)}
                    placeholder="Ex: Le rythme s'intensifie. Pariez sur Plus de 1.5 buts maintenant."
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>

                {sigType === 'signal' && (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-1">Match Info</label>
                      <input
                        type="text"
                        value={sigMatch}
                        onChange={(e) => setSigMatch(e.target.value)}
                        placeholder="Ex: Arsenal - Chelsea"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-1">Prediction / Tip</label>
                      <input
                        type="text"
                        value={sigPrediction}
                        onChange={(e) => setSigPrediction(e.target.value)}
                        placeholder="Ex: Plus de 1.5 buts"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-1">Cote</label>
                      <input
                        type="text"
                        value={sigOdds}
                        onChange={(e) => setSigOdds(e.target.value)}
                        placeholder="Ex: 1.65"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <input
                        type="checkbox"
                        id="sigIsPremium"
                        checked={sigIsPremium}
                        onChange={(e) => setSigIsPremium(e.target.checked)}
                        className="rounded border-slate-300 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="sigIsPremium" className="text-[10px] font-bold text-slate-700">Premium VIP uniquement</label>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-[#1A237E] text-white font-extrabold py-2.5 rounded-xl uppercase tracking-wider"
              >
                PUBLIER INSTANTANÉMENT
              </button>
            </form>

            {/* Existing Signals List */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">PUBLICATIONS RÉCENTES</span>
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
                {liveSignals.map((sig) => (
                  <div key={sig.id} className="py-3 flex justify-between items-start gap-2 text-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-800">{sig.title}</span>
                        {sig.isPremium && (
                          <span className="bg-amber-100 text-amber-800 text-[8px] font-extrabold px-1 py-0.2 rounded uppercase">VIP</span>
                        )}
                        <span className="text-[9px] text-slate-400">({sig.type})</span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-1">{sig.content}</p>
                      {sig.matchInfo && (
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                          <span>Match: {sig.matchInfo}</span>
                          <span>Pred: {sig.prediction}</span>
                          <span>Cote: {sig.odds}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteSignal(sig.id)}
                      className="text-red-500 hover:text-red-700 p-1 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PRIVATE SUPPORT CHAT */}
        {subTab === 'chat' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              
              {/* User Conversation List */}
              {!selectedChatUser ? (
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3 text-xs">
                  <h2 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    Conversations Privées ({usersWithChats.length})
                  </h2>

                  {usersWithChats.length === 0 ? (
                    <p className="text-center py-8 text-slate-400 font-medium">
                      Aucun message d'utilisateur pour l'instant.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {usersWithChats.map((conv) => (
                        <button
                          key={conv.userId}
                          onClick={() => setSelectedChatUser(conv.userId)}
                          className="w-full py-3 flex items-start gap-3 hover:bg-slate-50 text-left transition-all px-1"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs shadow-inner">
                            {conv.phoneNumber.slice(0, 3)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                              <span className="font-bold text-slate-800 block truncate">{conv.phoneNumber}</span>
                              <span className="text-[9px] text-slate-400 font-mono font-bold uppercase">{conv.messages.length} msgs</span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {conv.lastSender === 'admin' ? 'Vous: ' : ''}{conv.lastText}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Opened Chat Thread View */
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col h-[450px]">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-3">
                    <button
                      onClick={() => setSelectedChatUser(null)}
                      className="text-xs font-bold text-indigo-600 flex items-center gap-1"
                    >
                      ← Liste
                    </button>
                    <span className="text-xs font-black text-slate-800">
                      Chat: {users.find((u) => u.userId === selectedChatUser)?.phoneNumber || 'Inconnu'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono select-all font-bold">
                      {selectedChatUser}
                    </span>
                  </div>

                  {/* Messages Bubble Feed */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs mb-3">
                    {chatMessages
                      .filter((m) => m.userId === selectedChatUser)
                      .map((msg) => (
                        <div
                          key={msg.id}
                          className={`max-w-[80%] p-3 rounded-2xl ${
                            msg.sender === 'admin'
                              ? 'bg-slate-800 text-white rounded-br-none ml-auto'
                              : 'bg-slate-100 text-slate-800 rounded-bl-none mr-auto'
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                          <span className="text-[8px] opacity-60 text-right block mt-1 font-mono">{msg.timestamp}</span>
                        </div>
                      ))}
                  </div>

                  {/* Reply Form */}
                  <form onSubmit={handleSendAdminReply} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Saisir votre réponse d'administrateur..."
                      value={adminReplyText}
                      onChange={(e) => setAdminReplyText(e.target.value)}
                      className="flex-1 bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      className="bg-[#1A237E] text-white px-4 py-2 font-bold rounded-xl text-xs hover:bg-indigo-900 transition-colors"
                    >
                      Envoyer
                    </button>
                  </form>
                </div>
              )}

            </div>
          </div>
        )}

        {/* TAB 5: MATCHES & LEAGUES DATABASE */}
        {subTab === 'matches' && (
          <div className="space-y-4">
            {/* Create/Edit Match Form */}
            <form onSubmit={handleSaveMatch} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4 text-xs">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Database className="h-4 w-4 text-indigo-600" />
                {editingMatchId ? 'Modifier le match' : 'Créer / Publier un Match'}
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Équipe Domicile (Home)</label>
                  <input
                    type="text"
                    value={newMatchHome}
                    onChange={(e) => setNewMatchHome(e.target.value)}
                    placeholder="Ex: Arsenal"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Équipe Extérieur (Away)</label>
                  <input
                    type="text"
                    value={newMatchAway}
                    onChange={(e) => setNewMatchAway(e.target.value)}
                    placeholder="Ex: Chelsea"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Heure de début</label>
                  <input
                    type="text"
                    value={newMatchTime}
                    onChange={(e) => setNewMatchTime(e.target.value)}
                    placeholder="Ex: 20:00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Date</label>
                  <input
                    type="date"
                    value={newMatchDate}
                    onChange={(e) => setNewMatchDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Ligue</label>
                  <select
                    value={newMatchLeague}
                    onChange={(e) => setNewMatchLeague(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  >
                    {leagues.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.logo} {l.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Journée / Round</label>
                  <input
                    type="text"
                    value={newMatchRound}
                    onChange={(e) => setNewMatchRound(e.target.value)}
                    placeholder="Ex: Journée 2, Finale"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Statut Match</label>
                  <select
                    value={newMatchStatus}
                    onChange={(e) => setNewMatchStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  >
                    <option value="Pending">À venir (Upcoming)</option>
                    <option value="LIVE">En Direct (LIVE)</option>
                    <option value="FT">Terminé (Finished)</option>
                  </select>
                </div>

                {newMatchStatus === 'LIVE' && (
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Minute Live</label>
                    <input
                      type="number"
                      value={newMatchLiveMin}
                      onChange={(e) => setNewMatchLiveMin(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                    />
                  </div>
                )}

                {newMatchStatus !== 'Pending' && (
                  <>
                    <div>
                      <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Score Domicile</label>
                      <input
                        type="number"
                        value={newMatchHomeScore}
                        onChange={(e) => setNewMatchHomeScore(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Score Extérieur</label>
                      <input
                        type="number"
                        value={newMatchAwayScore}
                        onChange={(e) => setNewMatchAwayScore(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center gap-1.5 pt-5">
                  <input
                    type="checkbox"
                    id="newMatchIsVip"
                    checked={newMatchIsVip}
                    onChange={(e) => setNewMatchIsVip(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 h-4 w-4"
                  />
                  <label htmlFor="newMatchIsVip" className="text-[10px] font-bold text-slate-700">Pronostic VIP</label>
                </div>

                <div className="flex items-center gap-1.5 pt-5">
                  <input
                    type="checkbox"
                    id="newMatchIsFree"
                    checked={newMatchIsFree}
                    onChange={(e) => setNewMatchIsFree(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 h-4 w-4"
                  />
                  <label htmlFor="newMatchIsFree" className="text-[10px] font-bold text-slate-700">Pronostic Gratuit (Free)</label>
                </div>
              </div>

              <div className="flex gap-2">
                {editingMatchId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMatchId(null);
                      setNewMatchHome('');
                      setNewMatchAway('');
                    }}
                    className="flex-1 bg-slate-100 text-slate-500 py-2.5 rounded-xl font-bold"
                  >
                    Annuler
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white font-extrabold py-2.5 rounded-xl uppercase tracking-wider hover:bg-indigo-700"
                >
                  {editingMatchId ? 'ENREGISTRER MODIFICATION' : 'PUBLIER LE MATCH'}
                </button>
              </div>
            </form>

            {/* Existing Matches List */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">BASE DES MATCHS ({matches.length})</span>
              <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto pr-1">
                {matches.map((m) => (
                  <div key={m.id} className="py-2.5 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-extrabold text-slate-800">
                        {m.homeTeam} {m.finalScoreHome !== null ? m.finalScoreHome : ''} - {m.finalScoreAway !== null ? m.finalScoreAway : ''} {m.awayTeam}
                      </span>
                      <div className="flex gap-2 text-[10px] text-slate-400 mt-0.5 font-medium">
                        <span>{m.leagueName}</span>
                        <span>{m.matchTime}</span>
                        <span>{m.date}</span>
                        <span className="text-indigo-600 uppercase font-extrabold">({m.matchStatus})</span>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditMatchClick(m)}
                        className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-2.5 py-1 text-[10px] rounded font-bold"
                      >
                        Éditer
                      </button>
                      <button
                        onClick={() => handleDeleteMatch(m.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
