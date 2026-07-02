/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { NotificationItem } from '../types';
import { Bell, CheckSquare, Settings2, Trash2 } from 'lucide-react';

interface NotificationPanelProps {
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

export default function NotificationPanel({
  notifications,
  onMarkAsRead,
  onClearAll,
  onClose,
}: NotificationPanelProps) {
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'unread') return !item.read;
    return true;
  });

  return (
    <div className="w-full bg-transparent min-h-[calc(100vh-4rem)] p-4 text-slate-800">
      {/* Header card banner */}
      <div className="mb-4 flex items-center gap-4 rounded-3xl bg-white p-4 text-slate-800 shadow-sm border border-slate-100">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
          <Bell className="h-6 w-6" />
        </span>
        <div>
          <h3 className="text-base font-extrabold tracking-tight text-slate-900">
            Notifications
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            Control match alerts and smart tip notifications.
          </p>
        </div>
      </div>

      {/* Tabs bar */}
      <div className="mb-4 flex rounded-2xl bg-slate-200 p-1 border border-slate-300/60">
        <button
          id="btn-notif-tab-notifications"
          onClick={() => setActiveTab('notifications')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'notifications'
              ? 'bg-white text-slate-900 font-extrabold shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          📝 Notifications
        </button>
        <button
          id="btn-notif-tab-settings"
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'settings'
              ? 'bg-white text-slate-900 font-extrabold shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          ⚙️ Settings
        </button>
      </div>

      {activeTab === 'notifications' ? (
        <>
          {/* Subfilter filters bar */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                id="btn-notif-filter-all"
                onClick={() => setFilter('all')}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                  filter === 'all'
                    ? 'bg-[#1A237E] text-white shadow-sm'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                All
              </button>
              <button
                id="btn-notif-filter-unread"
                onClick={() => setFilter('unread')}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                  filter === 'unread'
                    ? 'bg-[#1A237E] text-white shadow-sm'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                Unread
              </button>
            </div>

            {notifications.length > 0 && (
              <button
                id="btn-notif-clear-all"
                onClick={onClearAll}
                className="text-xs text-red-600 hover:text-red-500 flex items-center gap-1 font-bold"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* List of notifications */}
          {filteredNotifications.length > 0 ? (
            <div className="space-y-3">
              {filteredNotifications.map((item) => (
                <div
                  id={`notification-item-${item.id}`}
                  key={item.id}
                  onClick={() => onMarkAsRead(item.id)}
                  className={`flex items-start gap-4 rounded-3xl p-4 shadow-sm border transition-all cursor-pointer ${
                    item.read
                      ? 'bg-white text-slate-800 border-slate-100'
                      : 'bg-blue-50/50 text-slate-900 border-blue-200/50'
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                    item.read ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'
                  }`}>
                    <Bell className="h-5 w-5" />
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-xs font-bold truncate ${item.read ? 'text-slate-800 font-semibold' : 'text-slate-900 font-extrabold'}`}>
                        {item.title}
                      </h4>
                      <span className={`rounded-md px-2 py-0.5 text-[9px] font-bold ${
                        item.read ? 'bg-slate-100 text-slate-500' : 'bg-blue-600 text-white'
                      }`}>
                        {item.read ? 'Read' : 'New'}
                      </span>
                    </div>
                    <p className={`text-[11px] mt-1 leading-relaxed ${item.read ? 'text-slate-500 font-medium' : 'text-slate-700 font-semibold'}`}>
                      {item.content}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono mt-1.5 block">
                      {item.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
              <Bell className="h-10 w-10 opacity-30 mb-2" />
              <p className="text-xs font-bold">No notifications available</p>
              <p className="text-[10px] opacity-70">Check back later for updates.</p>
            </div>
          )}
        </>
      ) : (
        /* Settings panel inside Notifications */
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4 text-slate-800">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
            System Alerts Settings
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Push Notifications</span>
                <span className="text-[10px] text-slate-400">Receive real-time match outcome updates.</span>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded bg-white border-slate-300 accent-[#1A237E]" />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-800 block">AI Tips Highlights</span>
                <span className="text-[10px] text-slate-400">Alert me when top-performing AI tips are ready.</span>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded bg-white border-slate-300 accent-[#1A237E]" />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Email Newsletter</span>
                <span className="text-[10px] text-slate-400">Weekly digests with odds boost events list.</span>
              </div>
              <input type="checkbox" className="h-4 w-4 rounded bg-white border-slate-300 accent-[#1A237E]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
