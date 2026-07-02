/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { Match, League, NotificationItem, UserAccount, PaymentRequest, LiveSignal, ChatMessage, BalanceLog } from './types';
import { MATCHES_DATABASE, LEAGUES_LIST, NOTIFICATIONS_DATABASE } from './data/matchDatabase';
import Navbar from './components/Navbar';
import DateSelector from './components/DateSelector';
import MatchCard from './components/MatchCard';
import VipModal from './components/VipModal';
import NotificationPanel from './components/NotificationPanel';
import SupportChat from './components/SupportChat';
import MoreSheet from './components/MoreSheet';
import AuthScreen from './components/AuthScreen';
import AdminPanel from './components/AdminPanel';
import AdminLoginModal from './components/AdminLoginModal';
import { PremiumPoster, getTeamFlagAndColors } from './components/PremiumPoster';
import AnalysePremium from './components/AnalysePremium';

import {
  Trophy,
  Activity,
  Award,
  Calendar,
  Sparkles,
  Zap,
  TrendingUp,
  Search,
  CheckCircle,
  HelpCircle,
  User,
  ShieldAlert,
  Crown,
  ChevronRight,
  Calculator,
  Plus,
  Minus,
  Trash2,
  Megaphone,
  MessageSquare,
  Heart,
  ThumbsUp,
  Flame,
  CornerDownRight,
  Share2,
  Send,
  ArrowLeft,
  Clock,
  Lock,
  Unlock,
} from 'lucide-react';

export default function App() {
  // --- USER ACCOUNTS AND AUTH STATE ---
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('sourspark_users');
    if (saved) return JSON.parse(saved);
    const initialUsers: UserAccount[] = [
      {
        userId: 'USR-100001',
        username: 'VIP User',
        phoneNumber: '0341234567',
        dob: '2000-01-01',
        passwordHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // "password"
        isVip: true,
        isSuspended: false,
        createdAt: '28/06/2026'
      },
      {
        userId: 'USR-100002',
        username: 'Free User',
        phoneNumber: '0321234567',
        dob: '2005-05-15',
        passwordHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // "password"
        isVip: false,
        isSuspended: false,
        createdAt: '29/06/2026'
      }
    ];
    localStorage.setItem('sourspark_users', JSON.stringify(initialUsers));
    return initialUsers;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('sourspark_current_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      const freshUser = JSON.parse(localStorage.getItem('sourspark_users') || '[]').find(
        (u: any) => u.userId === parsed.userId
      );
      if (freshUser) {
        if (freshUser.isSuspended) {
          localStorage.removeItem('sourspark_current_user');
          return null;
        }
        return freshUser;
      }
      return parsed;
    }
    return null;
  });

  // --- MATCHES AND LEAGUES DYNAMIC DATABASE ---
  const [matches, setMatches] = useState<Match[]>(() => {
    const saved = localStorage.getItem('sourspark_matches');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('sourspark_matches', JSON.stringify(MATCHES_DATABASE));
    return MATCHES_DATABASE;
  });

  const [leagues, setLeagues] = useState<League[]>(() => {
    const saved = localStorage.getItem('sourspark_leagues');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('sourspark_leagues', JSON.stringify(LEAGUES_LIST));
    return LEAGUES_LIST;
  });

  // --- PAYMENT REQUESTS ---
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>(() => {
    const saved = localStorage.getItem('sourspark_payment_requests');
    if (saved) return JSON.parse(saved);
    return [];
  });

  // --- LIVE SIGNALS & ANNOUNCEMENTS ---
  const [liveSignals, setLiveSignals] = useState<LiveSignal[]>(() => {
    const saved = localStorage.getItem('sourspark_live_signals');
    if (saved) return JSON.parse(saved);
    const initialSignals: LiveSignal[] = [
      {
        id: 'sig-1',
        type: 'announcement',
        title: '🔥 Grand Lancement Sourspark VIP !',
        content: 'Bénéficiez dès aujourd\'hui d\'un accès premium complet à nos prédictions d\'intelligence artificielle et maximisez vos gains dès ce soir.',
        timestamp: '10:00',
        isPremium: false
      },
      {
        id: 'sig-2',
        type: 'signal',
        title: '📡 Signal Live Détecté (Forte Probabilité)',
        content: 'Les modèles de simulation indiquent une forte domination de Manchester City. Valeur de mise en direct intéressante.',
        matchInfo: 'Manchester City vs Tottenham',
        prediction: 'Victoire Manchester City (1)',
        odds: 1.45,
        timestamp: '20:15',
        isPremium: true
      }
    ];
    localStorage.setItem('sourspark_live_signals', JSON.stringify(initialSignals));
    return initialSignals;
  });

  // --- SUPPORT CHAT MESSAGES ---
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('sourspark_chat_messages');
    if (saved) return JSON.parse(saved);
    const initialMsgs: ChatMessage[] = [
      {
        id: 'welcome-1',
        userId: 'system',
        sender: 'admin',
        text: 'Bienvenue sur le support de Predictions Sourspark ! Comment pouvons-nous vous aider aujourd\'hui ?',
        timestamp: '08:00'
      }
    ];
    localStorage.setItem('sourspark_chat_messages', JSON.stringify(initialMsgs));
    return initialMsgs;
  });

  // Navigation state
  // "home" | "free" | "best" | "live" | "vip" | "htft" | "more" | "live-scores" | "live-tips" | "single" | "btts" | "overunder" | "terms" | "privacy" | "profile" | "live-top" | "admin"
  const [activeView, setActiveView] = useState<string>('home');
  const [selectedDate, setSelectedDate] = useState<string>('2026-06-30');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedLeagueTab, setSelectedLeagueTab] = useState<'results' | 'matches' | 'standings'>('matches');
  const [selectedHourIndex, setSelectedHourIndex] = useState<number>(4);
  const [currentTimeTick, setCurrentTimeTick] = useState<number>(0);

  // Auto-refresh virtual times list
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimeTick((prev) => prev + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Reset tab and active hour when changing league
  useEffect(() => {
    setSelectedLeagueTab('matches');
    setSelectedHourIndex(4);
  }, [selectedLeagueId]);
  
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    return !localStorage.getItem('onboarding_completed');
  });
  const [favLeague, setFavLeague] = useState<string>('eng');

  // Bet slip / cart state
  const [betSlip, setBetSlip] = useState<{ matchId: string; choice: '1' | 'X' | '2'; odds: number }[]>([]);
  const [stake, setStake] = useState<number>(10);
  const [isBetSlipOpen, setIsBetSlipOpen] = useState<boolean>(false);

  // VIP Subscription status calculated dynamically from user database
  const isVipSubscribed = useMemo(() => {
    if (!currentUser) return false;
    const userObj = users.find((u) => u.userId === currentUser.userId);
    return userObj ? userObj.isVip : false;
  }, [currentUser, users]);

  const [isVipModalOpen, setIsVipModalOpen] = useState<boolean>(false);

  // Support messages mapped dynamically for current user
  const userSupportMessages = useMemo(() => {
    if (!currentUser) return [];
    return chatMessages.filter(
      (m) => m.userId === currentUser.userId || m.userId === 'system'
    ).map((m) => ({
      id: m.id,
      sender: m.sender === 'admin' ? 'support' as const : 'user' as const,
      text: m.text,
      timestamp: m.timestamp
    }));
  }, [chatMessages, currentUser]);

  const [isSupportOpen, setIsSupportOpen] = useState<boolean>(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => localStorage.getItem('sourspark_admin_auth') === 'true');
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState<boolean>(false);

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>(NOTIFICATIONS_DATABASE);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all');

  // Premium publication states
  const [selectedSignal, setSelectedSignal] = useState<LiveSignal | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [hoveredSignalId, setHoveredSignalId] = useState<string | null>(null);

  // Free page status sub-filters (Pending, Won, Lost)
  const [freeSubFilter, setFreeSubFilter] = useState<'Pending' | 'Won' | 'Lost' | 'All'>('All');

  // Periodic check for Live TOP balance expiration
  useEffect(() => {
    const checkExpiration = () => {
      const savedUsers = localStorage.getItem('sourspark_users');
      if (!savedUsers) return;
      const allUsers: UserAccount[] = JSON.parse(savedUsers);
      let changed = false;

      const updatedUsers = allUsers.map(u => {
        if ((u.soldeLiveTop || 0) > 0 && u.sigExpirationDate) {
          const expTime = new Date(u.sigExpirationDate).getTime();
          if (Date.now() >= expTime) {
            changed = true;
            
            // Log expiration
            const systemLog: BalanceLog = {
              id: `log-exp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              adminUsername: 'système_auto',
              targetUserId: u.userId,
              targetUsername: u.username,
              targetPhone: u.phoneNumber,
              action: 'remove',
              amount: 0,
              timestamp: new Date().toISOString()
            };
            const currentLogs = JSON.parse(localStorage.getItem('sourspark_balance_logs') || '[]');
            localStorage.setItem('sourspark_balance_logs', JSON.stringify([systemLog, ...currentLogs]));

            // Push notification
            const newNotif = {
              id: `notif-exp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              userId: u.userId,
              title: '❌ Accès Live TOP expiré',
              message: 'Votre solde Live TOP est arrivé à expiration et a été réinitialisé à 0 Ar. Veuillez renouveler votre abonnement pour continuer à recevoir nos signaux.',
              timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              isRead: false
            };
            const currentNotifs = JSON.parse(localStorage.getItem('sourspark_notifications') || '[]');
            localStorage.setItem('sourspark_notifications', JSON.stringify([newNotif, ...currentNotifs]));

            return {
              ...u,
              soldeLiveTop: 0,
              sigActivationDate: undefined,
              sigExpirationDate: undefined
            };
          }
        }
        return u;
      });

      if (changed) {
        setUsers(updatedUsers);
        localStorage.setItem('sourspark_users', JSON.stringify(updatedUsers));
        
        // Update current user too if matches
        if (currentUser) {
          const freshCurrentUser = updatedUsers.find(u => u.userId === currentUser.userId);
          if (freshCurrentUser) {
            setCurrentUser(freshCurrentUser);
            localStorage.setItem('sourspark_current_user', JSON.stringify(freshCurrentUser));
          } else {
            setCurrentUser(null);
            localStorage.removeItem('sourspark_current_user');
          }
        }
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [currentUser, users]);

  // Computed counters
  const cartCount = betSlip.length;
  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  // Onboarding Complete action
  const handleCompleteOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setShowOnboarding(false);
    if (favLeague !== 'all') {
      setSelectedLeagueId(favLeague);
    }
  };

  // Reset Onboarding action
  const handleResetOnboarding = () => {
    localStorage.removeItem('onboarding_completed');
    setShowOnboarding(true);
    setActiveView('home');
    setIsNotificationsOpen(false);
    setIsSupportOpen(false);
  };

  // --- PREMIUM PUBLICATION ACTIONS ---
  const handleReactToSignal = (signalId: string, reactionType: 'love' | 'like' | 'fire' | 'clap' | 'wow') => {
    const updated = liveSignals.map(sig => {
      if (sig.id !== signalId) return sig;
      
      const currentReactions = sig.reactions || { love: 0, like: 0, fire: 0, clap: 0, wow: 0 };
      const newReactions = {
        ...currentReactions,
        [reactionType]: (currentReactions[reactionType] || 0) + 1
      };
      return { ...sig, reactions: newReactions };
    });
    setLiveSignals(updated);
    localStorage.setItem('sourspark_live_signals', JSON.stringify(updated));
    
    if (selectedSignal && selectedSignal.id === signalId) {
      const found = updated.find(s => s.id === signalId);
      if (found) setSelectedSignal(found);
    }
  };

  const handleAddComment = (signalId: string, text: string) => {
    if (!text.trim()) return;
    
    const newComment = {
      id: 'comment_' + Date.now(),
      authorName: currentUser ? currentUser.username : 'Visiteur',
      authorRole: currentUser ? currentUser.role : 'user',
      text: text,
      timestamp: new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toTimeString().slice(0, 5),
      replies: []
    };

    const updated = liveSignals.map(sig => {
      if (sig.id !== signalId) return sig;
      const currentComments = sig.comments || [];
      return {
        ...sig,
        comments: [...currentComments, newComment]
      };
    });

    setLiveSignals(updated);
    localStorage.setItem('sourspark_live_signals', JSON.stringify(updated));
    
    if (selectedSignal && selectedSignal.id === signalId) {
      const found = updated.find(s => s.id === signalId);
      if (found) setSelectedSignal(found);
    }
    setCommentText('');
  };

  const handleAddReply = (signalId: string, commentId: string, text: string) => {
    if (!text.trim()) return;

    const newReply = {
      id: 'reply_' + Date.now(),
      authorName: currentUser ? currentUser.username : 'Visiteur',
      authorRole: currentUser ? currentUser.role : 'user',
      text: text,
      timestamp: new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toTimeString().slice(0, 5)
    };

    const updated = liveSignals.map(sig => {
      if (sig.id !== signalId) return sig;
      const currentComments = sig.comments || [];
      const updatedComments = currentComments.map(c => {
         if (c.id !== commentId) return c;
         return {
           ...c,
           replies: [...(c.replies || []), newReply]
         };
      });
      return {
        ...sig,
        comments: updatedComments
      };
    });

    setLiveSignals(updated);
    localStorage.setItem('sourspark_live_signals', JSON.stringify(updated));

    if (selectedSignal && selectedSignal.id === signalId) {
      const found = updated.find(s => s.id === signalId);
      if (found) setSelectedSignal(found);
    }
    setReplyingCommentId(null);
    setReplyText('');
  };

  const handleDeleteCommentOrReply = (signalId: string, commentId: string, replyId?: string) => {
    const updated = liveSignals.map(sig => {
      if (sig.id !== signalId) return sig;
      const currentComments = sig.comments || [];
      
      let updatedComments;
      if (replyId) {
        updatedComments = currentComments.map(c => {
          if (c.id !== commentId) return c;
          return {
            ...c,
            replies: (c.replies || []).filter(r => r.id !== replyId)
          };
        });
      } else {
        updatedComments = currentComments.filter(c => c.id !== commentId);
      }
      
      return {
        ...sig,
        comments: updatedComments
      };
    });

    setLiveSignals(updated);
    localStorage.setItem('sourspark_live_signals', JSON.stringify(updated));

    if (selectedSignal && selectedSignal.id === signalId) {
      const found = updated.find(s => s.id === signalId);
      setSelectedSignal(found || null);
    }
  };

  // Submit payment helper inside VipModal
  const handleSubmitPayment = (method: 'orange' | 'airtel' | 'mvola' | 'usdt', reference: string, amount: string) => {
    if (!currentUser) return;
    const newRequest: PaymentRequest = {
      id: `req-${Date.now()}`,
      userId: currentUser.userId,
      userPhone: currentUser.phoneNumber,
      method,
      reference,
      amount,
      status: 'Pending',
      timestamp: new Date().toLocaleString('fr-FR')
    };

    const updated = [...paymentRequests, newRequest];
    setPaymentRequests(updated);
    localStorage.setItem('sourspark_payment_requests', JSON.stringify(updated));
  };

  // Select payment method action in VipModal (Chat redirection & manual flow)
  const handleSelectPaymentMethod = (method: 'orange' | 'airtel' | 'mvola' | 'usdt') => {
    if (!currentUser) return;

    // 1. Close VIP Modal
    setIsVipModalOpen(false);

    // 2. Open the support chat
    setIsSupportOpen(true);

    // 3. Generate prefilled message from the user
    let methodFriendly = "";
    if (method === 'orange') methodFriendly = "Orange Money";
    if (method === 'airtel') methodFriendly = "Airtel Money";
    if (method === 'mvola') methodFriendly = "MVola";
    if (method === 'usdt') methodFriendly = "USDT (TRC20)";

    const userMessageText = `Bonjour, je souhaite m'abonner au VIP Premium via ${methodFriendly}. Pouvez-vous m'envoyer les informations de paiement ?`;

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      userId: currentUser.userId,
      sender: 'user',
      text: userMessageText,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    // 4. Admin automatic response
    let adminResponseText = "";
    if (method === 'orange') {
      adminResponseText = "Bonjour ! Pour payer par Orange Money, veuillez envoyer 30 000 MGA au numéro suivant : +261 34 259 4678 (Nom: SOURSPARK VIP). Veuillez envoyer une capture d'écran ou la référence du SMS une fois le paiement effectué.";
    } else if (method === 'airtel') {
      adminResponseText = "Bonjour ! Pour payer par Airtel Money, veuillez envoyer 30 000 MGA au numéro suivant : +261 34 259 4678 (Nom: SOURSPARK VIP). Veuillez envoyer une capture d'écran ou la référence du SMS une fois le paiement effectué.";
    } else if (method === 'mvola') {
      adminResponseText = "Bonjour ! Pour payer par MVola, veuillez envoyer 30 000 MGA au numéro suivant : +261 34 259 4678 (Nom: SOURSPARK VIP). Veuillez envoyer une capture d'écran ou la référence du SMS une fois le paiement effectué.";
    } else {
      adminResponseText = "Bonjour ! Pour payer par USDT (TRC20), veuillez envoyer 7.5 USDT à l'adresse suivante : TAACqVKdX53yWpwwjDtU5mhdk73vsSXyDt. Veuillez copier-coller le TxHash de la transaction après envoi.";
    }

    const adminMsg: ChatMessage = {
      id: `msg-admin-${Date.now() + 1}`,
      userId: currentUser.userId,
      sender: 'admin',
      text: adminResponseText,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    // Update messages database
    const currentMessages = JSON.parse(localStorage.getItem('sourspark_chat_messages') || '[]');
    const updatedMessages = [...currentMessages, userMsg, adminMsg];
    localStorage.setItem('sourspark_chat_messages', JSON.stringify(updatedMessages));
    setChatMessages(updatedMessages);
    
    // Create a pending request
    const newRequest: PaymentRequest = {
      id: `req-${Date.now()}`,
      userId: currentUser.userId,
      userPhone: currentUser.phoneNumber,
      method,
      reference: "En attente via Chat",
      amount: "30,000 MGA",
      status: 'Pending',
      timestamp: new Date().toLocaleString('fr-FR')
    };

    const updatedReqs = [...paymentRequests, newRequest];
    setPaymentRequests(updatedReqs);
    localStorage.setItem('sourspark_payment_requests', JSON.stringify(updatedReqs));
  };

  const handleLogout = () => {
    localStorage.removeItem('sourspark_current_user');
    setCurrentUser(null);
    localStorage.removeItem('vip_active');
    alert('Vous avez été déconnecté avec succès.');
    setActiveView('home');
  };

  const handleOpenAdmin = () => {
    if (isAdminAuthenticated) {
      setActiveView('admin');
    } else {
      setIsAdminLoginModalOpen(true);
    }
  };

  // Notification actions
  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // Bet slip action: click an odd on a match card
  const handleBetClick = (matchId: string, choice: '1' | 'X' | '2') => {
    const matchObj = matches.find((m) => m.id === matchId);
    if (!matchObj) return;

    const oddsVal =
      choice === '1'
        ? matchObj.odds.homeWin
        : choice === 'X'
        ? matchObj.odds.draw
        : matchObj.odds.awayWin;

    setBetSlip((prev) => {
      const existingIdx = prev.findIndex((item) => item.matchId === matchId);
      if (existingIdx > -1) {
        // If they click the exact same choice, remove it. Otherwise update choice
        if (prev[existingIdx].choice === choice) {
          return prev.filter((item) => item.matchId !== matchId);
        } else {
          const updated = [...prev];
          updated[existingIdx] = { matchId, choice, odds: oddsVal };
          return updated;
        }
      } else {
        return [...prev, { matchId, choice, odds: oddsVal }];
      }
    });
    setIsBetSlipOpen(true);
  };

  const removeFromBetSlip = (matchId: string) => {
    setBetSlip((prev) => prev.filter((item) => item.matchId !== matchId));
  };

  // Computed potential payout for bet slip
  const totalOdds = useMemo(() => {
    if (betSlip.length === 0) return 0;
    return betSlip.reduce((acc, item) => acc * item.odds, 1);
  }, [betSlip]);

  const potentialWin = (totalOdds * stake).toFixed(2);

  // Send Support Message & automated intelligent answers
  const handleSendMessage = (text: string) => {
    if (!currentUser) return;
    const newMsg: ChatMessage = {
      id: `user-msg-${Date.now()}`,
      userId: currentUser.userId,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [...chatMessages, newMsg];
    setChatMessages(updated);
    localStorage.setItem('sourspark_chat_messages', JSON.stringify(updated));

    // Automated response logic for instant answers
    setTimeout(() => {
      let reply = "Merci pour votre message. Un administrateur va vous répondre très bientôt.";
      const query = (text || '').toLowerCase();
      if (query.includes('vip') || query.includes('premium') || query.includes('payant')) {
        reply = "L'abonnement VIP débloque tous les pronostics premium (cotes élevées, HT/FT, BTTS, etc.) pour 30 000 MGA par mois. Sélectionnez 'Passer à Premium' dans le menu pour vous abonner !";
      } else if (query.includes('gagn') || query.includes('rembours') || query.includes('perdu')) {
        reply = "Bien que les paris comportent des risques, nos prévisions basées sur des modèles d'intelligence artificielle optimisent la rentabilité au maximum.";
      } else if (query.includes('/admin')) {
        reply = "Pour accéder au Panel Administrateur secret, allez dans 'More', puis cliquez 5 fois rapidement sur la version tout en bas. Entrez le code PIN d'administration.";
      }

      const botMsg: ChatMessage = {
        id: `bot-msg-${Date.now()}`,
        userId: currentUser.userId,
        sender: 'admin',
        text: reply,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };

      const updatedWithBot = [...updated, botMsg];
      setChatMessages(updatedWithBot);
      localStorage.setItem('sourspark_chat_messages', JSON.stringify(updatedWithBot));
    }, 1500);
  };

  // Helper to filter matches dynamically across all screens
  const displayedMatches = useMemo(() => {
    return matches.filter((match) => {
      // Date filter
      const matchesDate = selectedDate === 'all_future' ? match.date >= '2026-06-30' : match.date === selectedDate;
      if (!matchesDate) return false;

      // League filter
      if (selectedLeagueId !== 'all' && match.leagueId !== selectedLeagueId) return false;

      // Search query filter
      if (searchQuery) {
        const query = (searchQuery || '').toLowerCase();
        const matchesTeams =
          (match.homeTeam || '').toLowerCase().includes(query) ||
          (match.awayTeam || '').toLowerCase().includes(query) ||
          (match.leagueName || '').toLowerCase().includes(query);
        if (!matchesTeams) return false;
      }

      return true;
    });
  }, [selectedDate, selectedLeagueId, searchQuery]);

  // Generate virtual timetable of 9 hours (spaced by 2 minutes) around current time
  const currentVirtualTimes = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    // Align to closest even minute
    const activeMinutes = currentMinutes % 2 === 0 ? currentMinutes : currentMinutes - 1;
    
    const times = [];
    for (let offset = -8; offset <= 8; offset += 2) {
      const min = activeMinutes + offset;
      const h = Math.floor((min + 1440) % 1440 / 60);
      const m = (min + 1440) % 1440 % 60;
      const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      times.push({
        time: formatted,
        isActive: offset === 0,
        isPast: offset < 0,
        isFuture: offset > 0
      });
    }
    return times;
  }, [currentTimeTick]);

  // Dynamic standings calculation
  const standings = useMemo(() => {
    if (selectedLeagueId === 'all') return [];
    
    // Get all matches for the selected league
    const leagueMatches = matches.filter(m => m.leagueId === selectedLeagueId);
    
    // Extract unique teams
    const teamSet = new Set<string>();
    leagueMatches.forEach(m => {
      teamSet.add(m.homeTeam);
      teamSet.add(m.awayTeam);
    });
    
    const teamStats: Record<string, { name: string; played: number; won: number; drawn: number; lost: number; pts: number }> = {};
    teamSet.forEach(name => {
      teamStats[name] = { name, played: 0, won: 0, drawn: 0, lost: 0, pts: 0 };
    });
    
    // Calculate stats from completed matches
    const completedMatches = leagueMatches.filter(m => m.matchStatus === 'FT' && m.finalScoreHome !== null && m.finalScoreAway !== null);
    
    completedMatches.forEach(m => {
      const home = m.homeTeam;
      const away = m.awayTeam;
      const hs = m.finalScoreHome!;
      const as = m.finalScoreAway!;
      
      if (teamStats[home] && teamStats[away]) {
        teamStats[home].played += 1;
        teamStats[away].played += 1;
        
        if (hs > as) {
          teamStats[home].won += 1;
          teamStats[home].pts += 3;
          teamStats[away].lost += 1;
        } else if (hs < as) {
          teamStats[away].won += 1;
          teamStats[away].pts += 3;
          teamStats[home].lost += 1;
        } else {
          teamStats[home].drawn += 1;
          teamStats[home].pts += 1;
          teamStats[away].drawn += 1;
          teamStats[away].pts += 1;
        }
      }
    });
    
    return Object.values(teamStats).sort((a, b) => b.pts - a.pts || a.name.localeCompare(b.name));
  }, [selectedLeagueId, matches]);

  // View titles mappings
  const viewTitle = useMemo(() => {
    switch (activeView) {
      case 'home':
        return 'Featured Competition';
      case 'free':
        return 'Sure Free Tips';
      case 'best':
        return '85% Success Best Tips';
      case 'live':
        return 'Live Scores & Stats';
      case 'live-scores':
        return 'Live Scores';
      case 'live-tips':
        return 'Active Live Predictions';
      case 'vip':
        return 'Premium VIP Lounge';
      case 'htft':
        return 'Half Time / Full Time Tips';
      case 'single':
        return 'Single Match Tips';
      case 'btts':
        return 'Both Teams To Score (BTTS)';
      case 'overunder':
        return 'Over / Under Goals';
      case 'terms':
        return "Conditions d'utilisation";
      case 'privacy':
        return 'Politique de confidentialité';
      case 'profile':
        return 'User Profile';
      case 'analyse-premium':
        return 'Analyse Premium';
      case 'more':
        return 'More Features';
      default:
        return 'Predictions & Tips';
    }
  }, [activeView]);

  // 1. Auth Guard (Requires login/registration before accessing the app)
  if (!currentUser) {
    return (
      <AuthScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem('sourspark_current_user', JSON.stringify(user));
        }}
        allUsers={users}
        onRegisterUser={(newUser) => {
          const updated = [...users, newUser];
          setUsers(updated);
          localStorage.setItem('sourspark_users', JSON.stringify(updated));
        }}
      />
    );
  }

  // 1.5 Suspended account check
  if (currentUser.isSuspended) {
    return (
      <div className="mx-auto min-h-screen max-w-md bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center font-sans">
        <div className="h-16 w-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center text-red-500 mb-6">
          <Activity className="h-8 w-8 animate-pulse" />
        </div>
        <h2 className="text-xl font-black uppercase tracking-tight text-white mb-2">Compte Suspendu</h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-xs mb-6">
          Votre compte (ID: {currentUser.userId}) a été suspendu par l'administrateur de Sourspark. Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le support.
        </p>
        <button
          onClick={() => {
            localStorage.removeItem('sourspark_current_user');
            setCurrentUser(null);
          }}
          className="w-full max-w-xs py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-all"
        >
          Retourner à la connexion
        </button>
      </div>
    );
  }

  // 2. Admin View Takeover
  if (activeView === 'admin') {
    return (
      <AdminPanel
        onClose={() => setActiveView('more')}
        onAdminLogout={() => {
          setIsAdminAuthenticated(false);
          localStorage.removeItem('sourspark_admin_auth');
          setActiveView('home');
        }}
        matches={matches}
        setMatches={setMatches}
        leagues={leagues}
        setLeagues={setLeagues}
        users={users}
        setUsers={setUsers}
        paymentRequests={paymentRequests}
        setPaymentRequests={setPaymentRequests}
        liveSignals={liveSignals}
        setLiveSignals={setLiveSignals}
        chatMessages={chatMessages}
        setChatMessages={setChatMessages}
        notifications={notifications}
        setNotifications={setNotifications}
      />
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-md premium-soccer-bg shadow-2xl flex flex-col relative font-sans">
      
      {/* ONBOARDING FLOW PANEL */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex flex-col premium-soccer-bg text-white p-6 justify-between max-w-md mx-auto">
          <div className="space-y-6 pt-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 shadow-lg text-white mx-auto animate-bounce">
              <Trophy className="h-9 w-9" />
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-2xl font-black tracking-tight text-white uppercase font-display">
                PREDICTIONS SOURSPARK
              </h1>
              <p className="text-xs text-slate-200 leading-relaxed max-w-[280px] mx-auto">
                Rejoignez des milliers de parieurs avisés. Bénéficiez des prédictions de football basées sur l'intelligence artificielle.
              </p>
            </div>

            {/* Favorite Selection option */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/60 shadow-sm space-y-3">
              <label className="text-xs font-black text-blue-600 uppercase tracking-wider block text-center">
                Choisissez votre Ligue Favorite :
              </label>
              <div className="grid grid-cols-2 gap-2">
                {LEAGUES_LIST.map((league) => (
                  <button
                    id={`onboarding-fav-${league.id}`}
                    key={league.id}
                    onClick={() => setFavLeague(league.id)}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center gap-1.5 justify-center ${
                      favLeague === league.id
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{league.logo}</span>
                    <span className="truncate">{league.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 pb-8">
            <button
              id="btn-onboarding-start"
              onClick={handleCompleteOnboarding}
              className="w-full rounded-2xl bg-[#1A237E] hover:bg-indigo-900 py-4 text-sm font-black text-white transition-colors uppercase tracking-wider shadow-md"
            >
              COMMENCER LE VOYAGE
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              En continuant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
            </p>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <Navbar
        title={viewTitle}
        cartCount={cartCount}
        notificationCount={unreadNotificationCount}
        onMenuClick={() => setActiveView('more')}
        onCartClick={() => setIsBetSlipOpen((prev) => !prev)}
        onNotificationClick={() => setIsNotificationsOpen((prev) => !prev)}
      />

      {/* DATE STRIP SELECTOR */}
      {['home', 'free', 'best', 'vip', 'htft', 'single', 'btts', 'overunder'].includes(activeView) && !isNotificationsOpen && !isSupportOpen && (
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={(date) => setSelectedDate(date)}
        />
      )}

      {/* MAIN LAYOUT CANVAS CONTAINER */}
      <main className="flex-1 overflow-y-auto pb-24 bg-transparent relative">

        {/* NOTIFICATIONS PANEL HIGHLIGHT OVERLAY */}
        {isNotificationsOpen ? (
          <NotificationPanel
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onClearAll={handleClearNotifications}
            onClose={() => setIsNotificationsOpen(false)}
          />
        ) : isSupportOpen ? (
          /* SUPPORT CHAT OVERLAY */
          <SupportChat
            messages={userSupportMessages}
            onSendMessage={handleSendMessage}
            onBack={() => setIsSupportOpen(false)}
          />
        ) : (
          /* STANDARD VIEWS RENDERING SWITCH */
          <div className="p-4">
            
            {/* SEARCH STRIP */}
            {['home', 'free', 'best', 'vip'].includes(activeView) && (
              <div className="relative mb-4">
                <Search className="absolute top-3.5 left-4 h-4 w-4 text-slate-400" />
                <input
                  id="main-search-input"
                  type="text"
                  placeholder="Rechercher des équipes, ligues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white text-slate-800 rounded-2xl py-3 pl-11 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-200/80 shadow-sm placeholder-slate-400"
                />
              </div>
            )}

            {/* 1. HOME SCREEN */}
            {activeView === 'home' && (
              <div className="space-y-4">
                {/* Featured competition banner at top of Dashboard */}
                <div className="rounded-3xl bg-white text-slate-800 p-5 border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                      Conseil Vedette
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-medium">
                      Cote Elevée AI
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Arsenal vs Chelsea
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Nos modèles prévoient une domination d'Arsenal à domicile. BTTS est également très probable.
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-xs text-slate-500 font-semibold">Prediction: Victoire Arsenal (1)</span>
                    <span className="text-xs font-bold text-indigo-600">Cote: 1.85</span>
                  </div>
                </div>

                {/* Horizontal list of competition filters */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 px-1">
                    Compétitions Majeures
                  </h4>
                  <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                    <button
                      id="btn-league-filter-all"
                      onClick={() => setSelectedLeagueId('all')}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border ${
                        selectedLeagueId === 'all'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-100'
                      }`}
                    >
                      🌍 Toutes
                    </button>
                    {LEAGUES_LIST.map((league) => (
                      <button
                        id={`btn-league-filter-${league.id}`}
                        key={league.id}
                        onClick={() => setSelectedLeagueId(league.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                          selectedLeagueId === league.id
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-100'
                        }`}
                      >
                        <span>{league.logo}</span>
                        <span>{league.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Match Lists */}
                {selectedLeagueId !== 'all' ? (
                  /* PREMIUM DETAILED VIRTUAL LEAGUE SYSTEM */
                  <div className="space-y-4">
                    {/* BARRE SUPÉRIEURE (Tabs: Résultats, Matchs, Classement) */}
                    <div className="flex bg-white rounded-2xl p-1 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                      {(['results', 'matches', 'standings'] as const).map((tab) => {
                        const labels = {
                          results: '🏆 Résultats',
                          matches: '⚽ Matchs',
                          standings: '📊 Classement'
                        };
                        const isActive = selectedLeagueTab === tab;
                        return (
                          <button
                            key={tab}
                            id={`btn-league-tab-${tab}`}
                            onClick={() => setSelectedLeagueTab(tab)}
                            className={`flex-1 text-center py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-wider ${
                              isActive
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                          >
                            {labels[tab]}
                          </button>
                        );
                      })}
                    </div>

                    {/* BARRE DES HORAIRES (Timetable) - only if tab is 'matches' */}
                    {selectedLeagueTab === 'matches' && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">
                          Heures Virtuelles (Journées de Match)
                        </span>
                        
                        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 pt-1 px-1">
                          {currentVirtualTimes.map((item, index) => {
                            const isSelected = selectedHourIndex === index;
                            return (
                              <button
                                key={index}
                                id={`btn-hour-pill-${index}`}
                                onClick={() => setSelectedHourIndex(index)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 shadow-sm ${
                                  item.isActive
                                    ? 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/20' // Active hour is in RED!
                                    : isSelected
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50/80'
                                }`}
                              >
                                {item.isActive && (
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                  </span>
                                )}
                                <span className={item.isActive ? "font-black" : "font-semibold"}>{item.time}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* CONTENT DISPLAY BASED ON ACTIVE TAB */}
                    {selectedLeagueTab === 'matches' && (
                      <div className="space-y-3">
                        {(() => {
                          // Get all matches for this league
                          const leagueMatches = matches.filter(m => m.leagueId === selectedLeagueId);
                          
                          // Determine the rounds/days available
                          const rounds = Array.from(new Set(leagueMatches.map(m => m.round))).sort();
                          
                          if (rounds.length === 0) {
                            return (
                              <div className="text-center py-12 text-slate-400 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                                <HelpCircle className="h-8 w-8 mx-auto opacity-30 mb-2" />
                                <p className="text-xs font-bold">Aucun match trouvé pour cette compétition</p>
                              </div>
                            );
                          }

                          // Map selectedHourIndex (0-8) to available rounds
                          const roundIndex = Math.min(Math.floor(selectedHourIndex / 3), rounds.length - 1);
                          const activeRound = rounds[roundIndex];
                          
                          // Filter matches for this round
                          const roundMatches = leagueMatches.filter(m => m.round === activeRound);
                          
                          // Decide if we should render them as Live or Pending or FT based on the timetable
                          const selectedTimeItem = currentVirtualTimes[selectedHourIndex];

                          return (
                            <div className="space-y-3">
                              <div className="flex justify-between items-center px-1">
                                <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wide">
                                  {activeRound}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-xl">
                                  Session: {selectedTimeItem?.time}
                                </span>
                              </div>

                              {roundMatches.map((m) => {
                                // Dynamically adjust match status based on if past, current, or future
                                const simulatedMatch = { ...m };
                                if (selectedTimeItem?.isActive) {
                                  simulatedMatch.matchStatus = 'LIVE';
                                  simulatedMatch.liveMinute = 45;
                                } else if (selectedTimeItem?.isPast) {
                                  simulatedMatch.matchStatus = 'FT';
                                } else {
                                  simulatedMatch.matchStatus = 'Pending';
                                  simulatedMatch.finalScoreHome = null;
                                  simulatedMatch.finalScoreAway = null;
                                }

                                return (
                                  <MatchCard
                                    key={m.id}
                                    match={simulatedMatch}
                                    layout="odds"
                                    onBetClick={handleBetClick}
                                    selectedBet={betSlip.find((b) => b.matchId === m.id)?.choice}
                                  />
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {selectedLeagueTab === 'results' && (
                      <div className="space-y-3">
                        {(() => {
                          const completedMatches = matches.filter(
                            (m) => m.leagueId === selectedLeagueId && m.matchStatus === 'FT'
                          );

                          if (completedMatches.length === 0) {
                            return (
                              <div className="text-center py-12 text-slate-400 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                                <Trophy className="h-8 w-8 mx-auto opacity-30 mb-2" />
                                <p className="text-xs font-bold">Aucun résultat disponible pour le moment</p>
                              </div>
                            );
                          }

                          return completedMatches.map((m) => (
                            <MatchCard
                              key={m.id}
                              match={m}
                              layout="odds"
                              onBetClick={handleBetClick}
                              selectedBet={betSlip.find((b) => b.matchId === m.id)?.choice}
                            />
                          ));
                        })()}
                      </div>
                    )}

                    {selectedLeagueTab === 'standings' && (
                      <div className="bg-white rounded-3xl border border-slate-100/70 shadow-sm p-4 overflow-hidden">
                        <div className="flex items-center gap-2 mb-4 px-1">
                          <Trophy className="h-4 w-4 text-indigo-600" />
                          <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wide">
                            Classement Général
                          </h4>
                        </div>

                        {standings.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-slate-100 text-[10px] uppercase font-black text-slate-400">
                                  <th className="py-2.5 pl-2 text-center w-8">#</th>
                                  <th className="py-2.5">Équipe</th>
                                  <th className="py-2.5 text-center w-10">MJ</th>
                                  <th className="py-2.5 text-center w-8">G</th>
                                  <th className="py-2.5 text-center w-8">N</th>
                                  <th className="py-2.5 text-center w-8">P</th>
                                  <th className="py-2.5 text-center pr-2 w-12 text-indigo-600">Pts</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {standings.map((team, idx) => {
                                  const flagInfo = getTeamFlagAndColors(team.name);
                                  return (
                                    <tr key={team.name} className="hover:bg-slate-50/50 transition-colors text-xs text-slate-700">
                                      <td className="py-3.5 pl-2 text-center font-bold font-mono text-slate-400">
                                        {idx + 1}
                                      </td>
                                      <td className="py-3.5 font-extrabold flex items-center gap-2 text-slate-900 font-sans">
                                        <span className="text-base select-none filter drop-shadow-sm">{flagInfo.flag}</span>
                                        <span className="truncate">{team.name}</span>
                                      </td>
                                      <td className="py-3.5 text-center font-semibold text-slate-500">{team.played}</td>
                                      <td className="py-3.5 text-center text-slate-500">{team.won}</td>
                                      <td className="py-3.5 text-center text-slate-500">{team.drawn}</td>
                                      <td className="py-3.5 text-center text-slate-500">{team.lost}</td>
                                      <td className="py-3.5 text-center font-black text-indigo-600 pr-2">{team.pts}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-xs text-slate-400">
                            Aucune donnée de classement pour le moment.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* GENERAL HOMEPAGE LISTINGS */
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 px-1">
                      Matchs Disponibles ({displayedMatches.length})
                    </h4>

                    {displayedMatches.length > 0 ? (
                      displayedMatches.map((match) => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          layout="odds"
                          onBetClick={handleBetClick}
                          selectedBet={betSlip.find((b) => b.matchId === match.id)?.choice}
                        />
                      ))
                    ) : (
                      <div className="text-center py-12 text-slate-400">
                        <HelpCircle className="h-8 w-8 mx-auto opacity-30 mb-2" />
                        <p className="text-xs font-bold">Aucun match trouvé pour ce jour</p>
                        <p className="text-[10px] opacity-70">Essayez de changer de date ou de ligue.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 2. FREE TIPS SCREEN */}
            {activeView === 'free' && (
              <div className="space-y-4">
                {/* Active sub-filters (All, Won, Lost) */}
                <div className="flex gap-2 bg-slate-200/60 p-1.5 rounded-2xl border border-slate-200">
                  {['All', 'Pending', 'Won', 'Lost'].map((tab) => (
                    <button
                      id={`btn-free-subfilter-${tab}`}
                      key={tab}
                      onClick={() => setFreeSubFilter(tab as any)}
                      className={`flex-1 text-[11px] font-bold py-1.5 rounded-xl transition-all ${
                        freeSubFilter === tab
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Display Free tips matching requirements */}
                <div className="space-y-3">
                  {matches.filter((match) => {
                    const matchesDate = selectedDate === 'all_future' ? match.date >= '2026-06-30' : match.date === selectedDate;
                    if (!matchesDate) return false;
                    if (!match.predictions.isFree) return false;
                    if (freeSubFilter !== 'All' && match.predictions.status !== freeSubFilter) return false;
                    return true;
                  }).map((match) => (
                    <MatchCard key={match.id} match={match} layout="tip" />
                  ))}

                  {matches.filter((match) => {
                    const matchesDate = selectedDate === 'all_future' ? match.date >= '2026-06-30' : match.date === selectedDate;
                    if (!matchesDate) return false;
                    if (!match.predictions.isFree) return false;
                    if (freeSubFilter !== 'All' && match.predictions.status !== freeSubFilter) return false;
                    return true;
                  }).length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                      <CheckCircle className="h-8 w-8 mx-auto opacity-30 mb-2" />
                      <p className="text-xs font-bold">Aucun conseil gratuit disponible</p>
                      <p className="text-[10px] opacity-70">Aucune prédiction pour cette catégorie et cette date.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. BEST TIPS SCREEN */}
            {activeView === 'best' && (
              <div className="space-y-4">
                <div className="rounded-3xl bg-amber-50 p-4 border border-amber-200 flex gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div>
                    <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                      Success Rate &gt; 85%
                    </h4>
                    <p className="text-[10px] text-amber-800 leading-relaxed mt-0.5">
                      Conseils de pari hautement filtrés et analysés scientifiquement à l'aide d'algorithmes prédictifs profonds.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {matches.filter((match) => (selectedDate === 'all_future' ? match.date >= '2026-06-30' : match.date === selectedDate) && match.predictions.isBest).map(
                    (match) => (
                      <MatchCard key={match.id} match={match} layout="tip" />
                    )
                  )}

                  {matches.filter((match) => (selectedDate === 'all_future' ? match.date >= '2026-06-30' : match.date === selectedDate) && match.predictions.isBest)
                    .length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                      <HelpCircle className="h-8 w-8 mx-auto opacity-30 mb-2" />
                      <p className="text-xs font-bold">Pas de conseils Best aujourd'hui</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. VIP TIPS SCREEN */}
            {activeView === 'vip' && (
              <div className="space-y-4">
                {/* Premium Banner */}
                {!isVipSubscribed && (
                  <div className="rounded-3xl bg-white text-slate-800 p-6 border border-slate-100 shadow-sm text-center space-y-3.5">
                    <Crown className="h-10 w-10 text-amber-500 mx-auto animate-pulse" />
                    <div>
                      <h3 className="text-base font-extrabold uppercase tracking-tight text-slate-900">
                        Espace Premium VIP
                      </h3>
                      <p className="text-[11px] text-slate-500 max-w-[280px] mx-auto mt-1 leading-relaxed">
                        Accédez de manière illimitée à tous nos conseils haut de gamme avec des cotes fantastiques.
                      </p>
                    </div>
                    <button
                      id="btn-vip-upgrade-now"
                      onClick={() => setIsVipModalOpen(true)}
                      className="rounded-2xl bg-[#1A237E] hover:bg-indigo-900 px-5 py-3 text-xs font-bold text-white transition-colors uppercase tracking-wider shadow-sm"
                    >
                      DÉBLOQUER TOUS LES PRONOSTICS VIP
                    </button>
                  </div>
                )}

                {/* List of VIP matches */}
                <div className="space-y-3">
                  {matches.filter((match) => (selectedDate === 'all_future' ? match.date >= '2026-06-30' : match.date === selectedDate) && match.predictions.isVip).map(
                    (match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        layout="tip"
                        isVipLocked={!isVipSubscribed}
                        onUnlockVip={() => setIsVipModalOpen(true)}
                      />
                    )
                  )}
                </div>
              </div>
            )}

            {/* 5. HT-FT SCREEN */}
            {activeView === 'htft' && (
              <div className="space-y-3">
                {matches.filter((match) => selectedDate === 'all_future' ? match.date >= '2026-06-30' : match.date === selectedDate).map((match) => (
                  <div key={match.id} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 border-b border-slate-100 pb-2 mb-2">
                      <span>{match.leagueName}</span>
                      <span>{match.matchTime}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>{match.homeTeam}</span>
                      <span className="text-slate-400">vs</span>
                      <span>{match.awayTeam}</span>
                    </div>
                    <div className="mt-3 flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <span className="font-extrabold text-blue-600">HT/FT Tip:</span>
                        <span className="font-bold">{match.predictions.htFt}</span>
                      </div>
                      <span className="rounded-lg bg-emerald-500 text-white font-black px-2 py-1 text-xs">
                        {match.predictions.htFtOdds.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 6. SINGLE TIPS SCREEN */}
            {activeView === 'single' && (
              <div className="space-y-3">
                {matches.filter((match) => selectedDate === 'all_future' ? match.date >= '2026-06-30' : match.date === selectedDate).map((match) => (
                  <MatchCard key={match.id} match={match} layout="tip" />
                ))}
              </div>
            )}

            {/* 7. BTTS SCREEN */}
            {activeView === 'btts' && (
              <div className="space-y-3">
                {matches.filter((match) => selectedDate === 'all_future' ? match.date >= '2026-06-30' : match.date === selectedDate).map((match) => (
                  <MatchCard key={match.id} match={match} layout="odds" />
                ))}
              </div>
            )}

            {/* 8. OVER-UNDER SCREEN */}
            {activeView === 'overunder' && (
              <div className="space-y-3">
                {matches.filter((match) => selectedDate === 'all_future' ? match.date >= '2026-06-30' : match.date === selectedDate).map((match) => (
                  <div key={match.id} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 border-b border-slate-100 pb-2 mb-2">
                      <span>{match.leagueName}</span>
                      <span>{match.matchTime}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>{match.homeTeam}</span>
                      <span className="text-slate-400">vs</span>
                      <span>{match.awayTeam}</span>
                    </div>
                    <div className="mt-3 flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <span className="font-extrabold text-blue-600">Over/Under 2.5:</span>
                        <span className="font-bold">{match.predictions.overUnder25}</span>
                      </div>
                      <span className="rounded-lg bg-[#fbbf24] text-[#112240] font-black px-2 py-1 text-xs">
                        {match.predictions.overUnderOdds.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 8.5 LIVE TOP SIGNALS & ANNOUNCEMENTS SCREEN */}
            {activeView === 'live-top' && (
              <div className="space-y-6">
                {selectedSignal ? (
                  /* DETAILED PUBLICATION VIEW */
                  <div className="bg-[#0E1324] border border-slate-800 rounded-3xl p-5 md:p-6 space-y-6 animate-fade-in text-white shadow-xl relative overflow-hidden">
                    {/* Background glow */}
                    <div className="absolute top-0 right-0 p-16 bg-indigo-500/10 rounded-full blur-2xl translate-x-8 -translate-y-8 pointer-events-none" />

                    {/* Back header */}
                    <div className="flex items-center justify-between relative z-10 border-b border-slate-800 pb-4">
                      <button
                        onClick={() => setSelectedSignal(null)}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-all bg-slate-950/60 hover:bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 cursor-pointer shadow-md"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Retour aux publications</span>
                      </button>

                      <span className="text-[9px] font-black uppercase text-indigo-400 flex items-center gap-1 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                        🏆 PUBLICATION DÉTAILLÉE V2
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2 relative z-10">
                      {/* Left side: Premium Poster Card */}
                      <div className="md:col-span-5 flex flex-col items-center justify-center">
                        <PremiumPoster
                          title={selectedSignal.title}
                          time={selectedSignal.timestamp.split(' ')[1] || '14:56'}
                          matches={selectedSignal.parsedMatches || []}
                        />
                      </div>

                      {/* Right side: Social Reactions & Details */}
                      <div className="md:col-span-7 space-y-5 flex flex-col justify-between">
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between items-baseline mb-1">
                              <span className={`text-[10px] font-extrabold uppercase ${selectedSignal.isPremium ? 'text-amber-500 flex items-center gap-1' : 'text-blue-400'}`}>
                                {selectedSignal.isPremium ? <><Crown className="h-3 w-3 fill-current" /> SOURSPARK PREMIUM VIP</> : '📡 SIGNAL GRATUIT'}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono font-bold">{selectedSignal.timestamp}</span>
                            </div>
                            <h3 className="text-lg font-black text-white tracking-tight leading-snug">
                              {selectedSignal.title}
                            </h3>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed font-medium bg-slate-950/40 border border-slate-850 p-4 rounded-2xl whitespace-pre-line">
                            {selectedSignal.content || "Faites l'expérience du nouveau format de publication Premium de Sourspark, conçu de manière professionnelle pour vous offrir le maximum d'efficacité."}
                          </p>

                          {/* Facebook-style reactions drawer */}
                          <div className="border-t border-b border-slate-800/60 py-4 space-y-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">
                              Réactions :
                            </span>
                            
                            <div className="flex flex-wrap items-center gap-2">
                              {[
                                { type: 'like' as const, emoji: '👍', label: 'J\'aime', color: 'hover:bg-blue-500/10 hover:border-blue-500/30 text-blue-400' },
                                { type: 'love' as const, emoji: '❤️', label: 'J\'adore', color: 'hover:bg-rose-500/10 hover:border-rose-500/30 text-rose-400' },
                                { type: 'fire' as const, emoji: '🔥', label: 'Excellent', color: 'hover:bg-amber-500/10 hover:border-amber-500/30 text-amber-400' },
                                { type: 'clap' as const, emoji: '👏', label: 'Bravo', color: 'hover:bg-emerald-500/10 hover:border-emerald-500/30 text-emerald-400' },
                                { type: 'wow' as const, emoji: '😮', label: 'Wow', color: 'hover:bg-indigo-500/10 hover:border-indigo-500/30 text-indigo-400' },
                              ].map((react) => {
                                const count = (selectedSignal.reactions && selectedSignal.reactions[react.type]) || 0;
                                return (
                                  <button
                                    key={react.type}
                                    onClick={() => handleReactToSignal(selectedSignal.id, react.type)}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-800 bg-slate-950/50 hover:scale-105 active:scale-95 transition-all text-xs font-black cursor-pointer hover:border-slate-700 text-slate-300"
                                  >
                                    <span className="text-sm">{react.emoji}</span>
                                    <span className="text-[10px] text-slate-400">{count}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Share section */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.origin + "?signal=" + selectedSignal.id);
                              alert("Lien de partage copié dans le presse-papiers !");
                            }}
                            className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 py-3 font-black rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest transition-all shadow-md cursor-pointer"
                          >
                            <Share2 className="h-4 w-4" /> Partager ce prono
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Comments section */}
                    <div className="border-t border-slate-800/80 pt-5 space-y-4">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="h-4 w-4 text-indigo-400" />
                        Commentaires ({selectedSignal.comments?.length || 0})
                      </h4>

                      {/* Comment Input */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleAddComment(selectedSignal.id, commentText);
                        }}
                        className="flex gap-2"
                      >
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Écrivez un commentaire public..."
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="submit"
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </form>

                      {/* Comments Loop */}
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {(selectedSignal.comments || []).map((comment) => (
                          <div key={comment.id} className="space-y-2 bg-slate-950/40 border border-slate-850 p-4 rounded-2xl">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-black text-xs text-indigo-400 border border-slate-700">
                                  {comment.authorName[0]?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <span className="font-extrabold text-white text-xs block">
                                    {comment.authorName}
                                    {comment.authorRole === 'admin' && (
                                      <span className="ml-1.5 text-[8px] uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-black inline-block">
                                        ADMIN
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-[9px] text-slate-500 font-mono">{comment.timestamp}</span>
                                </div>
                              </div>

                              {isAdminAuthenticated && (
                                <button
                                  onClick={() => handleDeleteCommentOrReply(selectedSignal.id, comment.id)}
                                  className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition-all cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>

                            <p className="text-xs text-slate-300 font-medium pl-10 leading-relaxed">{comment.text}</p>

                            <div className="pl-10 flex items-center gap-3">
                              <button
                                onClick={() => setReplyingCommentId(replyingCommentId === comment.id ? null : comment.id)}
                                className="text-[9px] font-black uppercase text-indigo-400 hover:text-indigo-300 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <CornerDownRight className="h-3 w-3" /> Répondre
                              </button>
                            </div>

                            {/* Replies */}
                            {(comment.replies || []).length > 0 && (
                              <div className="pl-10 space-y-3 pt-2 border-l border-slate-850/80 ml-4">
                                {comment.replies?.map((reply) => (
                                  <div key={reply.id} className="space-y-1 bg-slate-950/20 p-3 rounded-xl border border-slate-850/40">
                                    <div className="flex justify-between items-start">
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center font-black text-[9px] text-amber-400 border border-slate-800">
                                          {reply.authorName[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <span className="font-extrabold text-white text-[10px]">
                                          {reply.authorName}
                                          {reply.authorRole === 'admin' && (
                                            <span className="ml-1 text-[7px] uppercase bg-rose-500/10 text-rose-400 px-1 rounded font-black">
                                              ADMIN
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                      
                                      {isAdminAuthenticated && (
                                        <button
                                          onClick={() => handleDeleteCommentOrReply(selectedSignal.id, comment.id, reply.id)}
                                          className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-all cursor-pointer"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-300 pl-6.5 leading-relaxed">{reply.text}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Nested Reply Form */}
                            {replyingCommentId === comment.id && (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  handleAddReply(selectedSignal.id, comment.id, replyText);
                                }}
                                className="pl-10 flex gap-2 pt-2 animate-fade-in"
                              >
                                <input
                                  type="text"
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Écrivez une réponse..."
                                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-[11px] focus:outline-none focus:border-indigo-500"
                                />
                                <button
                                  type="submit"
                                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                                >
                                  <Send className="h-3 w-3" />
                                </button>
                              </form>
                            )}
                          </div>
                        ))}

                        {(selectedSignal.comments || []).length === 0 && (
                          <p className="text-center py-6 text-xs text-slate-500">Aucun commentaire pour le moment.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* LIST OF PUBLICATIONS SPLIT VIEW */
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in">
                    
                    {/* Left Column: Announcements & Main Featured Poster */}
                    <div className="md:col-span-7 space-y-5">
                      {/* Announcements */}
                      <div className="space-y-3">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-1 flex items-center gap-1">
                          <Megaphone className="h-3.5 w-3.5 text-amber-500 animate-bounce" /> Annonces Officielles
                        </span>
                        {liveSignals.filter(s => s.type === 'announcement').map((ann) => (
                          <div key={ann.id} className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-5 border border-slate-800 shadow-md">
                            <div className="absolute top-0 right-0 p-8 bg-indigo-500/10 rounded-full blur-xl translate-x-8 -translate-y-8" />
                            <div className="flex justify-between items-baseline mb-2">
                              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300">ADMINISTRATEUR</span>
                              <span className="text-[9px] text-indigo-400 font-mono font-bold">{ann.timestamp}</span>
                            </div>
                            <h4 className="text-sm font-black tracking-tight mb-1">{ann.title}</h4>
                            <p className="text-xs text-indigo-200/90 leading-relaxed font-medium">{ann.content}</p>
                          </div>
                        ))}
                        {liveSignals.filter(s => s.type === 'announcement').length === 0 && (
                          <div className="p-4 bg-white rounded-3xl border border-slate-100 text-center text-xs text-slate-400">
                            Aucune annonce officielle pour le moment.
                          </div>
                        )}
                      </div>

                      {/* Main Featured Signal Poster */}
                      <div className="space-y-3 pt-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-1 flex items-center gap-1">
                          <Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse" /> Publication Récente
                        </span>

                        {(() => {
                          const nonAnnouncements = liveSignals.filter(s => s.type === 'signal');
                          if (nonAnnouncements.length === 0) {
                            return (
                              <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-100">
                                Aucun signal de match en direct disponible.
                              </div>
                            );
                          }
                          
                          // Let's take the first non-announcement (most recent)
                          const mainSig = nonAnnouncements[0];
                          const isLocked = mainSig.isPremium && !isVipSubscribed;

                          if (isLocked) {
                            return (
                              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden space-y-3">
                                <div className="flex justify-between items-baseline mb-2 select-none filter blur-[1px]">
                                  <span className="text-[10px] font-extrabold uppercase text-amber-500 flex items-center gap-1">
                                    <Crown className="h-3 w-3 fill-current" /> SIGNAL VIP PREMIUM
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-mono font-bold">{mainSig.timestamp}</span>
                                </div>
                                <h4 className="text-sm font-black text-slate-900 tracking-tight leading-snug select-none filter blur-[4px]">
                                  {mainSig.title}
                                </h4>
                                
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/30 border border-indigo-100 text-center space-y-2 mt-2">
                                  <Crown className="h-6 w-6 text-amber-500 mx-auto animate-bounce" />
                                  <h5 className="text-xs font-black text-[#1A237E] uppercase tracking-wider">Pronostic VIP Verrouillé</h5>
                                  <p className="text-[10px] text-slate-500 leading-relaxed max-w-[280px] mx-auto">
                                    Ce signal exclusif en direct est réservé aux membres VIP Premium de Sourspark.
                                  </p>
                                  <button
                                    onClick={() => setIsVipModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-black text-white transition-all shadow-md uppercase tracking-wider focus:outline-none cursor-pointer"
                                  >
                                    Débloquer l'accès (30,000 MGA)
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          // If unlocked, render a gorgeous poster element!
                          return (
                            <div 
                              onClick={() => setSelectedSignal(mainSig)}
                              className="bg-[#0b1227] hover:bg-[#0f1936] text-white rounded-3xl p-5 border border-slate-800 shadow-xl relative overflow-hidden transition-all transform hover:-translate-y-1 cursor-pointer group space-y-4"
                            >
                              <div className="absolute top-0 right-0 p-12 bg-amber-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/15 transition-all" />
                              
                              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <span className="text-[9px] font-extrabold uppercase text-amber-400 flex items-center gap-1">
                                  <Crown className="h-3.5 w-3.5 fill-current" /> SOURSPARK PREMIUM VIP
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono font-bold">{mainSig.timestamp}</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                                <div className="sm:col-span-5 flex justify-center">
                                  <div className="transform scale-95 group-hover:scale-100 transition-all duration-300">
                                    <PremiumPoster
                                      title={mainSig.title}
                                      time={mainSig.timestamp.split(' ')[1] || '14:56'}
                                      matches={mainSig.parsedMatches || []}
                                    />
                                  </div>
                                </div>

                                <div className="sm:col-span-7 space-y-3">
                                  <h4 className="text-base font-black tracking-tight text-white leading-snug group-hover:text-amber-400 transition-all">
                                    {mainSig.title}
                                  </h4>
                                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                                    {mainSig.content || "Cliquez sur cette publication pour voir l'analyse complète, réagir en temps réel, commenter et échanger des conseils avec les autres membres VIP."}
                                  </p>
                                  
                                  {/* Interaction Summary footer */}
                                  <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold pt-2 border-t border-slate-800/60">
                                    <span className="flex items-center gap-1.5">
                                      👍 {(Object.values(mainSig.reactions || {}) as number[]).reduce((a, b) => a + b, 0)} réactions
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1.5">
                                      💬 {mainSig.comments?.length || 0} commentaires
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Right Column: "TOUS LES TOPS" (Historic list) */}
                    <div className="md:col-span-5 space-y-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-1 flex items-center gap-1">
                        <Trophy className="h-3.5 w-3.5 text-amber-500" /> TOUS LES TOPS ({liveSignals.filter(s => s.type === 'signal').length})
                      </span>
                      
                      <div className="bg-white rounded-3xl border border-slate-100 p-4 space-y-3 max-h-[500px] overflow-y-auto pr-1 shadow-sm custom-scrollbar">
                        {liveSignals.filter(s => s.type === 'signal').map((sig) => {
                          const totalReactions = (Object.values(sig.reactions || {}) as number[]).reduce((a, b) => a + b, 0);
                          const totalComments = sig.comments?.length || 0;
                          const isSigLocked = sig.isPremium && !isVipSubscribed;

                          return (
                            <div
                              key={sig.id}
                              onClick={() => setSelectedSignal(sig)}
                              onMouseEnter={() => setHoveredSignalId(sig.id)}
                              onMouseLeave={() => setHoveredSignalId(null)}
                              className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-100 hover:border-slate-200 rounded-2xl transition-all cursor-pointer flex justify-between items-center gap-3 relative overflow-hidden group"
                            >
                              {/* Left details */}
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <Trophy className={`h-3.5 w-3.5 shrink-0 ${isSigLocked ? 'text-slate-400' : 'text-amber-500 animate-pulse'}`} />
                                  <span className="font-extrabold text-slate-800 text-[11px] truncate block">
                                    {sig.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[9px] text-slate-400 font-mono">
                                  <span>{sig.timestamp}</span>
                                  <span>•</span>
                                  {isSigLocked ? (
                                    <span className="text-amber-500 font-extrabold uppercase flex items-center gap-0.5">
                                      <Crown className="h-2.5 w-2.5 fill-current" /> VIP
                                    </span>
                                  ) : (
                                    <span className="text-slate-500">
                                      👍 {totalReactions}  💬 {totalComments}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Right thumbnail preview of flags */}
                              <div className="w-16 h-12 bg-[#0b1227] rounded-xl border border-amber-500/10 flex items-center justify-center shrink-0 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-40" />
                                {isSigLocked ? (
                                  <Crown className="h-4 w-4 text-amber-500" />
                                ) : (
                                  <div className="flex gap-0.5 items-center justify-center">
                                    {sig.parsedMatches?.slice(0, 2).map((pm, i) => (
                                      <span key={i} className="text-xs">{pm.homeFlag}</span>
                                    ))}
                                    {sig.parsedMatches && sig.parsedMatches.length > 2 && (
                                      <span className="text-[7px] text-amber-400 font-bold ml-0.5">+{sig.parsedMatches.length - 2}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {liveSignals.filter(s => s.type === 'signal').length === 0 && (
                          <p className="text-center py-8 text-xs text-slate-400">Aucune publication d'historique disponible.</p>
                        )}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* 9. LIVE TIPS / SCORE SCREEN */}
            {activeView === 'live' && (
              <div className="space-y-4">
                <div className="flex rounded-2xl bg-slate-200 p-1 border border-slate-300/60">
                  <button
                    id="btn-live-subview-scores"
                    onClick={() => setActiveView('live-scores')}
                    className="flex-1 text-center py-2 text-xs font-bold rounded-xl bg-white text-slate-900 shadow-sm"
                  >
                    🏆 Live Scores
                  </button>
                  <button
                    id="btn-live-subview-tips"
                    onClick={() => setActiveView('live-tips')}
                    className="flex-1 text-center py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    ⚡ Live Tips
                  </button>
                </div>

                <div className="space-y-3">
                  {matches.filter((match) => match.matchStatus === 'LIVE').map((match) => (
                    <MatchCard key={match.id} match={match} layout="odds" />
                  ))}

                  {matches.filter((match) => match.matchStatus === 'LIVE').length === 0 && (
                    <div className="text-center py-12 text-slate-400 bg-white rounded-3xl border border-slate-100 p-6">
                      <Activity className="h-8 w-8 mx-auto opacity-30 mb-2 text-emerald-500 animate-pulse" />
                      <p className="text-xs font-bold">Pas de matchs en direct actuellement</p>
                      <p className="text-[10px] opacity-70">Consultez l'historique ou attendez la prochaine session.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeView === 'live-scores' && (
              <div className="space-y-4">
                <div className="flex rounded-2xl bg-slate-200 p-1 border border-slate-300/60">
                  <button
                    id="btn-livescores-scores"
                    onClick={() => setActiveView('live-scores')}
                    className="flex-1 text-center py-2 text-xs font-bold rounded-xl bg-white text-slate-900 shadow-sm"
                  >
                    🏆 Live Scores
                  </button>
                  <button
                    id="btn-livescores-tips"
                    onClick={() => setActiveView('live-tips')}
                    className="flex-1 text-center py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    ⚡ Live Tips
                  </button>
                </div>

                <div className="space-y-3">
                  {matches.filter((match) => match.matchStatus === 'LIVE' || match.matchStatus === 'FT').map(
                    (match) => (
                      <MatchCard key={match.id} match={match} layout="odds" />
                    )
                  )}
                </div>
              </div>
            )}

            {activeView === 'live-tips' && (
              <div className="space-y-4">
                <div className="flex rounded-2xl bg-slate-200 p-1 border border-slate-300/60">
                  <button
                    id="btn-livetips-scores"
                    onClick={() => setActiveView('live-scores')}
                    className="flex-1 text-center py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    🏆 Live Scores
                  </button>
                  <button
                    id="btn-livetips-tips"
                    onClick={() => setActiveView('live-tips')}
                    className="flex-1 text-center py-2 text-xs font-bold rounded-xl bg-white text-slate-900 shadow-sm"
                  >
                    ⚡ Live Tips
                  </button>
                </div>

                <div className="space-y-3">
                  {matches.filter((match) => match.matchStatus === 'LIVE').map((match) => (
                    <div key={match.id} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-md">
                      <div className="flex justify-between items-center text-[10px] font-bold text-red-600 animate-pulse pb-2 mb-2 border-b border-slate-100">
                        <span>🔴 EN DIRECT - {match.liveMinute}'</span>
                        <span>Cote Dynamic</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800">
                        {match.homeTeam} {match.finalScoreHome} : {match.finalScoreAway} {match.awayTeam}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Notre algorithme prédit une forte probabilité de buts supplémentaires.
                      </p>
                      <div className="mt-3 bg-red-50 p-2.5 rounded-xl flex justify-between items-center">
                        <span className="text-xs font-extrabold text-red-800">Direct Tip: Plus de 0.5 But</span>
                        <span className="rounded bg-red-600 text-white font-mono font-bold px-2 py-0.5 text-xs">
                          1.42
                        </span>
                      </div>
                    </div>
                  ))}

                  {matches.filter((match) => match.matchStatus === 'LIVE').length === 0 && (
                    <div className="text-center py-12 text-slate-400 bg-white rounded-3xl p-6">
                      <Zap className="h-8 w-8 mx-auto opacity-30 mb-2" />
                      <p className="text-xs font-bold">Pas d'opportunités en direct</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 10. TERMS & CONDITIONS SCREEN */}
            {activeView === 'terms' && (
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md space-y-4 text-xs text-slate-600 leading-relaxed">
                <h3 className="text-sm font-black text-slate-900 uppercase">Conditions d'utilisation</h3>
                <p>
                  Bienvenue sur l'application de predictions Sourspark. En téléchargeant et en accédant à nos services, vous acceptez sans réserve les conditions générales ci-dessous.
                </p>
                <h4 className="font-bold text-slate-800 mt-2">1. Responsabilité des paris</h4>
                <p>
                  Tous les conseils de paris et prévisions sportifs fournis sur notre plateforme sont à titre informatif uniquement. Nous ne garantissons aucun résultat financier et déclinons toute responsabilité en cas de pertes subies.
                </p>
                <h4 className="font-bold text-slate-800 mt-2">2. Accès Premium VIP</h4>
                <p>
                  L'accès VIP nécessite un abonnement valide renouvelable automatiquement. L'accès peut être annulé par l'utilisateur à tout moment via son compte de paiement.
                </p>
                <button
                  id="btn-terms-back"
                  onClick={() => setActiveView('more')}
                  className="w-full mt-4 rounded-xl bg-slate-800 text-white py-2.5 font-bold"
                >
                  Retour
                </button>
              </div>
            )}

            {/* 11. PRIVACY POLICY SCREEN */}
            {activeView === 'privacy' && (
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md space-y-4 text-xs text-slate-600 leading-relaxed">
                <h3 className="text-sm font-black text-slate-900 uppercase">Politique de confidentialité</h3>
                <p>
                  La protection de vos données personnelles est au cœur de nos priorités. Nous ne partageons aucune information personnelle avec des tiers à des fins marketing.
                </p>
                <h4 className="font-bold text-slate-800 mt-2">Données collectées</h4>
                <p>
                  Nous collections uniquement des données d'usage anonymes afin d'améliorer la rapidité et la pertinence de nos algorithmes de prédiction par IA.
                </p>
                <button
                  id="btn-privacy-back"
                  onClick={() => setActiveView('more')}
                  className="w-full mt-4 rounded-xl bg-slate-800 text-white py-2.5 font-bold"
                >
                  Retour
                </button>
              </div>
            )}

            {/* 12. PROFILE SCREEN */}
            {activeView === 'profile' && (
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md space-y-4 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e0f2fe] text-blue-600 mx-auto font-black text-xl shadow-inner">
                  {currentUser?.username ? currentUser.username.slice(0, 2).toUpperCase() : 'US'}
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">{currentUser?.username || 'Utilisateur'}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{currentUser?.phoneNumber || ''}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Membre depuis Juin 2026</p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2 border border-slate-100">
                  <div className="flex justify-between items-center text-xs text-slate-600 py-1 border-b border-slate-100/50">
                    <span>Statut VIP:</span>
                    <span className={`font-bold uppercase ${isVipSubscribed ? 'text-amber-500' : 'text-slate-400'}`}>
                      {isVipSubscribed ? 'Premium Actif' : 'Gratuit'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-600 py-1 border-b border-slate-100/50">
                    <span>Solde Live TOP:</span>
                    <span className="font-bold text-emerald-600 font-mono">
                      {(currentUser?.soldeLiveTop || 0).toLocaleString('fr-FR')} Ar
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-600 py-1">
                    <span>Ligue Favorite:</span>
                    <span className="font-bold uppercase">{favLeague} League</span>
                  </div>

                  {(currentUser?.soldeLiveTop || 0) > 0 && currentUser?.sigExpirationDate && (
                    <div className="text-[10px] text-slate-400 bg-emerald-50/50 p-2.5 rounded-xl text-left mt-2 border border-emerald-100/30 flex flex-col gap-0.5">
                      <div className="flex justify-between text-slate-600 font-medium">
                        <span>Expiration Live TOP:</span>
                        <span className="font-extrabold text-slate-800">
                          {new Date(currentUser.sigExpirationDate).toLocaleString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600 font-medium mt-0.5">
                        <span>Accès Activé:</span>
                        <span className="font-extrabold text-emerald-600 uppercase tracking-wide">
                          ACTIF (Signaux débloqués)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  id="btn-profile-back"
                  onClick={() => setActiveView('more')}
                  className="w-full mt-4 rounded-xl bg-slate-800 text-white py-2.5 font-bold"
                >
                  Retour
                </button>
              </div>
            )}

            {/* 12.5 ANALYSE PREMIUM */}
            {activeView === 'analyse-premium' && (
              <AnalysePremium onBack={() => setActiveView('more')} />
            )}

            {/* 13. MORE MENU */}
            {activeView === 'more' && (
              <MoreSheet
                onClose={() => setActiveView('home')}
                onNavigateToView={(view) => setActiveView(view)}
                onResetOnboarding={handleResetOnboarding}
                onLogout={handleLogout}
                onOpenSupport={() => setIsSupportOpen(true)}
                onOpenPremium={() => setIsVipModalOpen(true)}
                onOpenAdmin={handleOpenAdmin}
                currentUser={currentUser}
                isAdminAuthenticated={isAdminAuthenticated}
              />
            )}

          </div>
        )}
      </main>

      {/* BET SLIP / SHOPPING CART OVERLAY SHEET */}
      {isBetSlipOpen && (
        <div className="absolute bottom-16 left-0 right-0 z-40 bg-white border-t border-slate-200 rounded-t-3xl shadow-2xl p-4 animate-in slide-in-from-bottom duration-200">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Calculator className="h-4 w-4 text-blue-600" />
              Billet de Pari ({betSlip.length})
            </h3>
            <button
              id="btn-betslip-close"
              onClick={() => setIsBetSlipOpen(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Fermer
            </button>
          </div>

          {betSlip.length > 0 ? (
            <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
              {betSlip.map((item) => {
                const matchObj = matches.find((m) => m.id === item.matchId);
                if (!matchObj) return null;
                return (
                  <div key={item.matchId} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">
                        {matchObj.homeTeam} vs {matchObj.awayTeam}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Pari: {item.choice === '1' ? '1 (Dom.)' : item.choice === 'X' ? 'X (Nul)' : '2 (Ext.)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-emerald-600 font-mono">
                        {item.odds.toFixed(2)}
                      </span>
                      <button
                        id={`btn-betslip-remove-${item.matchId}`}
                        onClick={() => removeFromBetSlip(item.matchId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Stake input field */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
                <span className="text-xs font-bold text-slate-700">Mise:</span>
                <div className="flex items-center gap-2">
                  <button
                    id="btn-stake-minus"
                    onClick={() => setStake((prev) => Math.max(5, prev - 5))}
                    className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 font-bold"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="font-bold text-xs text-slate-800 w-12 text-center">{stake}€</span>
                  <button
                    id="btn-stake-plus"
                    onClick={() => setStake((prev) => prev + 5)}
                    className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 font-bold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Total Summary */}
              <div className="flex justify-between items-center text-xs mt-3 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-500 block">Cotes totales:</span>
                  <span className="font-black text-slate-900 font-mono text-sm">{totalOdds.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Gains potentiels:</span>
                  <span className="font-black text-emerald-600 font-mono text-base">{potentialWin}€</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400">
              <p className="text-xs font-medium">Aucune sélection dans votre billet</p>
              <p className="text-[10px] opacity-70">Cliquez sur une cote pour l'ajouter.</p>
            </div>
          )}
        </div>
      )}

      {/* BOTTOM NAVIGATION TAB BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white text-slate-400 border-t border-slate-200/80 max-w-md mx-auto h-16 flex items-center justify-between px-2 shadow-lg overflow-x-auto scrollbar-none">
        {/* TAB: TIPS */}
        <button
          id="btn-nav-tips"
          onClick={() => {
            setActiveView('home');
            setIsNotificationsOpen(false);
            setIsSupportOpen(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all focus:outline-none min-w-[50px] ${
            activeView === 'home' && !isNotificationsOpen && !isSupportOpen
              ? 'text-blue-600 font-extrabold scale-105'
              : 'hover:text-slate-700'
          }`}
        >
          <Trophy className="h-4 w-4" />
          <span className="text-[9px] mt-1 tracking-wider uppercase">Tips</span>
        </button>

        {/* TAB: FREE */}
        <button
          id="btn-nav-free"
          onClick={() => {
            setActiveView('free');
            setIsNotificationsOpen(false);
            setIsSupportOpen(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all focus:outline-none min-w-[50px] ${
            activeView === 'free' && !isNotificationsOpen && !isSupportOpen
              ? 'text-blue-600 font-extrabold scale-105'
              : 'hover:text-slate-700'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span className="text-[9px] mt-1 tracking-wider uppercase">Free</span>
        </button>

        {/* TAB: BEST */}
        <button
          id="btn-nav-best"
          onClick={() => {
            setActiveView('best');
            setIsNotificationsOpen(false);
            setIsSupportOpen(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all focus:outline-none min-w-[50px] ${
            activeView === 'best' && !isNotificationsOpen && !isSupportOpen
              ? 'text-blue-600 font-extrabold scale-105'
              : 'hover:text-slate-700'
          }`}
        >
          <Award className="h-4 w-4" />
          <span className="text-[9px] mt-1 tracking-wider uppercase">Best</span>
        </button>

        {/* TAB: LIVE */}
        <button
          id="btn-nav-live"
          onClick={() => {
            setActiveView('live');
            setIsNotificationsOpen(false);
            setIsSupportOpen(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all focus:outline-none min-w-[50px] ${
            (activeView === 'live' || activeView === 'live-scores' || activeView === 'live-tips') && !isNotificationsOpen && !isSupportOpen
              ? 'text-blue-600 font-extrabold scale-105'
              : 'hover:text-slate-700'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span className="text-[9px] mt-1 tracking-wider uppercase">Live</span>
        </button>

        {/* TAB: VIP */}
        <button
          id="btn-nav-vip"
          onClick={() => {
            setActiveView('vip');
            setIsNotificationsOpen(false);
            setIsSupportOpen(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all focus:outline-none min-w-[50px] ${
            activeView === 'vip' && !isNotificationsOpen && !isSupportOpen
              ? 'text-blue-600 font-extrabold scale-105'
              : 'hover:text-slate-700'
          }`}
        >
          <Crown className="h-4 w-4" />
          <span className="text-[9px] mt-1 tracking-wider uppercase">Vip</span>
        </button>

        {/* TAB: HT-FT */}
        <button
          id="btn-nav-htft"
          onClick={() => {
            setActiveView('htft');
            setIsNotificationsOpen(false);
            setIsSupportOpen(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all focus:outline-none min-w-[50px] ${
            activeView === 'htft' && !isNotificationsOpen && !isSupportOpen
              ? 'text-blue-600 font-extrabold scale-105'
              : 'hover:text-slate-700'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span className="text-[9px] mt-1 tracking-wider uppercase">Ht-Ft</span>
        </button>

        {/* TAB: LIVE TOP */}
        {(isAdminAuthenticated || (currentUser && (currentUser.soldeLiveTop || 0) > 0)) && (
          <button
            id="btn-nav-livetop"
            onClick={() => {
              setActiveView('live-top');
              setIsNotificationsOpen(false);
              setIsSupportOpen(false);
            }}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-all focus:outline-none min-w-[50px] ${
              activeView === 'live-top' && !isNotificationsOpen && !isSupportOpen
                ? 'text-blue-600 font-extrabold scale-105'
                : 'hover:text-slate-700'
            }`}
          >
            <Zap className="h-4 w-4 text-amber-500 animate-pulse" />
            <span className="text-[9px] mt-1 tracking-wider uppercase">Live Top</span>
          </button>
        )}

        {/* TAB: MORE */}
        <button
          id="btn-nav-more"
          onClick={() => {
            setActiveView('more');
            setIsNotificationsOpen(false);
            setIsSupportOpen(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all focus:outline-none min-w-[50px] ${
            (activeView === 'more' || activeView === 'terms' || activeView === 'privacy' || activeView === 'profile') && !isNotificationsOpen && !isSupportOpen
              ? 'text-blue-600 font-extrabold scale-105'
              : 'hover:text-slate-700'
          }`}
        >
          <ChevronRight className="h-4 w-4 rotate-90" />
          <span className="text-[9px] mt-1 tracking-wider uppercase">More</span>
        </button>

        {/* TAB: ADMIN */}
        <button
          id="btn-nav-admin"
          onClick={() => {
            handleOpenAdmin();
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all focus:outline-none min-w-[50px] ${
            activeView === 'admin' && !isNotificationsOpen && !isSupportOpen
              ? 'text-blue-600 font-extrabold scale-105'
              : 'hover:text-slate-700'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span className="text-[9px] mt-1 tracking-wider uppercase">Admin</span>
        </button>
      </nav>

      {/* PREMIUM VIP ACCÈS SUBSCRIPTION MODAL */}
      <VipModal
        isOpen={isVipModalOpen}
        onClose={() => setIsVipModalOpen(false)}
        onSubmitPayment={handleSubmitPayment}
        currentUserPhone={currentUser?.phoneNumber}
        onSelectPaymentMethod={handleSelectPaymentMethod}
      />

      {/* SECURE ADMIN LOGIN MODAL */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onSuccess={() => {
          setIsAdminAuthenticated(true);
          localStorage.setItem('sourspark_admin_auth', 'true');
          setActiveView('admin');
        }}
      />

    </div>
  );
}
