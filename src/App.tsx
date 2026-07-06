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
import { generateVirtualRound } from './data/virtualEngine';
import Navbar from './components/Navbar';
import DateSelector from './components/DateSelector';
import MatchCard, { getPredictedScore } from './components/MatchCard';
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
        soldeLiveTop: 100000,
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
        soldeLiveTop: 100000,
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
  const [matchesState, setMatchesState] = useState<Match[]>([]);
  const [, setMatches] = useState<Match[]>([]); // Keeps other setMatches references fully compatible

  // --- VIRTUAL SPORTSBOOK ENGINE STATES ---
  const [cycleSeconds, setCycleSeconds] = useState<number>(() => {
    return Math.floor((Date.now() / 1000) % 190);
  });

  const [currentCycleIndex, setCurrentCycleIndex] = useState<number>(() => {
    return Math.floor((Date.now() / 1000) / 190);
  });

  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const elapsed = Math.floor((Date.now() / 1000) % 190);
    return elapsed < 120 ? 120 - elapsed : 0;
  });

  const [selectedDate, setSelectedDate] = useState<string>('2026-06-30');

  useEffect(() => {
    const interval = setInterval(() => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const elapsed = nowSeconds % 190;
      const cIndex = Math.floor(nowSeconds / 190);
      setCycleSeconds(elapsed);
      setCurrentCycleIndex(cIndex);
      setSecondsRemaining(elapsed < 120 ? 120 - elapsed : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const [activeBets, setActiveBets] = useState<any[]>(() => {
    const saved = localStorage.getItem('sourspark_active_bets');
    return saved ? JSON.parse(saved) : [];
  });

  const [settledBets, setSettledBets] = useState<any[]>(() => {
    const saved = localStorage.getItem('sourspark_settled_bets');
    return saved ? JSON.parse(saved) : [];
  });

  // Generate virtual timetable of 11 kickoff times (spaced by 2 minutes) aligned with currentCycleIndex
  const currentVirtualTimes = useMemo(() => {
    const times = [];
    const cycleStartDate = new Date(currentCycleIndex * 190000);
    const baseMinutes = cycleStartDate.getHours() * 60 + cycleStartDate.getMinutes();
    const stableCenterMinutes = baseMinutes % 2 === 0 ? baseMinutes : baseMinutes - 1;

    for (let index = 0; index < 11; index++) {
      const offset = index - 5; // index 5 represents the current active LIVE session (offset = 0)
      const min = stableCenterMinutes + offset * 2;
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
  }, [currentCycleIndex]);

  // Infinite dynamic virtual matches list
  const matches = useMemo(() => {
    const results: Match[] = [];
    
    let currentPhase: 'COUNTDOWN' | 'FIRST_HALF' | 'HALF_TIME' | 'SECOND_HALF' | 'FULL_TIME' = 'COUNTDOWN';
    let liveMinute: number | undefined = undefined;
    let currentMatchStatus: 'Pending' | 'LIVE' | 'FT' = 'Pending';
    
    if (cycleSeconds < 120) {
      currentPhase = 'COUNTDOWN';
      currentMatchStatus = 'Pending';
      liveMinute = undefined;
    } else if (cycleSeconds < 145) {
      currentPhase = 'FIRST_HALF';
      currentMatchStatus = 'LIVE';
      const step = Math.min(Math.floor(((cycleSeconds - 120) / 25) * 10), 9);
      const firstHalfMinutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45];
      liveMinute = firstHalfMinutes[step];
    } else if (cycleSeconds < 150) {
      currentPhase = 'HALF_TIME';
      currentMatchStatus = 'LIVE';
      liveMinute = 45;
    } else if (cycleSeconds < 175) {
      currentPhase = 'SECOND_HALF';
      currentMatchStatus = 'LIVE';
      const step = Math.min(Math.floor(((cycleSeconds - 150) / 25) * 10), 9);
      const secondHalfMinutes = [46, 50, 55, 60, 65, 70, 75, 80, 85, 90];
      liveMinute = secondHalfMinutes[step];
    } else {
      currentPhase = 'FULL_TIME';
      currentMatchStatus = 'FT';
      liveMinute = 90;
    }

    LEAGUES_LIST.forEach((league) => {
      currentVirtualTimes.forEach((timeItem, index) => {
        const roundIndex = currentCycleIndex + (index - 5);
        const matchesForRound = generateVirtualRound(league.id, timeItem.time, roundIndex);
        
        matchesForRound.forEach((m) => {
          m.date = selectedDate;
          
          if (index < 5) {
            // Completed session (Past)
            m.matchStatus = 'FT';
            m.predictions.status = m.finalScoreHome! > m.finalScoreAway! ? 'Won' : 'Lost';
          } else if (index === 5) {
            // Current session
            m.matchStatus = currentMatchStatus;
            if (currentMatchStatus === 'Pending') {
              m.finalScoreHome = null;
              m.finalScoreAway = null;
              m.liveMinute = undefined;
              m.predictions.status = 'Pending';
            } else if (currentMatchStatus === 'FT') {
              m.liveMinute = 90;
              m.predictions.status = m.finalScoreHome! > m.finalScoreAway! ? 'Won' : 'Lost';
            } else {
              // LIVE
              m.liveMinute = liveMinute;
              if (currentPhase === 'HALF_TIME') {
                m.finalScoreHome = m.halfTimeScoreHome;
                m.finalScoreAway = m.halfTimeScoreAway;
              } else {
                const homeGoalsCount = m.goalMinutes.home.filter(g => parseInt(g) <= liveMinute!).length;
                const awayGoalsCount = m.goalMinutes.away.filter(g => parseInt(g) <= liveMinute!).length;
                m.finalScoreHome = homeGoalsCount;
                m.finalScoreAway = awayGoalsCount;
              }
              m.predictions.status = 'Pending';
            }
          } else {
            // Future session
            m.matchStatus = 'Pending';
            m.finalScoreHome = null;
            m.finalScoreAway = null;
            m.liveMinute = undefined;
            m.predictions.status = 'Pending';
          }
          
          results.push(m);
        });
      });
    });
    
    return results;
  }, [currentCycleIndex, cycleSeconds, currentVirtualTimes, selectedDate]);

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
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedLeagueTab, setSelectedLeagueTab] = useState<'results' | 'matches' | 'standings'>('matches');
  const [selectedHourIndex, setSelectedHourIndex] = useState<number>(5);
  const [activeBetFilter, setActiveBetFilter] = useState<string>('1X2');
  const [lastManualFilterClick, setLastManualFilterClick] = useState<number>(0);

  // Auto-switch betting market in real-time based on cycleSeconds!
  useEffect(() => {
    // If the user interacted recently (less than 8s ago), don't auto-switch.
    if (Date.now() - lastManualFilterClick < 8000) return;

    if (cycleSeconds < 120) {
      // Countdown phase: pre-match markets
      const step = Math.floor(cycleSeconds / 24);
      if (step === 0) setActiveBetFilter('1X2');
      else if (step === 1) setActiveBetFilter('DOUBLE CHANCE');
      else if (step === 2) setActiveBetFilter('OVER/UNDER');
      else if (step === 3) setActiveBetFilter('BTTS');
      else setActiveBetFilter('CORRECT SCORE');
    } else if (cycleSeconds < 145) {
      // First Half phase
      const elapsed = cycleSeconds - 120; // 0 to 24s
      const step = Math.floor(elapsed / 6);
      if (step === 0) setActiveBetFilter('HT 1X2');
      else if (step === 1) setActiveBetFilter('HT DOUBLE CHANCE');
      else if (step === 2) setActiveBetFilter('HT OVER/UNDER');
      else setActiveBetFilter('HT CORRECT SCORE');
    } else if (cycleSeconds < 150) {
      // Half Time phase - Display Half-Time score / stats
      setActiveBetFilter('HT CORRECT SCORE');
    } else if (cycleSeconds < 175) {
      // Second Half phase
      const elapsed = cycleSeconds - 150; // 0 to 24s
      const step = Math.floor(elapsed / 6);
      if (step === 0) setActiveBetFilter('2ND HALF 1X2');
      else if (step === 1) setActiveBetFilter('2ND HALF DOUBLE CHANCE');
      else if (step === 2) setActiveBetFilter('2ND HALF OVER/UNDER');
      else setActiveBetFilter('2ND HALF CORRECT SCORE');
    } else {
      // Full Time phase: Automatically publish all markets in sequence
      const elapsed = cycleSeconds - 175; // 0 to 14s
      const step = Math.floor(elapsed / 1.5); // 10 steps (0 to 9)
      const sequence = [
        '1X2',
        'DOUBLE CHANCE',
        'OVER/UNDER',
        'BTTS',
        'CORRECT SCORE',
        'HT 1X2',
        'HT CORRECT SCORE',
        '2ND HALF 1X2',
        '2ND HALF CORRECT SCORE',
        'FINAL RESULTS'
      ];
      const activeFilter = sequence[Math.min(step, sequence.length - 1)];
      setActiveBetFilter(activeFilter);
    }
  }, [cycleSeconds, lastManualFilterClick]);
  const [selectedSimulationMatch, setSelectedSimulationMatch] = useState<Match | null>(null);
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
    setSelectedHourIndex(5);
  }, [selectedLeagueId]);
  
  const [leagueHourIndices, setLeagueHourIndices] = useState<Record<string, number>>({});
  
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    return !localStorage.getItem('onboarding_completed');
  });
  const [favLeague, setFavLeague] = useState<string>('eng');

  // Bet slip / cart state
  const [betSlip, setBetSlip] = useState<{ matchId: string; choice: string; odds: number }[]>([]);
  const [stake, setStake] = useState<number>(5000);
  const [isBetSlipOpen, setIsBetSlipOpen] = useState<boolean>(false);
  const [betslipTab, setBetslipTab] = useState<'selections' | 'history'>('selections');

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

  // Bet slip action: click an odd on a match card or betting board
  const handleBetClick = (matchId: string, choice: string, odds?: number) => {
    const matchObj = matches.find((m) => m.id === matchId);
    if (!matchObj) return;

    let finalOdds = odds;
    if (finalOdds === undefined) {
      if (choice === '1') {
        finalOdds = matchObj.odds.homeWin;
      } else if (choice === '2') {
        finalOdds = matchObj.odds.awayWin;
      } else if (choice === 'X') {
        finalOdds = matchObj.odds.draw;
      } else {
        const firstOpt = getMarketOptionsForFilter(matchObj, activeBetFilter).find(o => o.choice === choice);
        finalOdds = firstOpt ? firstOpt.odd : 1.80;
      }
    }

    setBetSlip((prev) => {
      const existingIdx = prev.findIndex((item) => item.matchId === matchId);
      if (existingIdx > -1) {
        // If they click the exact same choice, remove it. Otherwise update choice
        if (prev[existingIdx].choice === choice) {
          return prev.filter((item) => item.matchId !== matchId);
        } else {
          const updated = [...prev];
          updated[existingIdx] = { matchId, choice, odds: finalOdds! };
          return updated;
        }
      } else {
        return [...prev, { matchId, choice, odds: finalOdds! }];
      }
    });
    setIsBetSlipOpen(true);
  };

  const removeFromBetSlip = (matchId: string) => {
    setBetSlip((prev) => prev.filter((item) => item.matchId !== matchId));
  };

  const handlePlaceBet = () => {
    if (!currentUser) {
      alert("Veuillez vous connecter pour placer un pari.");
      return;
    }

    const currentBalance = currentUser.soldeLiveTop || 0;
    if (currentBalance < stake) {
      alert(`Solde insuffisant ! Votre solde actuel est de ${currentBalance.toLocaleString('fr-FR')} Ar. Veuillez recharger votre solde Live TOP via le menu VIP.`);
      return;
    }

    // Deduct stake and update databases
    const updatedUsers = users.map((u) => {
      if (u.userId === currentUser.userId) {
        return {
          ...u,
          soldeLiveTop: (u.soldeLiveTop || 0) - stake,
        };
      }
      return u;
    });

    const newBet = {
      id: `bet-${Date.now()}`,
      roundIndex: currentCycleIndex,
      selections: betSlip.map((item) => {
        const m = matches.find((matchObj) => matchObj.id === item.matchId)!;
        return {
          matchId: item.matchId,
          choice: item.choice,
          odds: item.odds,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
        };
      }),
      stake,
      totalOdds,
      potentialWin,
      status: 'Pending',
      placedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedActiveBets = [newBet, ...activeBets];
    setActiveBets(updatedActiveBets);
    localStorage.setItem('sourspark_active_bets', JSON.stringify(updatedActiveBets));

    setUsers(updatedUsers);
    localStorage.setItem('sourspark_users', JSON.stringify(updatedUsers));

    const updatedCurrentUser = updatedUsers.find((u) => u.userId === currentUser.userId)!;
    setCurrentUser(updatedCurrentUser);
    localStorage.setItem('sourspark_current_user', JSON.stringify(updatedCurrentUser));

    setBetSlip([]);
    alert(`🎉 Pari placé avec succès ! ${stake.toLocaleString('fr-FR')} Ar déduits de votre solde.`);
  };

  // Computed potential payout for bet slip
  const totalOdds = useMemo(() => {
    if (betSlip.length === 0) return 0;
    return betSlip.reduce((acc, item) => acc * item.odds, 1);
  }, [betSlip]);

  const potentialWin = Math.round(totalOdds * stake);

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

  const getMarketOptionsForFilter = (m: Match, filter: string) => {
    const norm = filter.toUpperCase().trim();
    
    // Fallback double chance calculations
    const dc1X = parseFloat((1.0 / (1.0/m.odds.homeWin + 1.0/m.odds.draw) * 0.95).toFixed(2));
    const dc12 = parseFloat((1.0 / (1.0/m.odds.homeWin + 1.0/m.odds.awayWin) * 0.95).toFixed(2));
    const dcX2 = parseFloat((1.0 / (1.0/m.odds.draw + 1.0/m.odds.awayWin) * 0.95).toFixed(2));

    // Fallback btts/overUnder
    const overOdds = m.predictions.overUnder25 === 'Over' ? m.predictions.overUnderOdds : parseFloat((m.predictions.overUnderOdds * 0.85).toFixed(2));
    const underOdds = m.predictions.overUnder25 === 'Under' ? m.predictions.overUnderOdds : parseFloat((m.predictions.overUnderOdds * 0.85).toFixed(2));
    
    const ouiOdds = m.predictions.btts === 'Yes' ? m.predictions.bttsOdds : parseFloat((m.predictions.bttsOdds * 0.85).toFixed(2));
    const nonOdds = m.predictions.btts === 'No' ? m.predictions.bttsOdds : parseFloat((m.predictions.bttsOdds * 0.85).toFixed(2));

    const predScore = getPredictedScore(m);
    const parts = predScore.split('-');
    const hSc = parseInt(parts[0]) || 0;
    const aSc = parseInt(parts[1]) || 0;
    const oddScore = parseFloat((6.5 + (m.predictions.exactScorePct || 10) / 3).toFixed(2));
    const altScore1 = hSc > aSc ? `${hSc}-${aSc + 1}` : hSc === aSc ? `${hSc + 1}-${aSc}` : `${hSc + 1}-${aSc}`;
    const altOdd1 = parseFloat((oddScore * 1.25).toFixed(2));

    // HT correct score helper
    const htScore = `${m.halfTimeScoreHome}-${m.halfTimeScoreAway}`;
    let htAltScore = hSc > aSc ? `1-0` : `0-1`;
    if (htAltScore === htScore) {
      htAltScore = htScore === '0-0' ? '1-0' : '0-0';
    }

    if (norm === '1X2' || norm === 'FINAL 1X2' || norm === 'ALL FINAL') {
      return [
        { label: '1', odd: m.odds.homeWin, choice: '1' },
        { label: 'X', odd: m.odds.draw, choice: 'X' },
        { label: '2', odd: m.odds.awayWin, choice: '2' },
      ];
    }
    if (norm === 'DOUBLE CHANCE') {
      return [
        { label: '1X', odd: dc1X, choice: '1X' },
        { label: '12', odd: dc12, choice: '12' },
        { label: 'X2', odd: dcX2, choice: 'X2' },
      ];
    }
    if (norm === 'OVER/UNDER') {
      return [
        { label: 'Over 2.5', odd: overOdds, choice: 'Over 2.5' },
        { label: 'Under 2.5', odd: underOdds, choice: 'Under 2.5' },
      ];
    }
    if (norm === 'BTTS') {
      return [
        { label: 'Oui', odd: ouiOdds, choice: 'Oui' },
        { label: 'Non', odd: nonOdds, choice: 'Non' },
      ];
    }
    if (norm === 'CORRECT SCORE' || norm === 'FINAL SCORE') {
      return [
        { label: predScore, odd: oddScore, choice: predScore },
        { label: altScore1, odd: altOdd1, choice: altScore1 },
      ];
    }
    if (norm === 'HT 1X2' || norm === 'MI-TPS 1X2' || norm === 'HALF TIME') {
      return [
        { label: 'HT 1', odd: parseFloat((m.odds.homeWin * 0.85 + 0.3).toFixed(2)), choice: 'HT 1' },
        { label: 'HT X', odd: parseFloat((m.odds.draw * 0.85).toFixed(2)), choice: 'HT X' },
        { label: 'HT 2', odd: parseFloat((m.odds.awayWin * 0.85 + 0.3).toFixed(2)), choice: 'HT 2' },
      ];
    }
    if (norm === 'HT DOUBLE CHANCE' || norm === 'MI-TPS DC') {
      return [
        { label: 'HT 1X', odd: parseFloat((dc1X * 0.95 + 0.1).toFixed(2)), choice: 'HT 1X' },
        { label: 'HT 12', odd: parseFloat((dc12 * 0.9).toFixed(2)), choice: 'HT 12' },
        { label: 'HT X2', odd: parseFloat((dcX2 * 0.95 + 0.1).toFixed(2)), choice: 'HT X2' },
      ];
    }
    if (norm === 'HT OVER/UNDER') {
      return [
        { label: 'HT Over 1.5', odd: parseFloat((overOdds * 1.55).toFixed(2)), choice: 'HT Over 1.5' },
        { label: 'HT Under 1.5', odd: parseFloat((underOdds * 0.65).toFixed(2)), choice: 'HT Under 1.5' },
      ];
    }
    if (norm === 'HT CORRECT SCORE' || norm === 'MI-TPS SCORE' || norm === 'HT SCORE') {
      return [
        { label: `HT ${htScore}`, odd: parseFloat((oddScore * 0.65).toFixed(2)), choice: `HT ${htScore}` },
        { label: `HT ${htAltScore}`, odd: parseFloat((altOdd1 * 0.65).toFixed(2)), choice: `HT ${htAltScore}` },
      ];
    }
    if (norm === '2ND HALF 1X2') {
      return [
        { label: '2H 1', odd: parseFloat((m.odds.homeWin * 0.9).toFixed(2)), choice: '2H 1' },
        { label: '2H X', odd: parseFloat((m.odds.draw * 0.9).toFixed(2)), choice: '2H X' },
        { label: '2H 2', odd: parseFloat((m.odds.awayWin * 0.9).toFixed(2)), choice: '2H 2' },
      ];
    }
    if (norm === '2ND HALF DOUBLE CHANCE' || norm === '2ND HALF DC') {
      return [
        { label: '2H 1X', odd: parseFloat((dc1X * 0.95).toFixed(2)), choice: '2H 1X' },
        { label: '2H 12', odd: parseFloat((dc12 * 0.95).toFixed(2)), choice: '2H 12' },
        { label: '2H X2', odd: parseFloat((dcX2 * 0.95).toFixed(2)), choice: '2H X2' },
      ];
    }
    if (norm === '2ND HALF OVER/UNDER') {
      return [
        { label: '2H Over 1.5', odd: parseFloat((overOdds * 1.35).toFixed(2)), choice: '2H Over 1.5' },
        { label: '2H Under 1.5', odd: parseFloat((underOdds * 0.75).toFixed(2)), choice: '2H Under 1.5' },
      ];
    }
    if (norm === '2ND HALF CORRECT SCORE' || norm === '2MT-CS' || norm === '2ND HALF SCORE') {
      return [
        { label: `2H ${htScore}`, odd: parseFloat((oddScore * 0.7).toFixed(2)), choice: `2H ${htScore}` },
        { label: `2H ${htAltScore}`, odd: parseFloat((altOdd1 * 0.7).toFixed(2)), choice: `2H ${htAltScore}` },
      ];
    }
    if (norm === 'HANDICAP') {
      return [
        { label: 'H1 (-1)', odd: parseFloat((m.odds.homeWin * 1.7).toFixed(2)), choice: 'H1 (-1)' },
        { label: 'H2 (+1)', odd: parseFloat((m.odds.awayWin * 0.7).toFixed(2)), choice: 'H2 (+1)' },
      ];
    }
    if (norm === 'TOTAL GOALS') {
      return [
        { label: '0-1 but', odd: 1.95, choice: '0-1 GOAL' },
        { label: '2-3 buts', odd: 1.85, choice: '2-3 GOALS' },
        { label: '4+ buts', odd: 2.60, choice: '4+ GOALS' },
      ];
    }
    if (norm === 'FINAL RESULTS') {
      return [
        { label: '1', odd: m.odds.homeWin, choice: '1' },
        { label: 'X', odd: m.odds.draw, choice: 'X' },
        { label: '2', odd: m.odds.awayWin, choice: '2' },
      ];
    }
    
    return [
      { label: '1', odd: m.odds.homeWin, choice: '1' },
      { label: 'X', odd: m.odds.draw, choice: 'X' },
      { label: '2', odd: m.odds.awayWin, choice: '2' },
    ];
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

  // --- AUTOMATIC BET SETTLEMENT SYSTEM ---
  useEffect(() => {
    if (activeBets.length === 0) return;

    let hasChanges = false;
    const updatedActiveBets = [...activeBets];
    const newSettledBets = [...settledBets];
    let updatedUsers = [...users];
    let isUserUpdated = false;

    const isSelectionWinning = (choice: string, m: Match): boolean => {
      const h = m.finalScoreHome !== null ? m.finalScoreHome : m.goalMinutes.home.length;
      const a = m.finalScoreAway !== null ? m.finalScoreAway : m.goalMinutes.away.length;
      const hHT = m.halfTimeScoreHome !== null ? m.halfTimeScoreHome : m.goalMinutes.home.filter(g => parseInt(g) <= 45).length;
      const aHT = m.halfTimeScoreAway !== null ? m.halfTimeScoreAway : m.goalMinutes.away.filter(g => parseInt(g) <= 45).length;
      
      const h2H = h - hHT;
      const a2H = a - aHT;
      
      const formattedChoice = choice.toUpperCase().trim();
      
      // --- 1X2 MARKETS ---
      if (formattedChoice === '1') return h > a;
      if (formattedChoice === 'X') return h === a;
      if (formattedChoice === '2') return h < a;
      
      // --- DOUBLE CHANCE MARKETS ---
      if (formattedChoice === '1X') return h >= a;
      if (formattedChoice === '12') return h !== a;
      if (formattedChoice === 'X2') return h <= a;
      
      // --- OVER / UNDER MARKETS ---
      if (formattedChoice === 'OVER 0.5') return (h + a) > 0.5;
      if (formattedChoice === 'UNDER 0.5') return (h + a) < 0.5;
      if (formattedChoice === 'OVER 1.5') return (h + a) > 1.5;
      if (formattedChoice === 'UNDER 1.5') return (h + a) < 1.5;
      if (formattedChoice === 'OVER 2.5') return (h + a) > 2.5;
      if (formattedChoice === 'UNDER 2.5') return (h + a) < 2.5;
      if (formattedChoice === 'OVER 3.5') return (h + a) > 3.5;
      if (formattedChoice === 'UNDER 3.5') return (h + a) < 3.5;
      
      // --- BTTS MARKETS ---
      if (formattedChoice === 'OUI') return h > 0 && a > 0;
      if (formattedChoice === 'NON') return h === 0 || a === 0;
      
      // --- CORRECT SCORE MARKETS ---
      if (formattedChoice === `${h}-${a}` || formattedChoice === `${h} - ${a}`) return true;
      
      // --- FIRST HALF MARKETS ---
      if (formattedChoice === 'HT 1') return hHT > aHT;
      if (formattedChoice === 'HT X') return hHT === aHT;
      if (formattedChoice === 'HT 2') return hHT < aHT;
      
      if (formattedChoice === 'HT 1X') return hHT >= aHT;
      if (formattedChoice === 'HT 12') return hHT !== aHT;
      if (formattedChoice === 'HT X2') return hHT <= aHT;
      
      if (formattedChoice === 'HT OUI') return hHT > 0 && aHT > 0;
      if (formattedChoice === 'HT NON') return hHT === 0 || aHT === 0;
      
      if (formattedChoice === `HT ${hHT}-${aHT}` || formattedChoice === `HT ${hHT} - ${aHT}`) return true;
      
      // --- SECOND HALF MARKETS ---
      if (formattedChoice === '2H 1') return h2H > a2H;
      if (formattedChoice === '2H X') return h2H === a2H;
      if (formattedChoice === '2H 2') return h2H < a2H;
      
      if (formattedChoice === '2H 1X') return h2H >= a2H;
      if (formattedChoice === '2H 12') return h2H !== a2H;
      if (formattedChoice === '2H X2') return h2H <= a2H;
      
      if (formattedChoice === '2H OUI') return h2H > 0 && a2H > 0;
      if (formattedChoice === '2H NON') return h2H === 0 || a2H === 0;
      
      if (formattedChoice === `2H ${h2H}-${a2H}` || formattedChoice === `2H ${h2H} - ${a2H}`) return true;

      // --- NEW MARKETS SUPPORT ---
      if (formattedChoice === 'HT OVER 1.5') return (hHT + aHT) > 1.5;
      if (formattedChoice === 'HT UNDER 1.5') return (hHT + aHT) < 1.5;
      if (formattedChoice === '2H OVER 1.5') return (h2H + a2H) > 1.5;
      if (formattedChoice === '2H UNDER 1.5') return (h2H + a2H) < 1.5;
      
      if (formattedChoice === 'H1 (-1)' || formattedChoice === 'H1(-1)') return (h - 1) > a;
      if (formattedChoice === 'H2 (+1)' || formattedChoice === 'H2(+1)') return h < (a + 1);
      
      if (formattedChoice === '0-1 GOAL' || formattedChoice === '0-1 GOALS') return (h + a) <= 1;
      if (formattedChoice === '2-3 GOALS') return (h + a) >= 2 && (h + a) <= 3;
      if (formattedChoice === '4+ GOALS') return (h + a) >= 4;
      
      return false;
    };

    // We can settle a bet if the round is completed.
    // The match is completed if currentCycleIndex > bet.roundIndex
    // OR if currentCycleIndex === bet.roundIndex && cycleSeconds >= 175 (FT results are final!)
    for (let i = updatedActiveBets.length - 1; i >= 0; i--) {
      const bet = updatedActiveBets[i];
      const isRoundFinished = currentCycleIndex > bet.roundIndex || 
        (currentCycleIndex === bet.roundIndex && cycleSeconds >= 175);

      if (isRoundFinished) {
        // Evaluate all selections
        let allWon = true;
        let anyLost = false;

        for (const sel of bet.selections) {
          // Look up the exact match from our computed matches
          const matchObj = matches.find(m => m.id === sel.matchId);
          if (matchObj) {
            if (isSelectionWinning(sel.choice, matchObj)) {
              // Selection won
            } else {
              anyLost = true;
              allWon = false;
            }
          } else {
            allWon = false;
          }
        }

        if (allWon || anyLost) {
          // Settle the bet!
          const status = allWon ? 'Won' : 'Lost';
          const settledBet = {
            ...bet,
            status,
            settledAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          };

          // Remove from active, add to settled
          updatedActiveBets.splice(i, 1);
          newSettledBets.unshift(settledBet);
          hasChanges = true;

          // If won, credit the balance!
          if (status === 'Won' && currentUser) {
            const winAmount = Math.round(bet.potentialWin);
            updatedUsers = updatedUsers.map(u => {
              if (u.userId === currentUser.userId) {
                isUserUpdated = true;
                return {
                  ...u,
                  soldeLiveTop: (u.soldeLiveTop || 0) + winAmount
                };
              }
              return u;
            });
          }
        }
      }
    }

    if (hasChanges) {
      setActiveBets(updatedActiveBets);
      setSettledBets(newSettledBets);
      localStorage.setItem('sourspark_active_bets', JSON.stringify(updatedActiveBets));
      localStorage.setItem('sourspark_settled_bets', JSON.stringify(newSettledBets));

      if (isUserUpdated) {
        setUsers(updatedUsers);
        localStorage.setItem('sourspark_users', JSON.stringify(updatedUsers));
        // Update currentUser reference
        const updatedCurrentUser = updatedUsers.find(u => u.userId === currentUser?.userId);
        if (updatedCurrentUser) {
          localStorage.setItem('sourspark_current_user', JSON.stringify(updatedCurrentUser));
        }
      }
    }
  }, [currentCycleIndex, secondsRemaining, matches, currentUser, users, activeBets, settledBets]);

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

  const isWideDashboard = activeView === 'home' && selectedLeagueId === 'all';

  return (
    <div className={`mx-auto min-h-screen ${isWideDashboard ? 'max-w-7xl w-full px-4 md:px-8' : 'max-w-md w-full'} bg-[#F3F4F6] shadow-2xl flex flex-col relative font-sans transition-all duration-300`}>
      
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
              className="w-full rounded-2xl bg-[#0B5D34] hover:bg-[#074b29] py-4 text-sm font-black text-white transition-colors uppercase tracking-wider shadow-md"
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
        secondsRemaining={secondsRemaining}
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
                <Search className="absolute top-3.5 left-4 h-4 w-4 text-gray-400" />
                <input
                  id="main-search-input"
                  type="text"
                  placeholder="Rechercher des équipes, ligues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white text-gray-800 rounded-2xl py-3 pl-11 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-200 shadow-sm placeholder-gray-450 font-sans font-bold"
                />
              </div>
            )}

            {/* 1. HOME SCREEN */}
            {activeView === 'home' && (
              <div className="space-y-6">
                {/* Sportsbook Header Banner / Universal Title Banner from screenshot */}
                {selectedLeagueId === 'all' && (
                  <div className="text-center py-6 select-none bg-white border border-gray-200 rounded-3xl p-6 shadow-sm mb-4">
                    <h1 className="text-xl md:text-2xl.5 font-black text-gray-900 tracking-tight uppercase font-display">
                      STRUCTURE POUR TOUTES LES COMPÉTITIONS
                    </h1>
                    <p className="text-xs md:text-sm text-gray-550 mt-1.5 font-medium">
                      Le même design et la même structure sont utilisés pour toutes les compétitions.
                    </p>
                    <p className="text-[11px] text-gray-450 mt-0.5">
                      La seule différence est le nom de la compétition.
                    </p>
                  </div>
                )}

                {/* Sportsbook Header Banner (Original feature banner) shown if a specific league is filtered */}
                {selectedLeagueId !== 'all' && (
                  <div className="rounded-3xl bg-gradient-to-br from-[#004D2C] to-[#0A3720] p-5 border border-emerald-800 shadow-lg relative overflow-hidden select-none text-white">
                    <div className="absolute top-0 right-0 p-12 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex justify-between items-start mb-2">
                      <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                        🔥 IA CONSEIL VEDETTE
                      </span>
                      <span className="text-[9px] text-emerald-300 font-mono font-bold uppercase tracking-wider">
                        COTE SÉLECTIONNÉE
                      </span>
                    </div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wide">
                      🏆 Arsenal vs Chelsea
                    </h3>
                    <p className="text-[10px] text-emerald-100 mt-1 leading-relaxed">
                      Nos algorithmes prévoient une nette domination d'Arsenal à domicile. L'option <strong className="text-emerald-400 font-bold">1X2 : Victoire d'Arsenal (1)</strong> offre une excellente valeur.
                    </p>
                    <div className="mt-3 flex items-center justify-between border-t border-[#095730] pt-2.5 text-[10px]">
                      <span className="text-emerald-200 font-bold">Pronostic: <strong className="text-white uppercase">1 (Victoire Arsenal)</strong></span>
                      <span className="font-mono font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Cote: 1.85</span>
                    </div>
                  </div>
                )}

                {/* Horizontally scrollable League Navigation Tabs */}
                <div>
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">
                    Ligues Majeures Virtuelles
                  </h4>
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 pt-1">
                    <button
                      id="btn-league-filter-all"
                      onClick={() => setSelectedLeagueId('all')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                        selectedLeagueId === 'all'
                          ? 'bg-[#004D2C] border-[#004D2C] text-white font-extrabold shadow-md'
                          : 'bg-white text-gray-600 border-gray-200 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      🌍 Toutes les Ligues
                    </button>
                    {LEAGUES_LIST.map((league) => (
                      <button
                        id={`btn-league-filter-${league.id}`}
                        key={league.id}
                        onClick={() => setSelectedLeagueId(league.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                          selectedLeagueId === league.id
                            ? 'bg-[#004D2C] border-[#004D2C] text-white font-extrabold shadow-md'
                            : 'bg-white text-gray-600 border-gray-200 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-sm select-none">{league.logo}</span>
                        <span>{league.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Competition Details tabs (Results, Matches, Standings) shown only for specific leagues */}
                {selectedLeagueId !== 'all' && (
                  <div className="flex bg-white rounded-2xl border border-gray-200 overflow-hidden shadow">
                    {(['results', 'matches', 'standings'] as const).map((tab) => {
                      const labels = {
                        results: '🏆 RÉSULTATS',
                        matches: '⚽ MATCHS',
                        standings: '📊 CLASSEMENT'
                      };
                      const isActive = selectedLeagueTab === tab;
                      return (
                        <button
                          key={tab}
                          id={`btn-league-tab-${tab}`}
                          onClick={() => setSelectedLeagueTab(tab)}
                          className={`flex-1 text-center py-3 text-[10px] font-black transition-all tracking-wider border-b-2 ${
                            isActive
                              ? 'border-[#004D2C] text-[#004D2C] bg-emerald-50/20'
                              : 'border-transparent text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          {labels[tab]}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Render central betting panel if it is All Leagues or active Matches Tab */}
                {(selectedLeagueId === 'all' || selectedLeagueTab === 'matches') ? (
                  <div className="space-y-6">
                    {selectedLeagueId !== 'all' && (
                      <>
                        {/* Virtual Hour Selector (Always visible on the dashboard for single league view) */}
                        <div className="space-y-2 bg-white p-3.5 rounded-2xl border border-gray-200">
                          <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block px-1">
                            🕒 Heures Virtuelles & Sessions actives
                          </span>
                          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 pt-1 px-1">
                            {currentVirtualTimes.map((item, index) => {
                              const isSelected = selectedHourIndex === index;
                              const isLive = index === 5;
                              return (
                                <button
                                  key={index}
                                  id={`btn-hour-pill-${index}`}
                                  onClick={() => setSelectedHourIndex(index)}
                                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border flex flex-col items-center justify-center gap-0.5 min-w-[70px] ${
                                    isSelected
                                      ? 'bg-[#004D2C] border-[#004D2C] text-white font-extrabold shadow-md'
                                      : isLive
                                      ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20 shadow-sm'
                                      : 'bg-white border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                  }`}
                                >
                                  <span className="font-mono">{item.time}</span>
                                  {isLive ? (
                                    <span className="text-[7px] uppercase font-black tracking-wide leading-none select-none text-red-600">
                                      🔴 LIVE
                                    </span>
                                  ) : index < 5 ? (
                                    <span className="text-[7px] text-gray-400 uppercase font-black tracking-wide leading-none select-none">
                                      Terminé
                                    </span>
                                  ) : (
                                    <span className="text-[7px] text-gray-400 uppercase font-black tracking-wide leading-none select-none">
                                      À venir
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* PRONOSTIC BETTING FILTERS BAR (For single league) */}
                        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
                          {['1X2', 'MI-TPS 1X2', 'DOUBLE CHANCE', 'MI-TPS DC', '+ 29 DE PLUS v'].map((filter) => {
                            const isActive = activeBetFilter === filter || (filter === '+ 29 DE PLUS v' && activeBetFilter === 'plus');
                            return (
                              <button
                                key={filter}
                                id={`btn-bet-filter-${filter}`}
                                onClick={() => {
                                  setLastManualFilterClick(Date.now());
                                  if (filter === '+ 29 DE PLUS v') {
                                    setActiveBetFilter('plus');
                                    alert("Plus de 29 marchés de paris supplémentaires débloqués en exclusivité !");
                                  } else {
                                    setActiveBetFilter(filter);
                                  }
                                }}
                                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl border whitespace-nowrap transition-all ${
                                  isActive
                                    ? 'bg-[#004D2C] border-[#004D2C] text-white'
                                    : 'bg-white border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                              >
                                {filter}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {/* MATCH SECTIONS CONTAINER */}
                    <div className={selectedLeagueId === 'all' ? "grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-2 gap-6" : "space-y-4"}>
                      {(() => {
                        const activeLeagues = selectedLeagueId === 'all'
                          ? LEAGUES_LIST
                          : LEAGUES_LIST.filter(l => l.id === selectedLeagueId);

                        return activeLeagues.map((league) => {
                          // Get the hour index for this league
                          const hourIndex = selectedLeagueId === 'all'
                            ? (leagueHourIndices[league.id] !== undefined ? leagueHourIndices[league.id] : 5) // Default to index 5 (the LIVE session)
                            : selectedHourIndex;

                          const selectedTimeItem = currentVirtualTimes[hourIndex];
                          
                          // Determine synchronized simulated status based on active cycle seconds and selected hour index
                          let simulatedStatus: 'Pending' | 'LIVE' | 'FT' = 'Pending';
                          let liveMinuteVal: number | string | undefined = undefined;

                          if (hourIndex < 5) {
                            simulatedStatus = 'FT';
                            liveMinuteVal = 90;
                          } else if (hourIndex > 5) {
                            simulatedStatus = 'Pending';
                            liveMinuteVal = undefined;
                          } else {
                            // hourIndex === 5 (the current round)
                            if (cycleSeconds < 120) {
                              simulatedStatus = 'Pending';
                              liveMinuteVal = undefined;
                            } else if (cycleSeconds < 145) {
                              simulatedStatus = 'LIVE';
                              const step = Math.min(Math.floor(((cycleSeconds - 120) / 25) * 10), 9);
                              const firstHalfMinutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45];
                              liveMinuteVal = firstHalfMinutes[step];
                            } else if (cycleSeconds < 150) {
                              simulatedStatus = 'LIVE';
                              liveMinuteVal = 'HT';
                            } else if (cycleSeconds < 175) {
                              simulatedStatus = 'LIVE';
                              const step = Math.min(Math.floor(((cycleSeconds - 150) / 25) * 10), 9);
                              const secondHalfMinutes = [46, 50, 55, 60, 65, 70, 75, 80, 85, 90];
                              liveMinuteVal = secondHalfMinutes[step];
                            } else {
                              simulatedStatus = 'FT';
                              liveMinuteVal = 90;
                            }
                          }

                          let leagueMatches = matches.filter(m => m.leagueId === league.id && m.matchTime === selectedTimeItem.time);

                          if (searchQuery) {
                            const query = searchQuery.toLowerCase();
                            leagueMatches = leagueMatches.filter(m => 
                              m.homeTeam.toLowerCase().includes(query) ||
                              m.awayTeam.toLowerCase().includes(query)
                            );
                          }

                          if (leagueMatches.length === 0) {
                            return null;
                          }

                          // Header colors mapping from screenshots
                          const headerColors: Record<string, string> = {
                            can: 'bg-[#004D2C]', // Dark green
                            ucl: 'bg-[#0B1E36]', // Dark blue
                            eng: 'bg-[#3D195B]', // Purple
                            esp: 'bg-[#0F4C81]', // Blue
                            ita: 'bg-[#0D3B66]', // Navy
                            ger: 'bg-[#A6192E]', // Red
                            fra: 'bg-[#1A365D]', // Royal Blue
                            por: 'bg-[#005A5B]', // Teal
                          };
                          
                          const leagueThemeColor = headerColors[league.id] || 'bg-[#004D2C]';

                          return (
                            <div key={league.id} id={`league-section-${league.id}`} className="bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-sm flex flex-col justify-between">
                              <div>
                                {/* 1. Header Band with custom league color */}
                                <div className={`${leagueThemeColor} py-3.5 px-4 text-white font-black flex justify-between items-center select-none shadow-sm`}>
                                  <span className="text-xs font-black tracking-wider uppercase flex items-center gap-2">
                                    <span className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-xs">🏆</span>
                                    <span>{league.name}</span>
                                  </span>
                                  <span className="text-[9px] text-white/90 font-mono font-bold bg-white/15 px-2 py-0.5 rounded border border-white/10">
                                    {leagueMatches.length} MATCHS
                                  </span>
                                </div>

                                {/* 2. Sub-Tabs */}
                                <div className="flex border-b border-gray-100 bg-gray-50/50">
                                  {['RÉSULTATS', 'MATCHS', 'CLASSEMENT'].map((t) => {
                                    const isMatchTab = t === 'MATCHS';
                                    return (
                                      <div
                                        key={t}
                                        className={`flex-1 text-center py-2.5 text-[9px] font-black tracking-wider border-b-3 transition-colors ${
                                          isMatchTab
                                            ? `border-[#004D2C] text-[#004D2C] font-extrabold`
                                            : 'border-transparent text-gray-400'
                                        }`}
                                      >
                                        {t}
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* 3. Independent Hours selector */}
                                <div className="p-3 bg-white border-b border-gray-100 overflow-x-auto scrollbar-none flex gap-1.5 select-none justify-between">
                                  {currentVirtualTimes.map((item, index) => {
                                    const isSelected = hourIndex === index;
                                    return (
                                      <button
                                        key={index}
                                        onClick={() => {
                                          if (selectedLeagueId === 'all') {
                                            setLeagueHourIndices(prev => ({ ...prev, [league.id]: index }));
                                          } else {
                                            setSelectedHourIndex(index);
                                          }
                                        }}
                                        className={`px-2 py-1.5 rounded-lg text-[10px] font-extrabold whitespace-nowrap transition-all border font-mono ${
                                          isSelected
                                            ? 'bg-[#D32F2F] border-[#D32F2F] text-white shadow-sm'
                                            : 'bg-white border-gray-200 text-gray-500 hover:text-gray-800'
                                        }`}
                                      >
                                        {item.time}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* 4. Match Prediction Filter buttons */}
                                <div className="px-3 py-2 bg-white flex gap-1 overflow-x-auto scrollbar-none select-none border-b border-gray-100">
                                  {['1X2', 'DOUBLE CHANCE', 'OVER/UNDER', 'BTTS', 'CORRECT SCORE', '+ 29 DE PLUS v'].map((filter) => {
                                    const isActive = activeBetFilter === filter;
                                    return (
                                      <button
                                        key={filter}
                                        onClick={() => {
                                          setLastManualFilterClick(Date.now());
                                          if (filter === '+ 29 DE PLUS v') {
                                            alert("Plus de 29 marchés de paris supplémentaires débloqués en exclusivité !");
                                          } else {
                                            setActiveBetFilter(filter);
                                          }
                                        }}
                                        className={`px-3 py-1 text-[8px] font-black uppercase tracking-wider rounded-full border whitespace-nowrap transition-all ${
                                          isActive
                                            ? 'bg-[#2E7D32] border-[#2E7D32] text-white font-extrabold'
                                            : 'bg-white border-gray-200 text-gray-500 hover:text-gray-800'
                                        }`}
                                      >
                                        {filter}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* 5. Sub-header label banner */}
                                <div className="bg-gray-50 border-b border-gray-100 px-3 py-1 flex items-center justify-between text-[8px] font-black text-gray-400 uppercase tracking-wider select-none">
                                  <div className="w-[38%]">MATCHS DU JOUR</div>
                                  <div className="w-[45%] text-center flex justify-around">
                                    {activeBetFilter === 'DOUBLE CHANCE' ? (
                                      <>
                                        <span className="w-8">1X</span>
                                        <span className="w-8">12</span>
                                        <span className="w-8">X2</span>
                                      </>
                                    ) : activeBetFilter === 'OVER/UNDER' ? (
                                      <>
                                        <span className="w-12">+2.5</span>
                                        <span className="w-12">-2.5</span>
                                      </>
                                    ) : activeBetFilter === 'BTTS' ? (
                                      <>
                                        <span className="w-10">OUI</span>
                                        <span className="w-10">NON</span>
                                      </>
                                    ) : activeBetFilter === 'CORRECT SCORE' ? (
                                      <>
                                        <span className="w-12">PRÉDI</span>
                                        <span className="w-12">ALT</span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="w-8">1</span>
                                        <span className="w-8">X</span>
                                        <span className="w-8">2</span>
                                      </>
                                    )}
                                  </div>
                                  <div className="w-[17%] text-right flex items-center justify-end gap-0.5">
                                    <span>SCORE PRÉDIT</span>
                                    <HelpCircle className="h-2.5 w-2.5" />
                                  </div>
                                </div>

                                {/* 6. Match Rows List */}
                                <div className="divide-y divide-gray-100 bg-white">
                                  {leagueMatches.map((m) => {
                                    const simulatedMatch = { ...m };
                                    simulatedMatch.matchTime = selectedTimeItem?.time || m.matchTime;
                                    simulatedMatch.matchStatus = simulatedStatus;

                                    if (simulatedStatus === 'LIVE') {
                                      simulatedMatch.liveMinute = typeof liveMinuteVal === 'number' ? liveMinuteVal : undefined;
                                    }

                                    const flagA = getTeamFlagAndColors(m.homeTeam).flag || '⚽';
                                    const flagB = getTeamFlagAndColors(m.awayTeam).flag || '⚽';
                                    const predictedScoreStr = getPredictedScore(m);

                                    const isFavorite = betSlip.some((b) => b.matchId === m.id);

                                    return (
                                      <div
                                        key={m.id}
                                        className="p-3 flex items-center justify-between gap-2 hover:bg-gray-50/50 transition-colors cursor-pointer select-none"
                                        onClick={() => setSelectedSimulationMatch(simulatedMatch)}
                                      >
                                        {/* Favorite star & Team Name Column */}
                                        <div className="w-[38%] min-w-0 flex items-center gap-1.5 pr-1">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const firstOpt = getMarketOptionsForFilter(m, activeBetFilter)[0];
                                              handleBetClick(m.id, firstOpt.choice, firstOpt.odd);
                                            }}
                                            className="text-gray-300 hover:text-amber-500 transition-colors text-xs"
                                          >
                                            <span className={`text-base ${isFavorite ? 'text-amber-500 font-extrabold' : 'text-gray-350'}`}>★</span>
                                          </button>
                                          <div className="flex flex-col gap-0.5 min-w-0">
                                            <div className="flex items-center gap-1 min-w-0">
                                              <span className="text-[11px] select-none shrink-0">{flagA}</span>
                                              <span className="text-[10px] font-bold text-gray-800 uppercase truncate">
                                                {m.homeTeam}
                                              </span>
                                              {simulatedStatus !== 'Pending' && (
                                                <span className="font-mono font-black text-[10px] text-[#2E7D32] bg-[#E8F5E9] px-1 rounded ml-auto">
                                                  {simulatedMatch.finalScoreHome ?? 0}
                                                </span>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-1 min-w-0">
                                              <span className="text-[11px] select-none shrink-0">{flagB}</span>
                                              <span className="text-[10px] font-bold text-gray-800 uppercase truncate">
                                                {m.awayTeam}
                                              </span>
                                              {simulatedStatus !== 'Pending' && (
                                                <span className="font-mono font-black text-[10px] text-[#2E7D32] bg-[#E8F5E9] px-1 rounded ml-auto">
                                                  {simulatedMatch.finalScoreAway ?? 0}
                                                </span>
                                              )}
                                            </div>
                                            <span className="text-[8px] font-bold font-mono text-gray-450 mt-0.5">
                                              🕒 {simulatedMatch.matchTime} {simulatedStatus === 'LIVE' && `• LIVE ${typeof liveMinuteVal === 'number' ? `${liveMinuteVal}'` : liveMinuteVal}`}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Dynamic Prediction cells */}
                                        <div className="w-[45%] flex items-center gap-1.5 justify-around">
                                          {getMarketOptionsForFilter(m, activeBetFilter).map((opt) => {
                                            const isSelected = betSlip.some((b) => b.matchId === m.id && b.choice === opt.choice);
                                            const isLocked = simulatedStatus !== 'Pending';

                                            return (
                                              <button
                                                key={opt.choice}
                                                disabled={isLocked}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (isLocked) return;
                                                  handleBetClick(m.id, opt.choice, opt.odd);
                                                }}
                                                className={`flex-1 h-9 flex flex-col items-center justify-center rounded-lg border text-center transition-all px-1 select-none ${
                                                  isSelected
                                                    ? 'bg-[#E8F5E9] border-[#4CAF50] text-[#2E7D32] font-black shadow-sm scale-102'
                                                    : isLocked
                                                    ? 'bg-gray-100 border-gray-150 text-gray-450 cursor-not-allowed opacity-75'
                                                    : 'bg-white border-gray-150 hover:bg-gray-50 text-gray-700'
                                                }`}
                                              >
                                                <span className="text-[7px] uppercase font-bold leading-none">{opt.label}</span>
                                                <span className="text-[9px] font-black mt-0.5 leading-none">
                                                  {isLocked ? '🔒' : opt.odd.toFixed(2)}
                                                </span>
                                              </button>
                                            );
                                          })}
                                        </div>

                                        {/* Exact Score Predicted box */}
                                        <div className="w-[17%] flex items-center justify-end gap-1">
                                          <div className="h-9 px-1.5 flex flex-col items-center justify-center bg-white border border-gray-250 rounded-lg text-center">
                                            <span className="text-[10px] font-mono font-black text-gray-800 leading-none">
                                              {predictedScoreStr}
                                            </span>
                                            <span className="text-[7.5px] font-bold text-gray-450 mt-0.5 leading-none">
                                              ({m.predictions.exactScorePct}%)
                                            </span>
                                          </div>
                                          <span className="text-gray-300 font-extrabold text-xs select-none">›</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* 7. Card Footer Legends block */}
                              <div className="p-3 bg-gray-50 border-t border-gray-100 text-[8px] font-bold text-gray-500 space-y-2 select-none">
                                <div className="flex flex-wrap gap-2 justify-between border-b border-gray-150 pb-2">
                                  <div className="flex items-center gap-1">
                                    <span className="w-3.5 h-3.5 flex items-center justify-center rounded-md border border-[#4CAF50] bg-[#E8F5E9] text-[#2E7D32] text-[7.5px] font-black">1</span>
                                    <span>Victoire Home (Probabilité élevée)</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="w-3.5 h-3.5 flex items-center justify-center rounded-md border border-[#D0D0D0] bg-[#F5F5F5] text-[#616161] text-[7.5px] font-black">X</span>
                                    <span>Match Nul (Probabilité moyenne)</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="w-3.5 h-3.5 flex items-center justify-center rounded-md border border-[#4CAF50] bg-[#4CAF50] text-white text-[7.5px] font-black">2</span>
                                    <span>Victoire Away (Probabilité élevée)</span>
                                  </div>
                                </div>
                                <div className="flex items-start gap-1 text-gray-400 leading-relaxed pt-0.5">
                                  <span className="text-[10px] text-[#2E7D32] shrink-0 font-extrabold">ⓘ</span>
                                  <p>
                                    Les prédictions sont basées sur des analyses statistiques et peuvent changer. Jouez de manière responsable.
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                ) : selectedLeagueTab === 'results' ? (
                  /* Completed Matches list tab */
                  <div className="space-y-3">
                    {(() => {
                      const completedMatches = matches.filter(
                        (m) => m.leagueId === selectedLeagueId && m.matchStatus === 'FT'
                      );

                      if (completedMatches.length === 0) {
                        return (
                          <div className="text-center py-12 text-slate-500 bg-[#1A1D24] rounded-3xl border border-slate-800 p-6 shadow-sm">
                            <Trophy className="h-8 w-8 mx-auto opacity-30 mb-2 text-slate-600" />
                            <p className="text-xs font-bold text-slate-400">Aucun résultat disponible pour le moment</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-2">
                          {/* TABLE HEADER BAR FOR RESULTS */}
                          <div className="bg-[#1A1D24] border border-slate-800 rounded-xl px-3 py-2 flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-wider select-none">
                            <div className="w-[35%] pl-1">MATCHS TERMINÉS</div>
                            <div className="w-[45%] text-center">RÉSULTAT DU MATCH</div>
                            <div className="w-[20%] text-center">SCORE FINAL</div>
                          </div>

                          {completedMatches.map((m) => (
                            <MatchCard
                              key={m.id}
                              match={m}
                              layout="odds"
                              onBetClick={handleBetClick}
                              selectedBet={betSlip.find((b) => b.matchId === m.id)?.choice}
                              onDetailClick={(matchObj) => setSelectedSimulationMatch(matchObj)}
                            />
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  /* Standings tab */
                  <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-4 overflow-hidden">
                    <div className="flex items-center gap-2 mb-4 px-1">
                      <Trophy className="h-4 w-4 text-[#2E7D32]" />
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        Classement Général Officiel
                      </h4>
                    </div>

                    {standings.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse select-none">
                          <thead>
                            <tr className="border-b border-gray-100 text-[10px] uppercase font-black text-slate-500">
                              <th className="py-2.5 pl-2 text-center w-8">#</th>
                              <th className="py-2.5">Équipe</th>
                              <th className="py-2.5 text-center w-10">MJ</th>
                              <th className="py-2.5 text-center w-8">G</th>
                              <th className="py-2.5 text-center w-8">N</th>
                              <th className="py-2.5 text-center w-8">P</th>
                              <th className="py-2.5 text-center pr-2 w-12 text-[#2E7D32]">Pts</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {standings.map((team, idx) => {
                              const flagInfo = getTeamFlagAndColors(team.name);
                              return (
                                <tr key={team.name} className="hover:bg-gray-50/50 transition-colors text-xs text-slate-600">
                                  <td className="py-3 text-center font-bold font-mono text-slate-400">
                                    {idx + 1}
                                  </td>
                                  <td className="py-3 font-bold flex items-center gap-2 text-slate-800 font-sans">
                                    <span className="text-sm select-none filter drop-shadow-sm">{flagInfo.flag}</span>
                                    <span className="truncate">{team.name}</span>
                                  </td>
                                  <td className="py-3 text-center font-semibold text-slate-500">{team.played}</td>
                                  <td className="py-3 text-center text-slate-500">{team.won}</td>
                                  <td className="py-3 text-center text-slate-500">{team.drawn}</td>
                                  <td className="py-3 text-center text-slate-500">{team.lost}</td>
                                  <td className="py-3 text-center font-black text-[#2E7D32] pr-2">{team.pts}</td>
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

                {/* 8. Bottom Information Sheets (Double Panel from first screenshot!) */}
                {selectedLeagueId === 'all' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-t border-gray-200 pt-6 select-none">
                    {/* Left Panel: Principales Fonctionnalités */}
                    <div className="bg-white border border-gray-200 rounded-3xl p-5 space-y-3 shadow-sm">
                      <h3 className="text-xs font-black text-gray-900 tracking-wider uppercase border-b border-gray-150 pb-2 flex items-center gap-1.5">
                        🌟 FONCTIONNALITÉS PRINCIPALES
                      </h3>
                      <ul className="space-y-2 text-[10px] font-bold text-gray-600 leading-relaxed">
                        <li className="flex items-center gap-2">
                          <span className="text-[#2E7D32] text-xs font-extrabold">✔</span>
                          <span>Prédictions 1X2 avec pourcentages précis</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-[#2E7D32] text-xs font-extrabold">✔</span>
                          <span>Score exact prédit avec probabilités associées</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-[#2E7D32] text-xs font-extrabold">✔</span>
                          <span>Filtres de paris multiples débloqués en temps réel</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-[#2E7D32] text-xs font-extrabold">✔</span>
                          <span>Mise à jour automatique en temps réel chaque heure</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-[#2E7D32] text-xs font-extrabold">✔</span>
                          <span>Indication du niveau de confiance mathématique</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-[#2E7D32] text-xs font-extrabold">✔</span>
                          <span>Design professionnel cohérent sur toutes compétitions</span>
                        </li>
                      </ul>
                    </div>

                    {/* Right Panel: Structure Universelle */}
                    <div className="bg-white border border-gray-200 rounded-3xl p-5 space-y-3 shadow-sm">
                      <h3 className="text-xs font-black text-gray-900 tracking-wider uppercase border-b border-gray-150 pb-2 flex items-center gap-1.5">
                        ⚽ STRUCTURE UNIVERSELLE
                      </h3>
                      <p className="text-[10px] font-semibold text-gray-500 leading-relaxed">
                        Cette structure est appliquée rigoureusement à TOUTES les compétitions sportives virtuelles prises en charge par l'algorithme Sourspark.
                      </p>
                      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 text-[10px] font-bold text-gray-650 space-y-1.5">
                        <p>Les matchs sont mis à jour automatiquement chaque heure :</p>
                        <p className="font-mono text-[#D32F2F] font-black text-xs">
                          12:48, 12:50, 12:52, 12:54, 12:56, 12:58, 13:00, 13:02, 13:04
                        </p>
                      </div>
                    </div>
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
              Billet de Pari Virtuel
            </h3>
            <button
              id="btn-betslip-close"
              onClick={() => setIsBetSlipOpen(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 font-sans"
            >
              Fermer
            </button>
          </div>

          {/* Double-tab header for Selections vs History */}
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl mb-3">
            <button
              id="btn-betslip-tab-selections"
              onClick={() => setBetslipTab('selections')}
              className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                betslipTab === 'selections' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              Sélections ({betSlip.length})
            </button>
            <button
              id="btn-betslip-tab-history"
              onClick={() => setBetslipTab('history')}
              className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                betslipTab === 'history' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              Mes Paris ({activeBets.length + settledBets.length})
            </button>
          </div>

          {betslipTab === 'selections' ? (
            /* Tab 1: Selections & Stake Configuration */
            betSlip.length > 0 ? (
              <div className="space-y-3">
                <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                  {betSlip.map((item) => {
                    const matchObj = matches.find((m) => m.id === item.matchId);
                    if (!matchObj) return null;
                    return (
                      <div key={item.matchId} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl text-[11px]">
                        <div className="truncate pr-2">
                          <span className="font-bold text-slate-800 block truncate">
                            {matchObj.homeTeam} vs {matchObj.awayTeam}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">
                            Sélection: {item.choice === '1' ? '1 (Victoire Dom.)' : item.choice === 'X' ? 'X (Nul)' : '2 (Victoire Ext.)'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-extrabold text-emerald-600 font-mono text-xs">
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
                </div>

                {/* Stake input field */}
                <div className="border-t border-slate-100 pt-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wide">Mise totale:</span>
                    <div className="flex items-center gap-2">
                      <button
                        id="btn-stake-minus"
                        onClick={() => setStake((prev) => Math.max(1000, prev - 1000))}
                        className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="font-bold text-xs text-slate-850 font-mono min-w-[70px] text-center">
                        {stake.toLocaleString('fr-FR')} Ar
                      </span>
                      <button
                        id="btn-stake-plus"
                        onClick={() => setStake((prev) => prev + 1000)}
                        className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Quick Stake Addition Pills */}
                  <div className="flex gap-1 justify-end">
                    {[1000, 5000, 10000].map((amt) => (
                      <button
                        key={amt}
                        id={`btn-quick-stake-${amt}`}
                        onClick={() => setStake((prev) => prev + amt)}
                        className="text-[9px] font-black bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        +{amt.toLocaleString('fr-FR')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Total Summary */}
                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[9px] block">Cotes totales:</span>
                    <span className="font-black text-slate-900 font-mono text-sm">
                      {totalOdds.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 font-bold uppercase text-[9px] block">Gains potentiels:</span>
                    <span className="font-black text-emerald-600 font-mono text-base">
                      {potentialWin.toLocaleString('fr-FR')} Ar
                    </span>
                  </div>
                </div>

                {/* Place Bet Button */}
                <button
                  id="btn-place-bet-pari"
                  onClick={handlePlaceBet}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Trophy className="h-4 w-4" />
                  Placer le Pari ({(stake).toLocaleString('fr-FR')} Ar)
                </button>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400">
                <p className="text-xs font-bold">Aucune sélection active</p>
                <p className="text-[10px] opacity-70 mt-0.5">Cliquez sur une cote du tableau pour parier.</p>
              </div>
            )
          ) : (
            /* Tab 2: Betting History (Active/Settled Bets) */
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {[...activeBets, ...settledBets].length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <p className="text-xs font-bold">Aucun pari enregistré</p>
                  <p className="text-[10px] opacity-70 mt-0.5">Vos paris terminés et en cours s'afficheront ici.</p>
                </div>
              ) : (
                [...activeBets, ...settledBets].map((bet) => (
                  <div key={bet.id} className="border border-slate-100 bg-slate-50/70 p-3 rounded-2xl space-y-2 text-[11px] relative">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wide">
                        ID: {bet.id.slice(-6)}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                          bet.status === 'Won'
                            ? 'bg-emerald-100 text-emerald-700'
                            : bet.status === 'Lost'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700 animate-pulse'
                        }`}
                      >
                        {bet.status === 'Won' ? 'GAGNÉ' : bet.status === 'Lost' ? 'PERDU' : 'EN COURS'}
                      </span>
                    </div>

                    <div className="space-y-1 divide-y divide-slate-100">
                      {bet.selections.map((sel: any) => (
                        <div key={sel.matchId} className="pt-1 first:pt-0 flex justify-between text-xs font-semibold text-slate-700">
                          <span>
                            {sel.homeTeam} - {sel.awayTeam} : <b className="text-slate-900">{sel.choice}</b>
                          </span>
                          <span className="font-mono text-[10px] font-bold text-slate-500">
                            @{sel.odds.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-150 pt-2 text-[10px] font-bold text-slate-500">
                      <div>
                        Mise: <b className="text-slate-800 font-mono">{bet.stake.toLocaleString('fr-FR')} Ar</b>
                      </div>
                      <div className="text-right">
                        Gains: <b className={`${bet.status === 'Won' ? 'text-emerald-600' : 'text-slate-800'} font-mono`}>
                          {bet.potentialWin.toLocaleString('fr-FR')} Ar
                        </b>
                      </div>
                    </div>
                  </div>
                ))
              )}
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

      {/* ADVANCED AI PREDICTION DETAILED SIMULATION & STATS MODAL */}
      {selectedSimulationMatch && (() => {
        const match = selectedSimulationMatch;
        const flagA = getTeamFlagAndColors(match.homeTeam).flag;
        const flagB = getTeamFlagAndColors(match.awayTeam).flag;
        const homeWinPct = match.predictions.homeWinPct ?? 52;
        const drawPct = match.predictions.drawPct ?? 28;
        const awayWinPct = match.predictions.awayWinPct ?? 20;
        const exactScorePct = match.predictions.exactScorePct ?? 35;
        
        // Dynamic simulated details
        const referee = "B. Gassama (Gambia)";
        const weather = "Ensoleillé, 28°C";
        const stadium = `${match.homeTeam} Stadium`;
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-900 via-[#0B1340] to-slate-900 text-white p-5 relative">
                <button 
                  onClick={() => setSelectedSimulationMatch(null)}
                  className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-all cursor-pointer text-xs"
                >
                  ✕
                </button>
                <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest font-mono">
                  ANALYSE PRÉDICTIVE ET SIMULATION IA
                </span>
                <div className="flex justify-between items-center mt-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-300 font-mono font-bold uppercase">{match.leagueName}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{match.round}</span>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border border-emerald-500/20">
                    Précision: 94%
                  </span>
                </div>
              </div>
              
              {/* Main Teams presentation */}
              <div className="p-6 bg-slate-50 border-b border-slate-200/60 text-center relative">
                <div className="flex justify-around items-center gap-2">
                  {/* Home Team */}
                  <div className="flex flex-col items-center w-[38%] min-w-0">
                    <span className="text-5xl filter drop-shadow-md mb-2">{flagA}</span>
                    <span className="text-xs font-black uppercase text-slate-900 truncate w-full">{match.homeTeam}</span>
                    <span className="text-[10px] font-bold text-slate-400 mt-1">Domicile</span>
                  </div>
                  
                  {/* VS / Score area */}
                  <div className="flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-black text-[#0B5D34] bg-[#E8F5E9] px-3 py-1 rounded-full uppercase tracking-widest border border-green-150">
                      VS
                    </span>
                    <span className="text-[10px] font-mono font-black text-slate-400 mt-2 block uppercase tracking-wider">
                      STATISTIQUES
                    </span>
                  </div>
                  
                  {/* Away Team */}
                  <div className="flex flex-col items-center w-[38%] min-w-0">
                    <span className="text-5xl filter drop-shadow-md mb-2">{flagB}</span>
                    <span className="text-xs font-black uppercase text-slate-900 truncate w-full">{match.awayTeam}</span>
                    <span className="text-[10px] font-bold text-slate-400 mt-1">Extérieur</span>
                  </div>
                </div>
              </div>
              
              <div className="p-5 space-y-5 overflow-y-auto max-h-[60vh] scrollbar-none">
                {/* Probabilities */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    PROBABILITÉS DE VICTOIRE (1X2)
                  </span>
                  <div className="flex items-center gap-1.5 h-6 rounded-lg overflow-hidden bg-slate-100 p-0.5">
                    <div style={{ width: `${homeWinPct}%` }} className="bg-[#E8F5E9] border-r border-white flex items-center justify-center text-[#2E7D32] text-[9px] font-black h-full rounded-l-md">
                      1 ({homeWinPct}%)
                    </div>
                    <div style={{ width: `${drawPct}%` }} className="bg-slate-200 border-r border-white flex items-center justify-center text-slate-700 text-[9px] font-black h-full">
                      X ({drawPct}%)
                    </div>
                    <div style={{ width: `${awayWinPct}%` }} className="bg-[#0B5D34] flex items-center justify-center text-white text-[9px] font-black h-full rounded-r-md">
                      2 ({awayWinPct}%)
                    </div>
                  </div>
                  <p className="text-[9px] font-semibold text-slate-400 text-center">
                    Notre modèle prédictif IA estime l'issue du match en faveur de <strong className="text-slate-700 font-extrabold uppercase">{match.predictions.singleTip === '1' ? 'Équipe Domicile' : match.predictions.singleTip === '2' ? 'Équipe Extérieure' : 'Match Nul'} ({match.predictions.singleTip})</strong> avec {match.predictions.singleTip === '1' ? homeWinPct : match.predictions.singleTip === '2' ? awayWinPct : drawPct}% de confiance.
                  </p>
                </div>
                
                {/* Prediction Exact Score Box */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      SCORE EXACT PRÉVU
                    </span>
                    <span className="text-xl font-black font-mono text-slate-800 tracking-tighter mt-1 block">
                      {match.predictions.singleTip === '1' ? '2 - 0' : match.predictions.singleTip === '2' ? '0 - 2' : '1 - 1'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      CONFIANCE IA
                    </span>
                    <span className="text-base font-black text-[#0B5D34] mt-1 block">
                      {exactScorePct}%
                    </span>
                  </div>
                </div>
                
                {/* Detailed metrics table */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    STATISTIQUES DE MATCH PRÉVUES
                  </span>
                  <div className="border border-slate-200/60 rounded-2xl divide-y divide-slate-100 overflow-hidden text-xs text-slate-700">
                    <div className="flex justify-between p-2.5 bg-slate-50/50">
                      <span className="font-semibold text-slate-500">Possession</span>
                      <span className="font-extrabold font-mono text-slate-800">{match.predictions.singleTip === '1' ? '58% - 42%' : match.predictions.singleTip === '2' ? '41% - 59%' : '50% - 50%'}</span>
                    </div>
                    <div className="flex justify-between p-2.5">
                      <span className="font-semibold text-slate-500">Buts attendus (xG)</span>
                      <span className="font-extrabold font-mono text-slate-800">{match.predictions.singleTip === '1' ? '1.92 - 0.74' : match.predictions.singleTip === '2' ? '0.62 - 1.88' : '1.12 - 1.08'}</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-slate-50/50">
                      <span className="font-semibold text-slate-500">Tirs cadrés</span>
                      <span className="font-extrabold font-mono text-slate-800">{match.predictions.singleTip === '1' ? '7 - 3' : match.predictions.singleTip === '2' ? '3 - 8' : '5 - 5'}</span>
                    </div>
                    <div className="flex justify-between p-2.5">
                      <span className="font-semibold text-slate-500">Météo & Arbitre</span>
                      <span className="font-extrabold text-slate-800">{weather} | {referee}</span>
                    </div>
                  </div>
                </div>
                
                {/* Simulation Highlights */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    DÉROULEMENT SIMULÉ DU MATCH
                  </span>
                  <div className="bg-slate-900 text-slate-200 font-mono text-[11px] p-4 rounded-2xl space-y-2 border border-slate-800 leading-relaxed">
                    <p className="text-amber-400 font-bold">[00'] Coup d'envoi virtuel simulé dans notre moteur d'intelligence artificielle.</p>
                    <p>
                      {match.predictions.singleTip === '1' 
                        ? `[14'] But! ${match.homeTeam} ouvre le score sur une frappe limpide à l'entrée de la surface.` 
                        : `[22'] But! ${match.awayTeam} trouve la faille après un débordement rapide sur l'aile droite.`
                      }
                    </p>
                    <p className="text-slate-400">
                      {match.predictions.singleTip === '1'
                        ? `[68'] Occasion manquée pour ${match.awayTeam} : le ballon heurte la transversale.`
                        : `[71'] Arrêt réflexe exceptionnel du gardien de ${match.homeTeam} pour maintenir l'écart.`
                      }
                    </p>
                    <p>
                      {match.predictions.singleTip === '1'
                        ? `[83'] But! Doublé pour ${match.homeTeam} qui scelle définitivement le sort de la rencontre.`
                        : `[89'] But! ${match.awayTeam} aggrave la marque sur un contre parfaitement orchestré.`
                      }
                    </p>
                    <p className="text-green-400 font-bold">[90'] Fin de la simulation. Le modèle valide le prono {match.predictions.singleTip}.</p>
                  </div>
                </div>
              </div>
              
              {/* Footer actions */}
              <div className="bg-slate-50 p-4 border-t border-slate-200/60 flex gap-2.5">
                <button
                  onClick={() => {
                    setSelectedSimulationMatch(null);
                  }}
                  className="flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    handleBetClick(match.id, match.predictions.singleTip as any);
                    setSelectedSimulationMatch(null);
                    setIsBetSlipOpen(true);
                  }}
                  className="flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl bg-[#0B5D34] text-white hover:bg-[#084A29] transition-colors cursor-pointer"
                >
                  Ajouter au Ticket
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
