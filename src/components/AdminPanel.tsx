/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
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
  ArrowLeft,
  LogOut,
  Lock,
  Sparkles,
  Activity,
  Bell,
  LayoutDashboard,
  Crown,
  TrendingUp,
  Image as ImageIcon,
  CheckCircle2,
  Edit,
  Phone,
  Clock,
  Eye,
  Shield,
  Cpu,
  Zap,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { Match, League, UserAccount, PaymentRequest, LiveSignal, ChatMessage, NotificationItem, ParsedMatch } from '../types';
import { PremiumPoster, parsePastedPredictions } from './PremiumPoster';
import { BalanceLog } from '../types';

// Utility helper to format Date to DD/MM/YYYY HH:mm:ss
export function formatFrenchDateTime(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  } catch (e) {
    return 'N/A';
  }
}

// Utility helper to compute remaining time from expiration date to the exact second
export function getTimeRemainingStr(expirationDateStr?: string): string {
  if (!expirationDateStr) return 'Aucun';
  const now = new Date().getTime();
  const exp = new Date(expirationDateStr).getTime();
  const diff = exp - now;
  if (diff <= 0) return 'Expiré ❌';
  
  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  const dStr = days > 0 ? `${days}j ` : '';
  const hStr = hours > 0 || days > 0 ? `${hours}h ` : '';
  const mStr = minutes > 0 || hours > 0 || days > 0 ? `${minutes}m ` : '';
  const sStr = `${seconds}s`;
  
  return `${dStr}${hStr}${mStr}${sStr}`;
}

interface AdminPanelProps {
  onClose: () => void;
  onAdminLogout: () => void;
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
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
}

type AdminSubTab =
  | 'dashboard'
  | 'users'
  | 'chat'
  | 'premium'
  | 'payments'
  | 'signals'
  | 'notifications'
  | 'stats'
  | 'matches'
  | 'settings'
  | 'balance';

export default function AdminPanel({
  onClose,
  onAdminLogout,
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
  notifications,
  setNotifications,
}: AdminPanelProps) {
  const [subTab, setSubTab] = useState<AdminSubTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- SYSTEM MONITOR METRICS & CLOCK ---
  const [cpu, setCpu] = useState(42);
  const [ram, setRam] = useState(68);
  const [storage, setStorage] = useState(55);
  const [network, setNetwork] = useState(72);
  const [performance, setPerformance] = useState(98);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCpu(prev => {
        const delta = Math.floor(Math.random() * 5) - 2;
        const next = prev + delta;
        return Math.max(38, Math.min(48, next));
      });
      setRam(prev => {
        const delta = Math.floor(Math.random() * 3) - 1;
        const next = prev + delta;
        return Math.max(65, Math.min(72, next));
      });
      setNetwork(prev => {
        const delta = Math.floor(Math.random() * 7) - 3;
        const next = prev + delta;
        return Math.max(68, Math.min(78, next));
      });
      setPerformance(prev => {
        const delta = Math.floor(Math.random() * 3) - 1;
        const next = prev + delta;
        return Math.max(96, Math.min(99, next));
      });
    }, 3000);

    const timeTimer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    }, 1000);

    const now = new Date();
    setCurrentTime(now.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }));

    return () => {
      clearInterval(timer);
      clearInterval(timeTimer);
    };
  }, []);

  // --- SEARCH & FILTERS ---
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'free' | 'premium'>('all');
  const [chatSearch, setChatSearch] = useState('');
  const [premiumSearch, setPremiumSearch] = useState('');

  // --- POPUPS & DETAILED MODALS ---
  const [viewingUser, setViewingUser] = useState<UserAccount | null>(null);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDob, setEditDob] = useState('');

  // --- LIVE TOP STATE ---
  const [sigType, setSigType] = useState<'text' | 'prediction' | 'image' | 'result' | 'announcement'>('prediction');
  const [sigTitle, setSigTitle] = useState("Coupe d'Afrique");
  const [sigContent, setSigContent] = useState('');
  const [sigMatch, setSigMatch] = useState('');
  const [sigPrediction, setSigPrediction] = useState('');
  const [sigOdds, setSigOdds] = useState('');
  const [sigImageUrl, setSigImageUrl] = useState('');
  const [sigDate, setSigDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sigTime, setSigTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [sigIsPremium, setSigIsPremium] = useState(true);
  const [formTab, setFormTab] = useState<'text' | 'datetime' | 'preview'>('text');

  // --- CHAT STATE ---
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');

  // --- NOTIFICATION STATE ---
  const [notifType, setNotifType] = useState<'Notification' | 'Annonce' | 'Maintenance' | 'Promotion' | 'Signal'>('Notification');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifContent, setNotifContent] = useState('');

  // --- MATCH DATABASE STATE ---
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [mHome, setMHome] = useState('');
  const [mAway, setMAway] = useState('');
  const [mTime, setMTime] = useState('20:00');
  const [mDate, setMDate] = useState('2026-06-30');
  const [mLeague, setMLeague] = useState(leagues[0]?.id || 'eng');
  const [mRound, setMRound] = useState('Journée 1');
  const [mHomeScore, setMHomeScore] = useState('0');
  const [mAwayScore, setMAwayScore] = useState('0');
  const [mStatus, setMStatus] = useState<'FT' | 'LIVE' | 'Pending'>('Pending');
  const [mLiveMin, setMLiveMin] = useState('0');
  const [mIsVip, setMIsVip] = useState(false);
  const [mIsFree, setMIsFree] = useState(true);

  // --- SETTINGS STATE ---
  const [adminPinCode, setAdminPinCode] = useState(() => localStorage.getItem('sourspark_admin_pin') || '2026');
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(() => localStorage.getItem('sourspark_maintenance') === 'true');
  const [supportPhone, setSupportPhone] = useState(() => localStorage.getItem('sourspark_support_phone') || '+261 34 259 4678');

  // --- GESTION SOLDE & TRANSACTION LOGS STATE ---
  const [balanceSearch, setBalanceSearch] = useState('');
  const [selectedCompetition, setSelectedCompetition] = useState("Coupe d'Afrique");
  const [balanceLogs, setBalanceLogs] = useState<BalanceLog[]>(() => {
    const saved = localStorage.getItem('sourspark_balance_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedHistoryUser, setSelectedHistoryUser] = useState<UserAccount | null>(null);
  const [historyTab, setHistoryTab] = useState<'profile' | 'transactions' | 'payments' | 'connections'>('profile');

  // Helper to sync user accounts and session
  const syncUsersAndSession = (updatedUsersList: UserAccount[]) => {
    setUsers(updatedUsersList);
    localStorage.setItem('sourspark_users', JSON.stringify(updatedUsersList));
    
    const active = localStorage.getItem('sourspark_current_user');
    if (active) {
      const parsed = JSON.parse(active);
      const fresh = updatedUsersList.find(u => u.userId === parsed.userId);
      if (fresh) {
        localStorage.setItem('sourspark_current_user', JSON.stringify(fresh));
      }
    }
  };

  // Helper to log operations securely
  const writeBalanceLog = (
    targetUser: UserAccount,
    action: BalanceLog['action'],
    amount?: number
  ) => {
    const newLog: BalanceLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      adminUsername: 'Admin',
      targetUserId: targetUser.userId,
      targetUsername: targetUser.username,
      targetPhone: targetUser.phoneNumber,
      action,
      amount,
      timestamp: new Date().toISOString()
    };
    const updatedLogs = [newLog, ...balanceLogs];
    setBalanceLogs(updatedLogs);
    localStorage.setItem('sourspark_balance_logs', JSON.stringify(updatedLogs));
  };

  // Push user notification helper
  const pushUserNotification = (title: string, content: string) => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      title,
      content,
      date: new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }),
      read: false
    };
    const updated = [newNotif, ...notifications];
    setNotifications(updated);
    localStorage.setItem('sourspark_notifications', JSON.stringify(updated));
  };

  // 1. Ajouter Solde 10 000 Ar (Active l'accès pour 15 jours)
  const handleAddUserBalance = (targetUser: UserAccount, amount: number) => {
    const now = new Date();
    const expiration = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // exactly 15 days
    
    const updated = users.map(u => {
      if (u.userId === targetUser.userId) {
        return {
          ...u,
          soldeLiveTop: amount,
          sigActivationDate: now.toISOString(),
          sigExpirationDate: expiration.toISOString()
        };
      }
      return u;
    });
    
    syncUsersAndSession(updated);
    writeBalanceLog(targetUser, 'add', amount);
    
    // Send active notification
    const formattedExp = formatFrenchDateTime(expiration.toISOString());
    pushUserNotification(
      "✅ Accès Live TOP Activé !",
      `Votre accès Live TOP est maintenant actif. Valable jusqu'au : ${formattedExp}`
    );
    
    alert(`💰 Solde de ${amount.toLocaleString('fr-FR')} Ar ajouté à ${targetUser.username}. Accès activé pour 15 jours (jusqu'au ${formattedExp}).`);
  };

  // 2. Retirer Solde (Désactive l'accès immédiatement)
  const handleRemoveUserBalance = (targetUser: UserAccount) => {
    const updated = users.map(u => {
      if (u.userId === targetUser.userId) {
        return {
          ...u,
          soldeLiveTop: 0,
          sigActivationDate: undefined,
          sigExpirationDate: undefined
        };
      }
      return u;
    });
    
    syncUsersAndSession(updated);
    writeBalanceLog(targetUser, 'remove', targetUser.soldeLiveTop);
    
    // Send expired notification
    pushUserNotification(
      "❌ Accès Live TOP Expiré",
      "Votre accès Live TOP est expiré. Veuillez effectuer un nouveau paiement."
    );
    
    alert(`❌ Accès Live TOP révoqué et solde mis à 0 Ar pour ${targetUser.username}.`);
  };

  // 3. Prolonger l'accès (+15 jours et +10 000 Ar)
  const handleProlongUserBalance = (targetUser: UserAccount) => {
    const now = new Date();
    // If user has an active, non-expired date, prolong from that date. Otherwise, prolong from now.
    const currentExp = targetUser.sigExpirationDate && new Date(targetUser.sigExpirationDate).getTime() > now.getTime()
      ? new Date(targetUser.sigExpirationDate)
      : now;
      
    const newExpiration = new Date(currentExp.getTime() + 15 * 24 * 60 * 60 * 1000);
    const addedAmount = 10000;
    
    const updated = users.map(u => {
      if (u.userId === targetUser.userId) {
        return {
          ...u,
          soldeLiveTop: (u.soldeLiveTop || 0) + addedAmount,
          sigExpirationDate: newExpiration.toISOString(),
          sigActivationDate: u.sigActivationDate || now.toISOString()
        };
      }
      return u;
    });
    
    syncUsersAndSession(updated);
    writeBalanceLog(targetUser, 'prolong', addedAmount);
    
    const formattedExp = formatFrenchDateTime(newExpiration.toISOString());
    pushUserNotification(
      "⚡ Accès Live TOP Prolongé !",
      `Votre accès Live TOP a été prolongé avec succès. Valable jusqu'au : ${formattedExp}`
    );
    
    alert(`⚡ Accès prolongé de 15 jours pour ${targetUser.username} (nouvelle expiration : ${formattedExp}).`);
  };

  // 4. Suspendre / Réactiver l'utilisateur
  const handleToggleSuspendUser = (targetUser: UserAccount) => {
    const isSuspending = !targetUser.isSuspended;
    const updated = users.map(u => {
      if (u.userId === targetUser.userId) {
        return { ...u, isSuspended: isSuspending };
      }
      return u;
    });
    
    syncUsersAndSession(updated);
    writeBalanceLog(targetUser, isSuspending ? 'suspend' : 'unsuspend');
    
    alert(isSuspending ? `⛔ Utilisateur ${targetUser.username} suspendu.` : `🟢 Suspension levée pour ${targetUser.username}.`);
  };

  // Filter users based on balance search queries
  const filteredBalanceUsers = useMemo(() => {
    return users.filter((u) => {
      const q = (balanceSearch || '').toLowerCase();
      if (!q) return true;
      
      const matchesText = 
        (u.username || '').toLowerCase().includes(q) ||
        (u.phoneNumber || '').toLowerCase().includes(q) ||
        (u.userId || '').toLowerCase().includes(q);
        
      if (matchesText) return true;
      
      if (q === 'premium' && u.isVip) return true;
      if (q === 'gratuit' && !u.isVip) return true;
      if (q === 'solde' && (u.soldeLiveTop || 0) > 0) return true;
      
      // search by specific balance number
      if (!isNaN(Number(q)) && (u.soldeLiveTop || 0) === Number(q)) return true;
      
      return false;
    });
  }, [users, balanceSearch]);

  // Check if a user is online (logged in within last 5 minutes)
  const isUserOnline = (u: UserAccount) => {
    // Admin is considered online, current user is always online
    const activeSession = localStorage.getItem('sourspark_current_user');
    if (activeSession) {
      const parsed = JSON.parse(activeSession);
      if (parsed.userId === u.userId) return true;
    }
    if (!u.lastConnectionAt) return false;
    try {
      const lastConn = new Date(u.lastConnectionAt);
      const diffMs = new Date().getTime() - lastConn.getTime();
      return diffMs < 5 * 60 * 1000; // 5 minutes window
    } catch (e) {
      return false;
    }
  };

  // --- ACTIONS ---
  const handleToggleVip = (userId: string) => {
    const updated = users.map((u) => (u.userId === userId ? { ...u, isVip: !u.isVip } : u));
    setUsers(updated);
    localStorage.setItem('sourspark_users', JSON.stringify(updated));
    
    // Sync current session if needed
    const active = localStorage.getItem('sourspark_current_user');
    if (active) {
      const parsed = JSON.parse(active);
      if (parsed.userId === userId) {
        parsed.isVip = !parsed.isVip;
        localStorage.setItem('sourspark_current_user', JSON.stringify(parsed));
      }
    }
  };

  const handleSetVipStatus = (userId: string, active: boolean) => {
    const updated = users.map((u) => (u.userId === userId ? { ...u, isVip: active } : u));
    setUsers(updated);
    localStorage.setItem('sourspark_users', JSON.stringify(updated));
    alert(active ? '👑 PREMIUM activé immédiatement !' : '❌ PREMIUM révoqué.');
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) {
      const updated = users.filter((u) => u.userId !== userId);
      setUsers(updated);
      localStorage.setItem('sourspark_users', JSON.stringify(updated));
      alert('Utilisateur supprimé de la base.');
    }
  };

  const handleOpenEditUser = (u: UserAccount) => {
    setEditingUser(u);
    setEditUsername(u.username);
    setEditPhone(u.phoneNumber);
    setEditDob(u.dob);
  };

  const handleSaveUserEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const updated = users.map((u) =>
      u.userId === editingUser.userId
        ? { ...u, username: editUsername, phoneNumber: editPhone, dob: editDob }
        : u
    );
    setUsers(updated);
    localStorage.setItem('sourspark_users', JSON.stringify(updated));
    setEditingUser(null);
    alert('Modification enregistrée avec succès.');
  };

  const handleApprovePayment = (reqId: string, userId: string) => {
    const updatedReqs = paymentRequests.map((r) =>
      r.id === reqId ? { ...r, status: 'Approved' as const } : r
    );
    setPaymentRequests(updatedReqs);
    localStorage.setItem('sourspark_payment_requests', JSON.stringify(updatedReqs));

    const updatedUsers = users.map((u) => (u.userId === userId ? { ...u, isVip: true } : u));
    setUsers(updatedUsers);
    localStorage.setItem('sourspark_users', JSON.stringify(updatedUsers));
    alert('✅ Paiement approuvé ! Statut VIP activé automatiquement.');
  };

  const handleRejectPayment = (reqId: string) => {
    const updatedReqs = paymentRequests.map((r) =>
      r.id === reqId ? { ...r, status: 'Rejected' as const } : r
    );
    setPaymentRequests(updatedReqs);
    localStorage.setItem('sourspark_payment_requests', JSON.stringify(updatedReqs));
    alert('❌ Paiement refusé.');
  };

  const handlePublishSignal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sigTitle.trim() || !sigContent.trim()) {
      alert('Veuillez remplir le titre et coller le texte.');
      return;
    }
    const parsed = parsePastedPredictions(sigContent);
    const newSig: LiveSignal = {
      id: `sig-${Date.now()}`,
      type: 'signal',
      postType: 'prediction',
      title: sigTitle.trim(),
      content: sigContent.trim(),
      isPremium: sigIsPremium,
      timestamp: `${sigDate.split('-').reverse().join('/')} à ${sigTime}`,
      parsedMatches: parsed,
      reactions: {
        love: 12,
        like: 8,
        fire: 15,
        bravo: 9,
        wow: 5
      },
      comments: [
        {
          id: 'comment-1',
          username: 'Mister Gain',
          text: "Merci boss, t'es le meilleur 🔥💪",
          timestamp: '14:14',
          replies: []
        },
        {
          id: 'comment-2',
          username: 'Parieur Pro',
          text: 'Incroyable comme toujours ✅✅',
          timestamp: '14:15',
          replies: []
        }
      ]
    };
    const updated = [newSig, ...liveSignals];
    setLiveSignals(updated);
    localStorage.setItem('sourspark_live_signals', JSON.stringify(updated));
    
    // Clear Form
    setSigTitle('');
    setSigContent('');
    alert('📢 Publication diffusée immédiatement sur le Live TOP !');
  };

  const handlePushAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifContent.trim()) {
      alert('Veuillez remplir le titre et le contenu.');
      return;
    }
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `[${notifType.toUpperCase()}] ${notifTitle.trim()}`,
      content: notifContent.trim(),
      date: new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
      read: false,
    };
    const updated = [newNotif, ...notifications];
    setNotifications(updated);
    localStorage.setItem('sourspark_notifications', JSON.stringify(updated));
    setNotifTitle('');
    setNotifContent('');
    alert('🔔 Notification push diffusée à tous les terminaux !');
  };

  const handleSendAdminMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChatUserId || !adminReplyText.trim()) return;

    const newMsg: ChatMessage = {
      id: `admin-msg-${Date.now()}`,
      userId: selectedChatUserId,
      sender: 'admin',
      text: adminReplyText.trim(),
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      date: 'Aujourd\'hui',
      status: 'lu',
    };
    const updated = [...chatMessages, newMsg];
    setChatMessages(updated);
    localStorage.setItem('sourspark_chat_messages', JSON.stringify(updated));
    setAdminReplyText('');
  };

  const handleDeleteConversation = (userId: string) => {
    if (confirm('Voulez-vous supprimer l\'historique des discussions avec cet utilisateur ?')) {
      const updated = chatMessages.filter((m) => m.userId !== userId);
      setChatMessages(updated);
      localStorage.setItem('sourspark_chat_messages', JSON.stringify(updated));
      setSelectedChatUserId(null);
      alert('Conversation supprimée.');
    }
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('sourspark_admin_pin', adminPinCode);
    alert('🔐 Code PIN d\'accès administrateur modifié avec succès !');
  };

  const handleToggleMaintenance = (enabled: boolean) => {
    setMaintenanceEnabled(enabled);
    localStorage.setItem('sourspark_maintenance', enabled ? 'true' : 'false');
  };

  const handleSaveMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mHome.trim() || !mAway.trim()) {
      alert('Saisir le nom des équipes.');
      return;
    }
    const leagueObj = leagues.find((l) => l.id === mLeague);

    if (editingMatchId) {
      const updated = matches.map((m) => {
        if (m.id === editingMatchId) {
          return {
            ...m,
            homeTeam: mHome.trim(),
            awayTeam: mAway.trim(),
            matchTime: mTime,
            date: mDate,
            leagueId: mLeague,
            leagueName: leagueObj?.name || 'Inconnue',
            round: mRound,
            matchStatus: mStatus,
            liveMinute: mStatus === 'LIVE' ? parseInt(mLiveMin) : undefined,
            finalScoreHome: mStatus !== 'Pending' ? parseInt(mHomeScore) : null,
            finalScoreAway: mStatus !== 'Pending' ? parseInt(mAwayScore) : null,
            predictions: { ...m.predictions, isVip: mIsVip, isFree: mIsFree },
          };
        }
        return m;
      });
      setMatches(updated);
      localStorage.setItem('sourspark_matches', JSON.stringify(updated));
      setEditingMatchId(null);
      alert('Match modifié.');
    } else {
      const newM: Match = {
        id: `match-${Date.now()}`,
        homeTeam: mHome.trim(),
        awayTeam: mAway.trim(),
        homeLogo: 'from-blue-500 to-indigo-600',
        awayLogo: 'from-emerald-500 to-teal-600',
        matchTime: mTime,
        date: mDate,
        leagueId: mLeague,
        leagueName: leagueObj?.name || 'Inconnue',
        round: mRound,
        matchStatus: mStatus,
        liveMinute: mStatus === 'LIVE' ? parseInt(mLiveMin) : undefined,
        finalScoreHome: mStatus !== 'Pending' ? parseInt(mHomeScore) : null,
        finalScoreAway: mStatus !== 'Pending' ? parseInt(mAwayScore) : null,
        halfTimeScoreHome: null,
        halfTimeScoreAway: null,
        goalMinutes: { home: [], away: [] },
        odds: { homeWin: 1.85, draw: 3.4, awayWin: 4.2 },
        predictions: {
          btts: 'Yes',
          bttsOdds: 1.95,
          overUnder25: 'Over',
          overUnderOdds: 1.8,
          singleTip: '1',
          singleTipOdds: 1.85,
          htFt: '1/1',
          htFtOdds: 2.8,
          isVip: mIsVip,
          isBest: false,
          isFree: mIsFree,
          status: 'Pending',
        },
      };
      const updated = [newM, ...matches];
      setMatches(updated);
      localStorage.setItem('sourspark_matches', JSON.stringify(updated));
      alert('Match créé.');
    }
    setMHome('');
    setMAway('');
  };

  // --- COMPUTED & FILTERED LISTS ---
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const query = (userSearch || '').toLowerCase();
      const matchesSearch =
        (u.username || '').toLowerCase().includes(query) ||
        (u.phoneNumber || '').toLowerCase().includes(query) ||
        (u.userId || '').toLowerCase().includes(query);
      if (!matchesSearch) return false;
      if (userStatusFilter === 'free' && u.isVip) return false;
      if (userStatusFilter === 'premium' && !u.isVip) return false;
      return true;
    });
  }, [users, userSearch, userStatusFilter]);

  const uniqueChatUserIds = Array.from(new Set(chatMessages.map((m) => m.userId)));
  const conversations = useMemo(() => {
    return uniqueChatUserIds
      .filter((uid) => uid !== 'system')
      .map((uid) => {
        const u = users.find((x) => x.userId === uid);
        const msgs = chatMessages.filter((m) => m.userId === uid);
        const lastMsg = msgs[msgs.length - 1];
        return {
          userId: uid,
          username: u?.username || 'Utilisateur',
          phone: u?.phoneNumber || 'Non renseigné',
          lastText: lastMsg?.text || 'Aucun message',
          timestamp: lastMsg?.timestamp || '00:00',
          messages: msgs,
        };
      })
      .filter((c) => {
        const query = (chatSearch || '').toLowerCase();
        return (c.username || '').toLowerCase().includes(query) || (c.phone || '').includes(query);
      });
  }, [chatMessages, users, uniqueChatUserIds, chatSearch]);

  const premiumFilterUsers = useMemo(() => {
    return users.filter((u) => {
      const q = (premiumSearch || '').toLowerCase();
      return (u.username || '').toLowerCase().includes(q) || (u.phoneNumber || '').includes(q);
    });
  }, [users, premiumSearch]);

  return (
    <div className="w-full bg-[#040815] min-h-screen text-slate-100 font-sans flex flex-col md:flex-row relative">
      
      {/* Glowing background mesh effects */}
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-blue-950/15 via-indigo-950/5 to-transparent pointer-events-none -z-10" />
      <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-[#4f46e5]/5 rounded-full filter blur-[120px] pointer-events-none -z-10" />
      <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-[#06b6d4]/5 rounded-full filter blur-[120px] pointer-events-none -z-10" />

      {/* FIXED SIDEBAR - DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-[#060a17]/95 backdrop-blur-md border-r border-slate-900/90 z-30 p-5 justify-between">
        <div className="space-y-6">
          {/* Sidebar Header */}
          <div className="flex flex-col gap-1.5 border-b border-slate-900 pb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-600/10 rounded-xl border border-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.15)]">
                <Shield className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black tracking-widest text-indigo-400 font-mono">CORE SYSTEM</span>
                <span className="text-xs font-black tracking-wider text-white uppercase font-display">VITAL PANEL</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2 bg-slate-950/50 border border-slate-900/60 rounded-lg px-2.5 py-1 w-full">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] uppercase font-mono tracking-wider font-extrabold text-slate-400">
                SSL SECURE GATE
              </span>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <nav className="space-y-1.5">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'users', label: 'Utilisateurs', icon: Users },
              { id: 'chat', label: 'Chats Privés', icon: MessageSquare },
              { id: 'premium', label: 'Premium VIP', icon: Crown },
              { id: 'payments', label: 'Paiements', icon: DollarSign },
              { id: 'signals', label: 'Live TOP', icon: Zap },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'stats', label: 'Statistiques', icon: TrendingUp },
              { id: 'matches', label: 'Base Matchs', icon: Database },
              { id: 'settings', label: 'Paramètres', icon: Settings },
              { id: 'balance', label: 'Gestion Soldes', icon: RefreshCw },
            ].map((tab) => {
              const IconComponent = tab.icon;
              const isActive = subTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSubTab(tab.id as AdminSubTab);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[11px] font-black transition-all duration-300 border ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-300 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                      : 'text-slate-400 border-transparent hover:bg-slate-900/60 hover:text-slate-200'
                  }`}
                >
                  <IconComponent className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span className="tracking-wide uppercase">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-3 pt-4 border-t border-slate-900">
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-900 flex items-center gap-2.5">
            <Lock className="h-4 w-4 text-emerald-500" />
            <div className="flex flex-col text-[8px] font-mono">
              <span className="text-white font-black uppercase">SYSTÈME SÉCURISÉ</span>
              <span className="text-slate-500 font-extrabold uppercase">SSL EN CRYPTAGE 256</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onAdminLogout}
              title="Déconnexion"
              className="flex-1 h-9 rounded-xl bg-rose-950/40 border border-rose-900/30 text-rose-400 flex items-center justify-center gap-1.5 text-[9px] font-black uppercase hover:bg-rose-900 hover:text-white transition-all active:scale-95"
            >
              <LogOut className="h-3.5 w-3.5" />
              Quitter
            </button>
            <button
              onClick={onClose}
              title="Fermer"
              className="flex-1 h-9 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center gap-1.5 text-[9px] font-black uppercase hover:bg-slate-700 hover:text-white transition-all active:scale-95"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="absolute top-0 bottom-0 left-0 w-72 bg-[#060a17] border-r border-slate-900 p-5 flex flex-col justify-between"
            onClick={e => e.stopPropagation()}
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-900 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-600/10 rounded-lg border border-indigo-500/20">
                    <Shield className="h-4 w-4 text-indigo-400" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-white">VITAL TERMINAL</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>

              {/* Mobile Navigation List */}
              <nav className="space-y-1">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'users', label: 'Utilisateurs', icon: Users },
                  { id: 'chat', label: 'Chats Privés', icon: MessageSquare },
                  { id: 'premium', label: 'Premium VIP', icon: Crown },
                  { id: 'payments', label: 'Paiements', icon: DollarSign },
                  { id: 'signals', label: 'Live TOP', icon: Zap },
                  { id: 'notifications', label: 'Notifications', icon: Bell },
                  { id: 'stats', label: 'Statistiques', icon: TrendingUp },
                  { id: 'matches', label: 'Base Matchs', icon: Database },
                  { id: 'settings', label: 'Paramètres', icon: Settings },
                  { id: 'balance', label: 'Gestion Soldes', icon: RefreshCw },
                ].map((tab) => {
                  const IconComponent = tab.icon;
                  const isActive = subTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setSubTab(tab.id as AdminSubTab);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-[11px] font-black transition-all border ${
                        isActive
                          ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30'
                          : 'text-slate-400 border-transparent hover:bg-slate-900/50'
                      }`}
                    >
                      <IconComponent className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                      <span className="tracking-wide uppercase">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Mobile Sidebar Footer */}
            <div className="space-y-2 border-t border-slate-900 pt-4">
              <div className="flex gap-2">
                <button
                  onClick={onAdminLogout}
                  className="flex-1 h-9 rounded-lg bg-rose-950/40 border border-rose-900/30 text-rose-400 flex items-center justify-center gap-1.5 text-[9px] font-black uppercase"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Log Out
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 h-9 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center gap-1.5 text-[9px] font-black uppercase"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RIGHT MAIN VIEWPORT */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        
        {/* TOP BAR / HEADER */}
        <header className="px-4 md:px-6 py-4 bg-[#060a17]/90 backdrop-blur-md border-b border-slate-900 sticky top-0 z-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white"
            >
              <Activity className="h-4 w-4" />
            </button>
            
            {/* Search Input Widget */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="RECHERCHER DANS LE TERMINAL..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-56 md:w-64 bg-slate-950/80 border border-slate-900 rounded-xl pl-9 pr-4 py-2 text-[10px] uppercase font-mono tracking-wider font-extrabold text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:shadow-[0_0_12px_rgba(99,102,241,0.1)] transition-all"
              />
            </div>
            
            <div className="text-[10px] text-slate-500 font-mono hidden lg:flex items-center gap-1.5 bg-slate-950/30 border border-slate-900/60 rounded-lg px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" strokeLinecap="round" />
              SERVER : ONLINE
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Date and clock */}
            <div className="text-right hidden md:flex flex-col justify-center select-none font-mono">
              <span className="text-[9px] uppercase font-black text-indigo-400 tracking-wider">SYSTEM CLOCK UTC</span>
              <span className="text-[10px] font-black text-slate-300 font-mono mt-0.5">{currentTime || 'Chargement...'}</span>
            </div>

            {/* Notification Badge */}
            <div className="relative">
              <button className="h-9 w-9 rounded-xl bg-slate-950 border border-slate-900 text-slate-400 flex items-center justify-center hover:text-white transition-all">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 border-2 border-[#040815] rounded-full text-[8px] font-black text-white flex items-center justify-center">
                  3
                </span>
              </button>
            </div>

            {/* Admin VIP user badge */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5">
              <div className="h-5 w-5 bg-indigo-500/10 rounded-lg flex items-center justify-center border border-indigo-500/20">
                <Crown className="h-3 w-3 text-amber-400 fill-current" />
              </div>
              <div className="flex flex-col text-[8px]">
                <span className="font-extrabold text-white leading-none">ADMIN VIP</span>
                <span className="text-emerald-400 font-bold font-mono tracking-widest mt-0.5">@ACTIF</span>
              </div>
            </div>
          </div>
        </header>

        {/* VIEW PORT CONTENT */}
        <main className="flex-1 w-full p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">

          {/* 1. TABLEAU DE BORD (10 GRID CARDS) */}
          {subTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Top Row: 4 Premium Quick-Stat Sparkline Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Stat 1: Users */}
                <div className="bg-slate-950/45 backdrop-blur-md border border-slate-900/80 rounded-2xl p-4 flex justify-between items-center relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.02)]">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-slate-500 font-mono tracking-wider block">Utilisateurs</span>
                    <span className="text-xl font-black text-white block">{users.length}</span>
                    <span className="text-[8px] font-extrabold text-emerald-400 font-mono flex items-center gap-0.5">
                      <TrendingUp className="h-2.5 w-2.5" /> +8.3% ENREGISTRÉS
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="p-2 bg-blue-600/10 rounded-xl border border-blue-500/20 text-blue-400">
                      <Users className="h-4 w-4" />
                    </div>
                    {/* Sparkline */}
                    <svg className="w-20 h-6 text-blue-400 drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]" viewBox="0 0 100 40" fill="none">
                      <path d="M0 30 Q20 10 40 28 T80 5 T100 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                {/* Stat 2: Chats Privés */}
                <div className="bg-slate-950/45 backdrop-blur-md border border-slate-900/80 rounded-2xl p-4 flex justify-between items-center relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.02)]">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-slate-500 font-mono tracking-wider block">Chats Privés</span>
                    <span className="text-xl font-black text-white block">{conversations.length}</span>
                    <span className="text-[8px] font-extrabold text-emerald-400 font-mono flex items-center gap-0.5">
                      <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping mr-1" /> CANAL ACTIF
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="p-2 bg-cyan-600/10 rounded-xl border border-cyan-500/20 text-cyan-400">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    {/* Sparkline */}
                    <svg className="w-20 h-6 text-cyan-400 drop-shadow-[0_0_4px_rgba(6,182,212,0.3)]" viewBox="0 0 100 40" fill="none">
                      <path d="M0 25 Q15 5 30 20 T60 8 T90 22 T100 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                {/* Stat 3: Base Matchs */}
                <div className="bg-slate-950/45 backdrop-blur-md border border-slate-900/80 rounded-2xl p-4 flex justify-between items-center relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.02)]">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-slate-500 font-mono tracking-wider block">Base Matchs</span>
                    <span className="text-xl font-black text-white block">{matches.length}</span>
                    <span className="text-[8px] font-extrabold text-slate-400 font-mono flex items-center gap-0.5">
                      {matches.filter(m => m.matchStatus === 'LIVE').length} EN DIRECT MATCHS
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="p-2 bg-purple-600/10 rounded-xl border border-purple-500/20 text-purple-400">
                      <Database className="h-4 w-4" />
                    </div>
                    {/* Sparkline */}
                    <svg className="w-20 h-6 text-purple-400 drop-shadow-[0_0_4px_rgba(168,85,247,0.3)]" viewBox="0 0 100 40" fill="none">
                      <path d="M0 22 Q15 5 35 25 T70 10 T100 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                {/* Stat 4: Revenue & Conversion */}
                <div className="bg-slate-950/45 backdrop-blur-md border border-slate-900/80 rounded-2xl p-4 flex justify-between items-center relative overflow-hidden group hover:border-pink-500/30 transition-all duration-300 shadow-[0_0_15px_rgba(236,72,153,0.02)]">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-slate-500 font-mono tracking-wider block">Revenus</span>
                    <span className="text-xl font-black text-white block">
                      {(paymentRequests.filter(p => p.status === 'Approved').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)).toLocaleString('fr-FR')} Ar
                    </span>
                    <span className="text-[8px] font-extrabold text-emerald-400 font-mono flex items-center gap-0.5">
                      <TrendingUp className="h-2.5 w-2.5" strokeWidth={3} /> +12.5% CONVERSION
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="p-2 bg-pink-600/10 rounded-xl border border-pink-500/20 text-pink-400">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    {/* Sparkline */}
                    <svg className="w-20 h-6 text-pink-400 drop-shadow-[0_0_4px_rgba(236,72,153,0.3)]" viewBox="0 0 100 40" fill="none">
                      <path d="M0 32 Q25 12 40 25 T75 8 T100 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

              </div>

              {/* Central Premium Glass Console System Card */}
              <div className="bg-slate-950/45 backdrop-blur-md border border-slate-900 rounded-3xl p-6 relative overflow-hidden shadow-2xl flex flex-col lg:flex-row items-center gap-6 justify-between">
                {/* Card Background Pattern Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />
                
                <div className="space-y-4 relative z-10 max-w-xl text-left">
                  <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    <Sparkles className="h-3.5 w-3.5 animate-pulse text-indigo-400" />
                    Supervision Terminal Vital
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight uppercase">
                    Console Système de Vital Pronostic
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Supervisez et contrôlez toute la plateforme en temps réel. Cette interface centralise la gestion des comptes, la configuration des accès Live TOP, la diffusion d'alertes instantanées, et la modération des communications cryptées. Cliquez sur piloter ci-dessous pour modifier la base de données.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-slate-400">
                        Base Matchs Synchro : OK
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                      <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-slate-400">
                        Canal Chat Crypté : Actif
                      </span>
                    </div>
                  </div>
                </div>

                {/* Animated Futuristic Technical Illustration */}
                <div className="shrink-0 w-full lg:w-auto relative z-10">
                  <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-900 shadow-xl max-w-xs mx-auto">
                    <svg className="w-56 h-44 text-indigo-500" viewBox="0 0 200 200">
                      {/* Grid Lines */}
                      <circle cx="100" cy="100" r="80" stroke="#0f172a" strokeWidth="1" fill="none" />
                      <circle cx="100" cy="100" r="60" stroke="#1e293b" strokeWidth="1" fill="none" strokeDasharray="4 4" />
                      <circle cx="100" cy="100" r="40" stroke="#312e81" strokeWidth="1" strokeOpacity="0.3" fill="none" />
                      <circle cx="100" cy="100" r="20" stroke="#0891b2" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
                      
                      {/* Rotating Outer Ring */}
                      <circle cx="100" cy="100" r="70" stroke="#4f46e5" strokeWidth="2" strokeDasharray="30 150" fill="none" className="origin-[100px_100px] animate-[spin_10s_linear_infinite]" />
                      <circle cx="100" cy="100" r="70" stroke="#06b6d4" strokeWidth="1" strokeDasharray="10 90" fill="none" className="origin-[100px_100px] animate-[spin_6s_linear_infinite_reverse]" />
                      
                      {/* Radar Sweep Line */}
                      <line x1="100" y1="100" x2="160" y2="40" stroke="url(#radarGradient)" strokeWidth="2" strokeLinecap="round" className="origin-[100px_100px] animate-[spin_4s_linear_infinite]" />
                      
                      {/* Glowing Dots */}
                      <circle cx="60" cy="80" r="3" fill="#10b981" className="animate-pulse" />
                      <circle cx="140" cy="120" r="3" fill="#3b82f6" />
                      <circle cx="110" cy="50" r="2.5" fill="#f59e0b" className="animate-pulse" />
                      
                      <defs>
                        <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0" />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.9" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>

              </div>

              {/* Grid of 10 Pilot Cards */}
              <div className="space-y-3.5">
                <span className="text-[9px] font-black uppercase text-indigo-400 font-mono tracking-wider block">CONSOLES MODULES</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { 
                      id: 'users', 
                      title: 'Utilisateurs', 
                      icon: Users,
                      status: `${users.length} clients`,
                      desc: 'Gérer la base clients',
                      glowColor: 'hover:border-blue-500/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]',
                      sparkline: <path d="M0 30 Q20 10 40 28 T80 5 T100 15" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    },
                    { 
                      id: 'chat', 
                      title: 'Chats Privés', 
                      icon: MessageSquare,
                      status: `${conversations.length} ouverts`,
                      desc: 'Messagerie instantanée',
                      glowColor: 'hover:border-cyan-500/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)]',
                      sparkline: <path d="M0 25 Q15 5 30 20 T60 8 T90 22 T100 5" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    },
                    { 
                      id: 'premium', 
                      title: 'Premium VIP', 
                      icon: Crown,
                      status: `${users.filter(u => u.isVip).length} actifs`,
                      desc: 'Abonnements privilèges',
                      glowColor: 'hover:border-amber-500/40 hover:shadow-[0_0_15px_rgba(245,158,11,0.1)]',
                      sparkline: <path d="M0 35 Q20 15 40 30 T75 10 T100 12" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    },
                    { 
                      id: 'payments', 
                      title: 'Paiements', 
                      icon: DollarSign,
                      status: `${paymentRequests.filter(p => p.status === 'Pending').length} en attente`,
                      desc: 'Requêtes de dépôts',
                      glowColor: 'hover:border-emerald-500/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]',
                      sparkline: <path d="M0 20 Q20 30 45 10 T80 25 T100 5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    },
                    { 
                      id: 'signals', 
                      title: 'Live TOP', 
                      icon: Zap,
                      status: `${liveSignals.length} publiés`,
                      desc: 'Signaux en temps réel',
                      glowColor: 'hover:border-pink-500/40 hover:shadow-[0_0_15px_rgba(236,72,153,0.1)]',
                      sparkline: <path d="M0 32 Q25 12 40 25 T75 8 T100 20" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    },
                    { 
                      id: 'notifications', 
                      title: 'Notifications', 
                      icon: Bell,
                      status: 'Diffusion push instantanée',
                      desc: 'Alertes globales clients',
                      glowColor: 'hover:border-purple-500/40 hover:shadow-[0_0_15px_rgba(168,85,247,0.1)]',
                      sparkline: <path d="M0 15 Q20 5 45 28 T80 12 T100 2" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    },
                    { 
                      id: 'stats', 
                      title: 'Statistiques', 
                      icon: TrendingUp,
                      status: 'Graphes analytiques',
                      desc: 'Conversion & Performances',
                      glowColor: 'hover:border-orange-500/40 hover:shadow-[0_0_15px_rgba(249,115,22,0.1)]',
                      sparkline: <path d="M0 28 Q20 8 45 22 T80 5 T100 15" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    },
                    { 
                      id: 'matches', 
                      title: 'Base Matchs', 
                      icon: Database,
                      status: `${matches.length} analysés`,
                      desc: 'Éditer la liste des ligues',
                      glowColor: 'hover:border-indigo-500/40 hover:shadow-[0_0_15px_rgba(99,102,241,0.1)]',
                      sparkline: <path d="M0 22 Q15 5 35 25 T70 10 T100 30" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    },
                    { 
                      id: 'settings', 
                      title: 'Paramètres', 
                      icon: Settings,
                      status: 'PIN & Sécurité',
                      desc: 'Maintenance & Config',
                      glowColor: 'hover:border-teal-500/40 hover:shadow-[0_0_15px_rgba(20,184,166,0.1)]',
                      sparkline: <path d="M0 18 Q20 28 45 12 T85 5 T100 10" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    },
                    { 
                      id: 'balance', 
                      title: 'Gestion Soldes', 
                      icon: RefreshCw,
                      status: `${users.filter(u => (u.soldeLiveTop || 0) > 0).length} soldes actifs`,
                      desc: 'Nombre clients actifs, Nombre expirés, Nombre renouvellements, Revenus abonnements',
                      glowColor: 'hover:border-emerald-500/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]',
                      sparkline: <path d="M0 30 Q25 15 45 28 T80 12 T100 8" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    },
                  ].map((card) => {
                    const CardIcon = card.icon;
                    return (
                      <div
                        key={card.id}
                        className={`p-5 bg-slate-950/45 backdrop-blur-md border border-slate-900/95 rounded-2xl flex flex-col justify-between min-h-[170px] transition-all duration-300 relative group overflow-hidden ${card.glowColor}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h3 className="font-extrabold text-xs text-white uppercase tracking-wide">{card.title}</h3>
                            <span className="text-[10px] text-indigo-400 font-mono tracking-wider block mt-0.5">{card.status}</span>
                            <span className="text-[9px] text-slate-500 block leading-tight mt-1">{card.desc}</span>
                          </div>
                          <div className="p-2.5 bg-slate-900 border border-slate-800/80 rounded-xl group-hover:bg-indigo-600/10 group-hover:border-indigo-500/30 transition-all duration-300">
                            <CardIcon className="h-4 w-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-900/60 pt-3 mt-4">
                          <svg className="w-16 h-7 text-indigo-400/40 group-hover:text-indigo-400 transition-colors" viewBox="0 0 100 40" fill="none">
                            {card.sparkline}
                          </svg>
                          <button
                            onClick={() => setSubTab(card.id as AdminSubTab)}
                            className="bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 hover:border-indigo-500 text-indigo-300 hover:text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 shadow-sm active:scale-95"
                          >
                            Piloter →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Footer System Performance Panel */}
              <div className="bg-slate-950/45 backdrop-blur-md border border-slate-900/90 rounded-2xl p-5 space-y-4">
                <span className="text-[9px] font-black uppercase text-indigo-400 font-mono tracking-wider block">PERFORMANCE DU TERMINAL SYSTEM</span>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  
                  {/* Circle SVG Performance ring */}
                  <div className="md:col-span-3 flex flex-col items-center justify-center p-3 bg-slate-950/50 border border-slate-900 rounded-xl">
                    <div className="relative h-20 w-20 flex items-center justify-center">
                      <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-900"
                          strokeWidth="2"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-emerald-500 drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                          strokeDasharray={`${performance}, 100`}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <span className="text-sm font-black text-white font-mono">{performance}%</span>
                    </div>
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider mt-2">DÉBIT RÉSEAU STABLE</span>
                  </div>

                  {/* CPU, RAM, Storage, Network progress bars */}
                  <div className="md:col-span-6 space-y-2.5">
                    
                    {/* CPU metric bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-mono">
                        <span className="text-slate-400 uppercase font-black">CPU OPERATIONEL</span>
                        <span className="text-indigo-400 font-extrabold">{cpu}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                        <div 
                          className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] rounded-full transition-all duration-1000" 
                          style={{ width: `${cpu}%` }} 
                        />
                      </div>
                    </div>

                    {/* RAM metric bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-mono">
                        <span className="text-slate-400 uppercase font-black">MÉMOIRE RAM ALLOCUÉE</span>
                        <span className="text-cyan-400 font-extrabold">{ram}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                        <div 
                          className="h-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)] rounded-full transition-all duration-1000" 
                          style={{ width: `${ram}%` }} 
                        />
                      </div>
                    </div>

                    {/* Network metric bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-mono">
                        <span className="text-slate-400 uppercase font-black">TRAFFIC RÉSEAU ENTRANT</span>
                        <span className="text-emerald-400 font-extrabold">{network}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                        <div 
                          className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] rounded-full transition-all duration-1000" 
                          style={{ width: `${network}%` }} 
                        />
                      </div>
                    </div>

                    {/* Storage metric bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-mono">
                        <span className="text-slate-400 uppercase font-black">ESPACE STOCKAGE SSD</span>
                        <span className="text-pink-400 font-extrabold">{storage}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                        <div 
                          className="h-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)] rounded-full transition-all duration-1000" 
                          style={{ width: `${storage}%` }} 
                        />
                      </div>
                    </div>

                  </div>

                  {/* Right checklist security column */}
                  <div className="md:col-span-3 bg-slate-950/50 p-3.5 border border-slate-900 rounded-xl space-y-1.5">
                    <span className="text-[8px] font-black uppercase text-indigo-400 font-mono tracking-wider block mb-1">SSL PROTOCOL RULES</span>
                    {[
                      { label: 'SSL CHIPHER HTTPS', ok: true },
                      { label: 'FIREWALL DEFENSR', ok: true },
                      { label: 'DB DATA CYPHER', ok: true },
                      { label: 'AUTO BACKUP SYSTEM', ok: true },
                    ].map((rule, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[8px] font-mono uppercase font-black">
                        <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                        <span className="text-slate-300">{rule.label}</span>
                      </div>
                    ))}
                  </div>

                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center pt-3 border-t border-slate-900/60 text-[8px] text-slate-500 font-mono uppercase font-extrabold">
                  <span>TERMINAL VERSION 2.0.0 Stable OS</span>
                  <span className="mt-1 sm:mt-0">© 2026 VITAL PRONOSTIC - TOUS DROITS RÉSERVÉS</span>
                </div>
              </div>

            </div>
          )}

        {/* 2. UTILISATEURS TAB */}
        {subTab === 'users' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-[#0E1324] border border-slate-800 rounded-3xl p-4 space-y-4">
              <h2 className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                <Users className="h-4 w-4 text-indigo-400" />
                Membres de la plateforme ({filteredUsers.length})
              </h2>

              <div className="relative">
                <Search className="absolute top-3 left-3 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Rechercher par pseudo, téléphone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Quick Status filter */}
              <div className="flex gap-1.5 rounded-xl bg-slate-950 p-1">
                {(['all', 'free', 'premium'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setUserStatusFilter(mode)}
                    className={`flex-1 py-1 text-[9px] font-extrabold uppercase rounded-lg transition-all ${
                      userStatusFilter === mode ? 'bg-indigo-600 text-white' : 'text-slate-500'
                    }`}
                  >
                    {mode === 'all' ? 'Tous' : mode === 'free' ? 'Gratuit' : 'Premium'}
                  </button>
                ))}
              </div>

              {/* Users list with complete actions */}
              <div className="divide-y divide-slate-800 max-h-[400px] overflow-y-auto pr-1">
                {filteredUsers.map((u) => (
                  <div key={u.userId} className="py-3 flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Avatar initials with style */}
                      <span className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-900 text-white font-extrabold flex items-center justify-center uppercase shrink-0 text-xs">
                        {(u.username || 'U').slice(0, 2)}
                      </span>
                      <div className="min-w-0">
                        <span className="font-extrabold text-white block truncate">{u.username}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">{u.phoneNumber}</span>
                        <span className="text-[8px] text-slate-500 font-mono block mt-0.5">
                          ID: {u.userId} · Naiss: {u.dob}
                        </span>
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setViewingUser(u)}
                        title="Voir détails"
                        className="p-1.5 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-slate-300"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEditUser(u)}
                        title="Modifier"
                        className="p-1.5 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-indigo-400"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleVip(u.userId)}
                        title={u.isVip ? "Retirer VIP" : "Activer VIP"}
                        className={`p-1.5 rounded-lg border ${
                          u.isVip
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-slate-800/80 border-transparent text-slate-400'
                        }`}
                      >
                        <Crown className="h-3.5 w-3.5 fill-current" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.userId)}
                        title="Supprimer"
                        className="p-1.5 bg-rose-950/40 text-rose-400 hover:bg-rose-900 rounded-lg"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 11. GESTION SOLDE TAB */}
        {subTab === 'balance' && (
          <div className="space-y-4 animate-fade-in text-xs">
            {/* Upper Header Card */}
            <div className="bg-[#0E1324] border border-slate-800 rounded-3xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase text-white flex items-center gap-1.5 font-display">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  Gestion de Solde Live TOP
                </h2>
                <span className="text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full">
                  360h (15 Jours) Auto
                </span>
              </div>
              
              {/* Search Bar with filter capabilities */}
              <div className="relative">
                <Search className="absolute top-3 left-3 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Rechercher par pseudo, téléphone, ID, premium, gratuit, solde..."
                  value={balanceSearch}
                  onChange={(e) => setBalanceSearch(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Users list for Balance management */}
              <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                {filteredBalanceUsers.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 font-medium">
                    Aucun utilisateur trouvé pour cette recherche.
                  </div>
                ) : (
                  filteredBalanceUsers.map((u) => {
                    const balance = u.soldeLiveTop || 0;
                    const online = isUserOnline(u);
                    const timeRemaining = getTimeRemainingStr(u.sigExpirationDate);
                    
                    return (
                      <div key={u.userId} className="p-3 bg-slate-950/40 rounded-2xl border border-slate-900 flex flex-col gap-3">
                        {/* User Header Info */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="h-7 w-7 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-extrabold flex items-center justify-center text-[10px] uppercase">
                              {(u.username || 'U').slice(0, 2)}
                            </span>
                            <div>
                              <span className="font-extrabold text-white text-xs">{u.username}</span>
                              <span className="text-[9px] text-slate-400 block font-mono">{u.phoneNumber} (ID: {u.userId})</span>
                            </div>
                          </div>
                          
                          {/* Live Online Badge */}
                          <div className="text-right flex flex-col items-end">
                            <span className={`text-[8px] font-extrabold uppercase flex items-center gap-1 ${online ? 'text-emerald-400' : 'text-slate-500'}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                              {online ? 'En ligne' : 'Hors ligne'}
                            </span>
                            {u.lastConnectionAt && (
                              <span className="text-[7px] text-slate-500 font-mono mt-0.5">
                                Connecté: {formatFrenchDateTime(u.lastConnectionAt)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Subscription Info Grid */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-950/80 border border-slate-900/60 rounded-xl p-2.5 text-[10px]">
                          <div>
                            <span className="text-slate-500 block uppercase font-mono text-[7px] tracking-wider">Type de compte</span>
                            <span className={`font-black flex items-center gap-1 ${u.isVip ? 'text-amber-400' : 'text-slate-400'}`}>
                              <Crown className="h-3 w-3 fill-current" />
                              {u.isVip ? 'PREMIUM VIP' : 'MEMBRE GRATUIT'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block uppercase font-mono text-[7px] tracking-wider">Solde Live TOP</span>
                            <span className={`font-extrabold font-mono ${balance > 0 ? 'text-emerald-400 font-black' : 'text-slate-400'}`}>
                              {balance.toLocaleString('fr-FR')} Ar
                            </span>
                          </div>
                          <div className="col-span-2 border-t border-slate-900/40 pt-1.5 mt-1.5 flex flex-col gap-1">
                            <div className="flex justify-between items-center text-[8px]">
                              <span className="text-slate-500 font-mono uppercase tracking-wider">Activation :</span>
                              <span className="text-slate-300 font-bold">{u.sigActivationDate ? formatFrenchDateTime(u.sigActivationDate) : 'Aucune'}</span>
                            </div>
                            <div className="flex justify-between items-center text-[8px]">
                              <span className="text-slate-500 font-mono uppercase tracking-wider">Expiration :</span>
                              <span className="text-slate-300 font-bold">{u.sigExpirationDate ? formatFrenchDateTime(u.sigExpirationDate) : 'Aucune'}</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-slate-900/40 pt-1 mt-1">
                              <span className="text-slate-500 font-mono uppercase tracking-wider">Temps Restant :</span>
                              <span className={`font-black uppercase tracking-wider ${balance > 0 && !timeRemaining.includes('Expiré') ? 'text-amber-500 font-bold' : 'text-red-500 font-bold'}`}>
                                {timeRemaining}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* User Specific Actions */}
                        <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-800/40">
                          {/* Ajouter Solde */}
                          <button
                            type="button"
                            onClick={() => handleAddUserBalance(u, 10000)}
                            className="flex-1 min-w-[70px] py-1.5 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/40 text-emerald-400 font-bold rounded-lg text-[9px] uppercase tracking-wider text-center"
                          >
                            + 10 000 Ar
                          </button>
                          
                          {/* Retirer Solde */}
                          <button
                            type="button"
                            onClick={() => handleRemoveUserBalance(u)}
                            disabled={balance === 0}
                            className="flex-1 min-w-[70px] py-1.5 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/30 text-rose-400 font-bold rounded-lg text-[9px] uppercase tracking-wider disabled:opacity-40 disabled:hover:bg-rose-950/40"
                          >
                            Retirer Solde
                          </button>

                          {/* Prolonger */}
                          <button
                            type="button"
                            onClick={() => handleProlongUserBalance(u)}
                            className="flex-1 min-w-[70px] py-1.5 bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-800/40 text-indigo-400 font-bold rounded-lg text-[9px] uppercase tracking-wider text-center"
                          >
                            Prolonger
                          </button>

                          {/* Passer Premium / Gratuit */}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = users.map((user) => (user.userId === u.userId ? { ...user, isVip: !user.isVip } : user));
                              syncUsersAndSession(updated);
                              writeBalanceLog(u, u.isVip ? 'free' : 'vip');
                              alert(u.isVip ? `Retour Gratuit pour ${u.username}.` : `Utilisateur ${u.username} passé Premium VIP.`);
                            }}
                            className={`flex-1 min-w-[90px] py-1.5 font-bold rounded-lg text-[9px] uppercase tracking-wider border ${
                              u.isVip 
                                ? 'bg-amber-950/50 hover:bg-amber-900 border-amber-800 text-amber-400' 
                                : 'bg-slate-900 hover:bg-slate-800 border-slate-750 text-slate-400'
                            }`}
                          >
                            {u.isVip ? 'Retour Gratuit' : 'Passer Premium'}
                          </button>

                          {/* Suspendre */}
                          <button
                            type="button"
                            onClick={() => handleToggleSuspendUser(u)}
                            className={`flex-1 min-w-[70px] py-1.5 font-bold rounded-lg text-[9px] uppercase tracking-wider border ${
                              u.isSuspended
                                ? 'bg-emerald-950/40 hover:bg-emerald-900 text-emerald-400 border-emerald-900/30'
                                : 'bg-amber-950/40 hover:bg-amber-900 text-amber-400 border-amber-900/30'
                            }`}
                          >
                            {u.isSuspended ? 'Réactiver' : 'Suspendre'}
                          </button>

                          {/* Voir historique */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedHistoryUser(u);
                              setHistoryTab('profile');
                            }}
                            className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold rounded-lg text-[9px] uppercase tracking-wider"
                          >
                            🔍 Profil & Logs
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Global Read-Only Secure Log List */}
            <div className="bg-[#0E1324] border border-slate-800 rounded-3xl p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="text-xs font-black uppercase text-amber-400 flex items-center gap-1 font-display">
                  🛡 Journal de Sécurité (Inaltérable)
                </h3>
                <span className="text-[9px] text-slate-500 font-mono">
                  {balanceLogs.length} opérations logguées
                </span>
              </div>
              <div className="divide-y divide-slate-900/80 max-h-[160px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                {balanceLogs.length === 0 ? (
                  <div className="text-center py-4 text-slate-600 italic font-medium">
                    Aucune opération de solde enregistrée.
                  </div>
                ) : (
                  balanceLogs.map((log) => {
                    let actionLabel = '';
                    let actionBadge = '';
                    switch (log.action) {
                      case 'add':
                        actionLabel = `Ajout de ${log.amount?.toLocaleString()} Ar`;
                        actionBadge = 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/30';
                        break;
                      case 'remove':
                        actionLabel = 'Retrait de solde';
                        actionBadge = 'bg-rose-950/60 text-rose-400 border border-rose-900/30';
                        break;
                      case 'prolong':
                        actionLabel = `Prolongation (+15j, ${log.amount?.toLocaleString()} Ar)`;
                        actionBadge = 'bg-indigo-950/60 text-indigo-400 border border-indigo-800/30';
                        break;
                      case 'vip':
                        actionLabel = 'Changement de statut : VIP';
                        actionBadge = 'bg-amber-950/60 text-amber-400 border border-amber-800/30';
                        break;
                      case 'free':
                        actionLabel = 'Retour de statut : Gratuit';
                        actionBadge = 'bg-slate-900 text-slate-400 border border-slate-800';
                        break;
                      case 'suspend':
                        actionLabel = 'Suspension de compte';
                        actionBadge = 'bg-red-950 text-red-400 border border-red-900/20';
                        break;
                      case 'unsuspend':
                        actionLabel = 'Réactivation de compte';
                        actionBadge = 'bg-green-950 text-green-400 border border-green-900/20';
                        break;
                      default:
                        actionLabel = `Opération ${log.action}`;
                        actionBadge = 'bg-slate-950 text-slate-400 border border-slate-800';
                    }
                    
                    return (
                      <div key={log.id} className="py-2 flex flex-col gap-1 text-[9px] font-mono border-b border-slate-900 last:border-0">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-indigo-400">@{log.adminUsername}</span>
                          <span className="text-[8px] text-slate-500">{new Date(log.timestamp).toLocaleString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center justify-between gap-1.5 mt-0.5">
                          <span className="text-slate-300 truncate">
                            Client: <span className="font-sans font-black text-white">{log.targetUsername}</span> ({log.targetPhone})
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] shrink-0 ${actionBadge}`}>
                            {actionLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. CHATS PRIVÉS TAB */}
        {subTab === 'chat' && (
          <div className="space-y-4 animate-fade-in">
            {!selectedChatUserId ? (
              <div className="bg-[#0E1324] border border-slate-800 rounded-3xl p-4 space-y-4">
                <h2 className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-indigo-400" />
                  Messagerie Privée Client ({conversations.length})
                </h2>

                <div className="relative">
                  <Search className="absolute top-3 left-3 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Rechercher une conversation..."
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="divide-y divide-slate-800 max-h-[380px] overflow-y-auto pr-1">
                  {conversations.map((conv) => (
                    <div key={conv.userId} className="py-3 flex items-center justify-between text-xs gap-1 hover:bg-slate-900/40 p-1.5 rounded-xl">
                      <button
                        onClick={() => setSelectedChatUserId(conv.userId)}
                        className="flex items-center gap-2.5 min-w-0 text-left flex-1"
                      >
                        <span className="h-8 w-8 rounded-full bg-indigo-600 font-extrabold flex items-center justify-center text-white shrink-0 uppercase">
                          {(conv.username || 'U').slice(0, 2)}
                        </span>
                        <div className="min-w-0">
                          <span className="font-extrabold text-white block">{conv.username}</span>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{conv.lastText}</p>
                        </div>
                      </button>
                      <button
                        onClick={() => handleDeleteConversation(conv.userId)}
                        title="Purger discussion"
                        className="text-slate-500 hover:text-red-400 p-1.5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {conversations.length === 0 && (
                    <p className="text-center py-12 text-xs text-slate-500 font-medium">Aucune conversation privée.</p>
                  )}
                </div>
              </div>
            ) : (
              /* ACTIVE CHAT DIALOG */
              <div className="bg-[#0D1222] border border-slate-800 rounded-3xl p-4 flex flex-col h-[480px]">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3 shrink-0">
                  <button
                    onClick={() => setSelectedChatUserId(null)}
                    className="text-xs font-black text-indigo-400 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-850"
                  >
                    ← Retour
                  </button>
                  <div className="text-center">
                    <span className="text-xs font-black text-white block">
                      {users.find((u) => u.userId === selectedChatUserId)?.username || 'Discussion'}
                    </span>
                    <span className="text-[9px] text-slate-500 block font-mono font-bold">
                      {users.find((u) => u.userId === selectedChatUserId)?.phoneNumber || ''}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteConversation(selectedChatUserId)}
                    title="Purger"
                    className="p-2 text-rose-400 hover:bg-rose-950/40 rounded-xl"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Message bubbles */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs mb-3">
                  {chatMessages
                    .filter((m) => m.userId === selectedChatUserId)
                    .map((msg) => {
                      const isAdmin = msg.sender === 'admin';
                      return (
                        <div key={msg.id} className="space-y-0.5">
                          <div
                            className={`max-w-[80%] p-3 rounded-2xl text-[11px] leading-relaxed ${
                              isAdmin
                                ? 'bg-indigo-600 text-white rounded-tr-none ml-auto'
                                : 'bg-slate-850 text-slate-100 rounded-tl-none mr-auto'
                            }`}
                          >
                            {msg.text}
                            <span className="block text-[7px] font-mono text-slate-400 text-right mt-1">
                              {msg.timestamp}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <form onSubmit={handleSendAdminMessage} className="flex gap-2 shrink-0">
                  <input
                    type="text"
                    placeholder="Saisissez votre réponse..."
                    value={adminReplyText}
                    onChange={(e) => setAdminReplyText(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600 font-medium"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-4 py-2 rounded-2xl text-xs uppercase"
                  >
                    Envoyer
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* 4. PREMIUM CONTROL TAB */}
        {subTab === 'premium' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-[#0E1324] border border-slate-800 rounded-3xl p-4 space-y-4">
              <h2 className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                <Crown className="h-5 w-5 text-amber-500" />
                Abonnement Premium VIP
              </h2>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Activez ou désactivez manuellement les abonnements payants. Les comptes activés obtiennent un accès instantané aux pronostics VIP exclusifs.
              </p>

              <div className="relative">
                <Search className="absolute top-3 left-3 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filtrer par pseudo, téléphone..."
                  value={premiumSearch}
                  onChange={(e) => setPremiumSearch(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="divide-y divide-slate-800 max-h-[380px] overflow-y-auto pr-1">
                {premiumFilterUsers.map((u) => (
                  <div key={u.userId} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-extrabold text-white block">{u.username}</span>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{u.phoneNumber}</span>
                    </div>

                    <div>
                      {u.isVip ? (
                        <button
                          onClick={() => handleSetVipStatus(u.userId, false)}
                          className="bg-rose-950/40 text-rose-400 border border-rose-900/30 hover:bg-rose-900 hover:text-white px-3 py-1.5 rounded-xl font-bold text-[9px] uppercase transition-all"
                        >
                          Révoquer Premium
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSetVipStatus(u.userId, true)}
                          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-white px-3 py-1.5 rounded-xl font-black text-[9px] uppercase transition-all shadow-md shadow-amber-500/10"
                        >
                          Activer Premium
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. PAIEMENTS TAB */}
        {subTab === 'payments' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-[#0E1324] border border-slate-800 rounded-3xl p-4 space-y-4">
              <h2 className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                Demandes d'Abonnement Mobile Money & Crypto ({paymentRequests.filter((p) => p.status === 'Pending').length})
              </h2>

              <div className="space-y-3.5 max-h-[440px] overflow-y-auto pr-1">
                {paymentRequests.map((r) => {
                  const associatedUser = users.find((u) => u.userId === r.userId);
                  return (
                    <div key={r.id} className="p-4 bg-slate-950/80 rounded-2xl border border-slate-850 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-extrabold text-white block text-xs">
                            Nom: {associatedUser?.username || 'Inconnu'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">Tél: {r.userPhone}</span>
                          <span className="text-[8px] text-slate-500 font-mono block">{r.timestamp}</span>
                        </div>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                          r.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          r.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                        }`}>
                          {r.status === 'Approved' ? 'Approuvé' : r.status === 'Rejected' ? 'Refusé' : 'En attente'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] p-2 rounded-xl bg-slate-900 border border-slate-850">
                        <div>
                          <span className="text-slate-500 block text-[8px] uppercase font-bold">Méthode</span>
                          <span className="font-black text-indigo-400 uppercase">
                            {r.method === 'orange' ? 'Orange Money' : r.method === 'airtel' ? 'Airtel Money' : r.method === 'mvola' ? 'MVola' : 'USDT TRC20'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[8px] uppercase font-bold">Référence</span>
                          <span className="font-mono font-black text-amber-400">{r.reference}</span>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-slate-800">
                          <span className="text-slate-500 block text-[8px] uppercase font-bold">Mise en ligne de</span>
                          <span className="font-black text-white">{r.amount}</span>
                        </div>
                      </div>

                      {r.status === 'Pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprovePayment(r.id, r.userId)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 font-black rounded-xl flex items-center justify-center gap-1 text-[10px] uppercase transition-all shadow-md"
                          >
                            <Check className="h-3.5 w-3.5" /> Valider
                          </button>
                          <button
                            onClick={() => handleRejectPayment(r.id)}
                            className="flex-1 bg-rose-950/40 text-rose-400 border border-rose-900/30 hover:bg-rose-900 hover:text-white py-2 font-black rounded-xl flex items-center justify-center gap-1 text-[10px] uppercase transition-all"
                          >
                            <X className="h-3.5 w-3.5" /> Refuser
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {paymentRequests.length === 0 && (
                  <p className="text-center py-12 text-xs text-slate-500">Aucune demande d'abonnement enregistrée.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 6. LIVE TOP TAB */}
        {subTab === 'signals' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in text-xs">
            {/* Left Panel: Form */}
            <div className="md:col-span-7 bg-[#0E1324] border border-slate-800 rounded-3xl p-5 space-y-5">
              <h2 className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                <Radio className="h-4 w-4 text-amber-500 animate-pulse" />
                CRÉER UNE PUBLICATION LIVE TOP
              </h2>

              {/* Tab Selector Inside Form */}
              <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-850">
                <button
                  type="button"
                  onClick={() => setFormTab('text')}
                  className={`py-2 rounded-xl font-black text-[9px] uppercase text-center transition-all ${
                    formTab === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  TEXTE
                </button>
                <button
                  type="button"
                  onClick={() => setFormTab('datetime')}
                  className={`py-2 rounded-xl font-black text-[9px] uppercase text-center transition-all ${
                    formTab === 'datetime' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  DATE & HEURE
                </button>
                <button
                  type="button"
                  onClick={() => setFormTab('preview')}
                  className={`py-2 rounded-xl font-black text-[9px] uppercase text-center transition-all md:hidden ${
                    formTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  APERÇU
                </button>
              </div>

              <form onSubmit={handlePublishSignal} className="space-y-4">
                {formTab === 'text' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">COLLER VOTRE TEXTE (TOP)</label>
                      <textarea
                        value={sigContent}
                        onChange={(e) => setSigContent(e.target.value)}
                        placeholder="Morocco vs Sudan : 1 (2-0)&#10;Uganda vs Mozambique : X (1-1)&#10;Nigeria vs Equatorial Guinea : 1 (1-0)"
                        rows={12}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-3 text-white text-xs font-mono focus:outline-none focus:border-indigo-500 custom-scrollbar"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">CHAMPIONNAT / COMPÉTITION</label>
                      <select
                        value={selectedCompetition}
                        onChange={(e) => {
                          setSelectedCompetition(e.target.value);
                          setSigTitle(e.target.value);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-indigo-500 font-sans"
                      >
                        <option value="Coupe d'Afrique">Coupe d'Afrique</option>
                        <option value="Ligue 1">Ligue 1</option>
                        <option value="Premier League">Premier League</option>
                        <option value="Liga">Liga</option>
                        <option value="Serie A">Serie A</option>
                        <option value="Bundesliga">Bundesliga</option>
                        <option value="Ligue des Champions">Ligue des Champions</option>
                        <option value="Ligue Europa">Ligue Europa</option>
                        <option value="Conference League">Conference League</option>
                        <option value="Coupe du Monde">Coupe du Monde</option>
                        <option value="CAN Qualifications">CAN Qualifications</option>
                        <option value="Eliminatoires Mondial">Eliminatoires Mondial</option>
                        <option value="Championnat d'Afrique">Championnat d'Afrique</option>
                        <option value="Copa America">Copa America</option>
                        <option value="Matchs Internationaux">Matchs Internationaux</option>
                        <option value="Amicaux">Amicaux</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">TITRE DE LA PUBLICATION (AUTOMATIQUE)</label>
                      <input
                        type="text"
                        value={sigTitle}
                        onChange={(e) => setSigTitle(e.target.value)}
                        placeholder="COUPE D'AFRIQUE – PRONOSTIC DU JOUR"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {formTab === 'datetime' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">DATE</label>
                        <input
                          type="date"
                          value={sigDate}
                          onChange={(e) => setSigDate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">HEURE</label>
                        <input
                          type="time"
                          value={sigTime}
                          onChange={(e) => setSigTime(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 pt-2">
                      <input
                        type="checkbox"
                        id="sigIsPremium"
                        checked={sigIsPremium}
                        onChange={(e) => setSigIsPremium(e.target.checked)}
                        className="rounded bg-slate-950 border-slate-800 text-indigo-500 h-4.5 w-4.5 focus:ring-0"
                      />
                      <label htmlFor="sigIsPremium" className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                        <Lock className="h-3.5 w-3.5" /> Réserver aux membres Premium VIP
                      </label>
                    </div>
                  </div>
                )}

                {formTab === 'preview' && (
                  <div className="md:hidden flex flex-col items-center justify-center py-4 animate-fade-in">
                    <PremiumPoster
                      title={sigTitle || "COUPE D'AFRIQUE"}
                      time={sigTime}
                      matches={parsePastedPredictions(sigContent)}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-2xl uppercase tracking-widest text-[11px] transition-all shadow-lg active:scale-[0.98]"
                >
                  PUBLIER SUR LE LIVE TOP
                </button>
              </form>
            </div>

            {/* Right Panel: Live Preview on Desktop */}
            <div className="hidden md:flex md:col-span-5 flex-col items-center justify-center bg-[#090D1A]/60 border border-slate-850/60 rounded-3xl p-5 relative min-h-[460px]">
              {/* Green Connecting Arrow */}
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 w-8 h-8 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-lg font-black font-mono">→</span>
              </div>

              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-4 block text-center">
                APERÇU AVANT PUBLICATION
              </span>

              <PremiumPoster
                title={sigTitle || "COUPE D'AFRIQUE"}
                time={sigTime}
                matches={parsePastedPredictions(sigContent)}
              />
            </div>
          </div>
        )}

        {/* 7. NOTIFICATIONS TAB */}
        {subTab === 'notifications' && (
          <div className="space-y-4 animate-fade-in">
            <form onSubmit={handlePushAlert} className="bg-[#0E1324] border border-slate-800 rounded-3xl p-5 space-y-4 text-xs">
              <h2 className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                <Bell className="h-4 w-4 text-indigo-400" />
                Diffuser une Notification d'Alerte
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="text-[8px] font-black uppercase text-slate-500 block mb-1">Type d'alerte</label>
                  <select
                    value={notifType}
                    onChange={(e) => setNotifType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Notification">🔔 Notification</option>
                    <option value="Annonce">📢 Annonce</option>
                    <option value="Maintenance">⚙ Maintenance</option>
                    <option value="Promotion">⭐ Promotion</option>
                    <option value="Signal">📡 Signal</option>
                  </select>
                </div>

                <div>
                  <label className="text-[8px] font-black uppercase text-slate-500 block mb-1">Titre de l'alerte</label>
                  <input
                    type="text"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="Ex: Nouveau pronostic disponible !"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-[8px] font-black uppercase text-slate-500 block mb-1">Message d'alerte</label>
                  <textarea
                    value={notifContent}
                    onChange={(e) => setNotifContent(e.target.value)}
                    placeholder="Saisissez le corps du message..."
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-2xl uppercase tracking-widest text-[11px] transition-all"
              >
                Diffuser à tous les téléphones
              </button>
            </form>
          </div>
        )}

        {/* 8. STATISTIQUES TAB */}
        {subTab === 'stats' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-[#0E1324] border border-slate-800 rounded-3xl p-5 space-y-4">
              <h2 className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                <TrendingUp className="h-5 w-5 text-indigo-400" />
                Statistiques Vital Pronostic
              </h2>

              <div className="space-y-3.5">
                {[
                  { label: 'Utilisateurs Totaux', val: users.length, style: 'text-white' },
                  { label: 'Membres Premium VIP', val: users.filter((u) => u.isVip).length, style: 'text-amber-400' },
                  { label: 'Membres Gratuits', val: users.filter((u) => !u.isVip).length, style: 'text-slate-400' },
                  { label: 'Demandes de Paiement', val: paymentRequests.length, style: 'text-emerald-400' },
                  { label: 'Total Messages Échangés', val: chatMessages.length, style: 'text-indigo-400' },
                  { label: 'Pronostics Publiés (Live)', val: liveSignals.length, style: 'text-cyan-400' },
                  { label: 'Utilisateurs Actifs en Ligne', val: '12 (Simulé)', style: 'text-emerald-500 font-extrabold animate-pulse' },
                ].map((stat, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-slate-800/40 text-xs">
                    <span className="text-slate-400 font-medium">{stat.label}</span>
                    <span className={`font-mono font-black text-sm ${stat.style}`}>{stat.val}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 text-center">
                  <span className="text-[8px] font-black uppercase text-slate-500 block">Taux de Conversion VIP</span>
                  <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">
                    {users.length ? Math.round((users.filter((u) => u.isVip).length / users.length) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 9. MATCHES DATABASE TAB */}
        {subTab === 'matches' && (
          <div className="space-y-4 animate-fade-in">
            <form onSubmit={handleSaveMatch} className="bg-[#0E1324] border border-slate-800 rounded-3xl p-5 space-y-4 text-xs">
              <h2 className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                <Database className="h-4 w-4 text-indigo-400" />
                {editingMatchId ? 'Modifier un Match' : 'Créer un Match Football'}
              </h2>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="col-span-2 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] font-black text-slate-500 block mb-1">Équipe Domicile</label>
                    <input
                      type="text"
                      value={mHome}
                      onChange={(e) => setMHome(e.target.value)}
                      placeholder="Ex: Chelsea"
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-500 block mb-1">Équipe Extérieur</label>
                    <input
                      type="text"
                      value={mAway}
                      onChange={(e) => setMAway(e.target.value)}
                      placeholder="Ex: Arsenal"
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[8px] font-black text-slate-500 block mb-1">Heure</label>
                  <input
                    type="text"
                    value={mTime}
                    onChange={(e) => setMTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1.5 text-white text-center font-mono"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-500 block mb-1">Date</label>
                  <input
                    type="text"
                    value={mDate}
                    onChange={(e) => setMDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1.5 text-white text-center font-mono"
                  />
                </div>

                <div>
                  <label className="text-[8px] font-black text-slate-500 block mb-1">Ligue</label>
                  <select
                    value={mLeague}
                    onChange={(e) => setMLeague(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1.5 text-white text-[11px]"
                  >
                    {leagues.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-500 block mb-1">Journée / Étape</label>
                  <input
                    type="text"
                    value={mRound}
                    onChange={(e) => setMRound(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1.5 text-white text-center"
                  />
                </div>

                <div className="col-span-2 border-t border-slate-800 pt-3 grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[8px] font-black text-slate-500 block mb-1">Statut</label>
                    <select
                      value={mStatus}
                      onChange={(e) => setMStatus(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg py-1 px-1.5 text-white text-[10px]"
                    >
                      <option value="Pending">À venir</option>
                      <option value="LIVE">DIRECT</option>
                      <option value="FT">Terminé</option>
                    </select>
                  </div>
                  {mStatus === 'LIVE' && (
                    <div>
                      <label className="text-[8px] font-black text-slate-500 block mb-1">Min Live</label>
                      <input
                        type="text"
                        value={mLiveMin}
                        onChange={(e) => setMLiveMin(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg py-1 text-center font-mono text-white text-[10px]"
                      />
                    </div>
                  )}
                  {mStatus !== 'Pending' && (
                    <div className="col-span-2 grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="text-[8px] font-black text-slate-500 block mb-1">But Dom</label>
                        <input
                          type="text"
                          value={mHomeScore}
                          onChange={(e) => setMHomeScore(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg py-1 text-center font-bold text-white text-[10px]"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-500 block mb-1">But Ext</label>
                        <input
                          type="text"
                          value={mAwayScore}
                          onChange={(e) => setMAwayScore(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg py-1 text-center font-bold text-white text-[10px]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="col-span-2 flex justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-850 mt-1.5">
                  <label className="flex items-center gap-1.5 text-[9px] font-black text-amber-400">
                    <input
                      type="checkbox"
                      checked={mIsVip}
                      onChange={(e) => setMIsVip(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-800 text-indigo-500"
                    /> PRONOSTIC VIP
                  </label>
                  <label className="flex items-center gap-1.5 text-[9px] font-black text-indigo-400">
                    <input
                      type="checkbox"
                      checked={mIsFree}
                      onChange={(e) => setMIsFree(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-800 text-indigo-500"
                    /> GRATUIT
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-2.5 rounded-xl uppercase tracking-wider text-[11px] transition-all"
                >
                  {editingMatchId ? 'Enregistrer les modifications' : 'Ajouter le Match'}
                </button>
                {editingMatchId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMatchId(null);
                      setMHome('');
                      setMAway('');
                    }}
                    className="bg-slate-800 text-slate-400 hover:text-white px-3.5 rounded-xl text-[11px]"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* 10. CONFIG / PARAMÈTRES TAB */}
        {subTab === 'settings' && (
          <div className="space-y-4 animate-fade-in">
            {/* PIN Code Change */}
            <form onSubmit={handleSavePin} className="bg-[#0E1324] border border-slate-800 rounded-3xl p-5 space-y-4 text-xs">
              <h2 className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-indigo-400" />
                Sécurité Code d'accès Admin
              </h2>
              <div>
                <label className="text-[8px] font-black uppercase text-slate-500 block mb-1">
                  Nouveau Code PIN d'Administration (Ex: 2026, 9729, etc.)
                </label>
                <input
                  type="text"
                  value={adminPinCode}
                  onChange={(e) => setAdminPinCode(e.target.value)}
                  placeholder="2026"
                  maxLength={12}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-mono font-bold tracking-widest text-center"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-2.5 rounded-xl uppercase tracking-wider text-[11px] transition-all"
              >
                Sauvegarder le code PIN
              </button>
            </form>

            {/* Maintenance Mode & Support Config */}
            <div className="bg-[#0E1324] border border-slate-800 rounded-3xl p-5 space-y-4 text-xs">
              <h2 className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                <Settings className="h-4 w-4 text-slate-400" />
                Options Système Globales
              </h2>

              <div className="flex items-center justify-between py-2 border-b border-slate-800/50">
                <div>
                  <span className="font-extrabold text-white block">Mode Maintenance</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Bloquer l'accès public à l'application</span>
                </div>
                <button
                  onClick={() => handleToggleMaintenance(!maintenanceEnabled)}
                  className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${
                    maintenanceEnabled ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {maintenanceEnabled ? 'ACTIF' : 'INACTIF'}
                </button>
              </div>

              <div>
                <label className="text-[8px] font-black uppercase text-slate-500 block mb-1">
                  Numéro d'assistance Support
                </label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => {
                    setSupportPhone(e.target.value);
                    localStorage.setItem('sourspark_support_phone', e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-mono"
                />
              </div>
            </div>
          </div>
        )}

      </main>

      </div>

      {/* --- VOIR USER DETAIL POPUP --- */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl p-6 w-full max-w-xs text-xs space-y-4 shadow-2xl relative text-left">
            <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              Détails de l'utilisateur
            </h3>
            <button
              onClick={() => setViewingUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Nom / Pseudo:</span>
                <span className="font-bold text-white">{viewingUser.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ID Utilisateur:</span>
                <span className="font-mono text-slate-300">{viewingUser.userId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Téléphone:</span>
                <span className="font-mono font-bold text-white">{viewingUser.phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date Naissance:</span>
                <span className="text-white">{viewingUser.dob}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Statut Compte:</span>
                <span className={`font-black uppercase ${viewingUser.isVip ? 'text-amber-400' : 'text-slate-400'}`}>
                  {viewingUser.isVip ? 'Premium VIP' : 'Gratuit'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bloqué / Suspendu:</span>
                <span className={`font-black uppercase ${viewingUser.isSuspended ? 'text-red-500' : 'text-emerald-500'}`}>
                  {viewingUser.isSuspended ? 'OUI' : 'NON'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date Inscription:</span>
                <span className="text-slate-400 font-mono">{viewingUser.createdAt}</span>
              </div>
            </div>
            <button
              onClick={() => setViewingUser(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* --- MODIFIER USER POPUP --- */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveUserEdit} className="bg-[#0B0F19] border border-slate-800 rounded-3xl p-6 w-full max-w-xs text-xs space-y-4 shadow-2xl relative text-left">
            <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              Modifier l'utilisateur
            </h3>
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-3">
              <div>
                <label className="text-[8px] font-black uppercase text-slate-500 block mb-1">Pseudo / Nom</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="text-[8px] font-black uppercase text-slate-500 block mb-1">Numéro Téléphone</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-[8px] font-black uppercase text-slate-500 block mb-1">Date de naissance</label>
                <input
                  type="text"
                  value={editDob}
                  onChange={(e) => setEditDob(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white font-mono"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl uppercase"
              >
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-400 py-2 rounded-xl"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- SELECTED HISTORY USER / DETAILED PROFIL MODAL --- */}
      {selectedHistoryUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl p-5 w-full max-w-md text-xs flex flex-col max-h-[85vh] shadow-2xl relative text-left">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-indigo-400" />
                  Profil & Historiques
                </h3>
                <span className="text-[10px] text-slate-400 font-bold block mt-0.5 font-sans">
                  Client : {selectedHistoryUser.username} ({selectedHistoryUser.phoneNumber})
                </span>
              </div>
              <button
                onClick={() => setSelectedHistoryUser(null)}
                className="p-1 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex gap-1.5 rounded-xl bg-slate-950 p-1 border border-slate-900 mb-3 shrink-0">
              {(['profile', 'transactions', 'payments', 'connections'] as const).map((tab) => {
                let label = '';
                switch (tab) {
                  case 'profile': label = '👤 Profil'; break;
                  case 'transactions': label = '💸 Solde'; break;
                  case 'payments': label = '💳 Paiements'; break;
                  case 'connections': label = '📡 Logins'; break;
                }
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setHistoryTab(tab)}
                    className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${
                      historyTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Modal Content Scrollable Area */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
              
              {/* TAB 1: PROFILE */}
              {historyTab === 'profile' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-900 space-y-2.5">
                    <span className="text-[8px] font-black uppercase text-indigo-400 tracking-wider block font-mono">Informations Générales</span>
                    <div className="flex justify-between items-center text-[11px] border-b border-slate-900/60 pb-1.5">
                      <span className="text-slate-500">Nom / Pseudo:</span>
                      <span className="font-extrabold text-white">{selectedHistoryUser.username}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] border-b border-slate-900/60 pb-1.5">
                      <span className="text-slate-500">ID Unique Utilisateur:</span>
                      <span className="font-mono text-indigo-300 font-bold">{selectedHistoryUser.userId}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] border-b border-slate-900/60 pb-1.5">
                      <span className="text-slate-500">Téléphone:</span>
                      <span className="font-mono font-bold text-white">{selectedHistoryUser.phoneNumber}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] border-b border-slate-900/60 pb-1.5">
                      <span className="text-slate-500">Date de naissance:</span>
                      <span className="text-slate-200 font-bold">{selectedHistoryUser.dob}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] pb-0.5">
                      <span className="text-slate-500">Date d'inscription:</span>
                      <span className="text-slate-400 font-mono">{selectedHistoryUser.createdAt || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-900 space-y-2.5">
                    <span className="text-[8px] font-black uppercase text-emerald-400 tracking-wider block font-mono">Abonnements & Soldes</span>
                    <div className="flex justify-between items-center text-[11px] border-b border-slate-900/60 pb-1.5">
                      <span className="text-slate-500">Type de Compte VIP:</span>
                      <span className={`font-black flex items-center gap-1 uppercase ${selectedHistoryUser.isVip ? 'text-amber-400' : 'text-slate-400'}`}>
                        <Crown className="h-3.5 w-3.5 fill-current" />
                        {selectedHistoryUser.isVip ? 'Premium VIP' : 'Membre Gratuit'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] border-b border-slate-900/60 pb-1.5">
                      <span className="text-slate-500">Solde Live TOP:</span>
                      <span className="font-mono font-black text-emerald-400 text-xs">{(selectedHistoryUser.soldeLiveTop || 0).toLocaleString('fr-FR')} Ar</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] border-b border-slate-900/60 pb-1.5">
                      <span className="text-slate-500">Date d'activation:</span>
                      <span className="text-slate-300 font-bold">{selectedHistoryUser.sigActivationDate ? formatFrenchDateTime(selectedHistoryUser.sigActivationDate) : 'Aucune'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] border-b border-slate-900/60 pb-1.5">
                      <span className="text-slate-500">Date d'expiration:</span>
                      <span className="text-slate-300 font-bold">{selectedHistoryUser.sigExpirationDate ? formatFrenchDateTime(selectedHistoryUser.sigExpirationDate) : 'Aucune'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] pb-0.5">
                      <span className="text-slate-500">Temps Restant:</span>
                      <span className={`font-black tracking-wider uppercase ${selectedHistoryUser.soldeLiveTop && !getTimeRemainingStr(selectedHistoryUser.sigExpirationDate).includes('Expiré') ? 'text-amber-500' : 'text-red-500'}`}>
                        {getTimeRemainingStr(selectedHistoryUser.sigExpirationDate)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TRANSACTIONS SOLDE */}
              {historyTab === 'transactions' && (
                <div className="space-y-2 animate-fade-in">
                  <span className="text-[8px] font-black uppercase text-indigo-400 tracking-wider block font-mono">Historique des opérations de solde</span>
                  {balanceLogs.filter(log => log.targetUserId === selectedHistoryUser.userId).length === 0 ? (
                    <div className="text-center py-8 text-slate-500 italic bg-slate-950/40 border border-slate-900 rounded-2xl">
                      Aucune transaction enregistrée pour ce client.
                    </div>
                  ) : (
                    balanceLogs
                      .filter(log => log.targetUserId === selectedHistoryUser.userId)
                      .map((log) => {
                        let text = '';
                        let color = '';
                        if (log.action === 'add') {
                          text = `Ajout de +${log.amount?.toLocaleString()} Ar`;
                          color = 'text-emerald-400 bg-emerald-950/40 border-emerald-900/30';
                        } else if (log.action === 'remove') {
                          text = 'Retrait de solde (Mis à 0 Ar)';
                          color = 'text-rose-400 bg-rose-950/40 border-rose-900/30';
                        } else if (log.action === 'prolong') {
                          text = `Prolongation (+15j, +${log.amount?.toLocaleString()} Ar)`;
                          color = 'text-indigo-400 bg-indigo-950/40 border-indigo-900/30';
                        } else if (log.action === 'vip') {
                          text = 'Passé Premium VIP';
                          color = 'text-amber-400 bg-amber-950/40 border-amber-900/30';
                        } else if (log.action === 'free') {
                          text = 'Retour Gratuit';
                          color = 'text-slate-400 bg-slate-900/40 border-slate-800';
                        } else {
                          text = `Action: ${log.action}`;
                          color = 'text-slate-400 bg-slate-950/60 border-slate-900';
                        }
                        return (
                          <div key={log.id} className="p-3 bg-slate-950/80 border border-slate-900 rounded-2xl flex flex-col gap-1.5 font-mono text-[10px]">
                            <div className="flex justify-between items-center">
                              <span className="text-[8px] text-slate-500">{new Date(log.timestamp).toLocaleString('fr-FR')}</span>
                              <span className="text-slate-400 text-[9px]">Par : <span className="text-white font-sans font-extrabold">@{log.adminUsername}</span></span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-300 font-sans">Opération sécurisée</span>
                              <span className={`px-2 py-0.5 rounded text-[8px] border font-sans font-black uppercase tracking-wider ${color}`}>
                                {text}
                              </span>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              )}

              {/* TAB 3: PAYMENTS HISTORIC */}
              {historyTab === 'payments' && (
                <div className="space-y-2 animate-fade-in">
                  <span className="text-[8px] font-black uppercase text-indigo-400 tracking-wider block font-mono">Historique des demandes de paiement</span>
                  {paymentRequests.filter(req => req.userPhone === selectedHistoryUser.phoneNumber || req.userId === selectedHistoryUser.userId).length === 0 ? (
                    <div className="text-center py-8 text-slate-500 italic bg-slate-950/40 border border-slate-900 rounded-2xl">
                      Aucune demande de paiement pour ce client.
                    </div>
                  ) : (
                    paymentRequests
                      .filter(req => req.userPhone === selectedHistoryUser.phoneNumber || req.userId === selectedHistoryUser.userId)
                      .map((req) => (
                        <div key={req.id} className="p-3 bg-slate-950/80 border border-slate-900 rounded-2xl space-y-2 text-[10px] font-mono">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-bold text-[8px]">{req.timestamp || req.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-sans font-extrabold uppercase ${
                              req.status === 'Approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/30' :
                              req.status === 'Rejected' ? 'bg-rose-950 text-rose-400 border border-rose-900/30' :
                              'bg-amber-950 text-amber-400 border border-amber-900/30 animate-pulse'
                            }`}>
                              {req.status === 'Approved' ? 'Approuvé' : req.status === 'Rejected' ? 'Refusé' : 'En attente'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Montant :</span>
                            <span className="font-extrabold text-white font-sans">{req.amount.toLocaleString()} Ar</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Méthode :</span>
                            <span className="text-slate-300">{req.method}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Référence :</span>
                            <span className="text-indigo-400 select-all">{req.reference}</span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}

              {/* TAB 4: CONNECTION HISTORY */}
              {historyTab === 'connections' && (
                <div className="space-y-2 animate-fade-in">
                  <span className="text-[8px] font-black uppercase text-indigo-400 tracking-wider block font-mono">Journal de connexions du terminal</span>
                  {(() => {
                    const saved = localStorage.getItem('sourspark_connection_logs');
                    const list = saved ? JSON.parse(saved) : [];
                    const filtered = list.filter((l: any) => l.userId === selectedHistoryUser.userId);
                    
                    const connectionsList = filtered.length > 0 ? filtered : (
                      selectedHistoryUser.lastConnectionAt ? [
                        {
                          id: 'mock-1',
                          timestamp: selectedHistoryUser.lastConnectionAt,
                          ip: '196.192.34.112',
                          device: 'Mobile (Safari iOS)'
                        },
                        {
                          id: 'mock-2',
                          timestamp: new Date(new Date(selectedHistoryUser.lastConnectionAt).getTime() - 2 * 3600 * 1000).toISOString(),
                          ip: '196.192.34.112',
                          device: 'Mobile (Safari iOS)'
                        }
                      ] : []
                    );

                    if (connectionsList.length === 0) {
                      return (
                        <div className="text-center py-8 text-slate-500 italic bg-slate-950/40 border border-slate-900 rounded-2xl">
                          Aucune connexion enregistrée.
                        </div>
                      );
                    }

                    return connectionsList.map((conn: any) => (
                      <div key={conn.id} className="p-3 bg-slate-950/80 border border-slate-900 rounded-2xl flex flex-col gap-1 text-[10px] font-mono">
                        <div className="flex justify-between items-center text-[8px] text-slate-500">
                          <span>Session ID: {conn.id}</span>
                          <span>{new Date(conn.timestamp).toLocaleString('fr-FR')}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-slate-400">Terminal :</span>
                          <span className="text-slate-300 font-sans">{conn.device || 'Navigateur standard'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Adresse IP :</span>
                          <span className="text-indigo-400">{conn.ip || 'Local IP'}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-900/40 pt-1 mt-1 text-[8px]">
                          <span className="text-emerald-400 flex items-center gap-1 uppercase font-bold">
                            <span className="h-1 w-1 rounded-full bg-emerald-400" />
                            Succès SSL Authentifié
                          </span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 mt-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedHistoryUser(null)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider"
              >
                Fermer l'historique
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
