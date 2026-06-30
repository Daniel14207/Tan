/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { SupportMessage } from '../types';
import { Send, ArrowLeft, Bot, User } from 'lucide-react';

interface SupportChatProps {
  messages: SupportMessage[];
  onSendMessage: (text: string) => void;
  onBack: () => void;
}

export default function SupportChat({ messages, onSendMessage, onBack }: SupportChatProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="w-full bg-slate-50 min-h-[calc(100vh-4rem)] flex flex-col text-slate-800">
      {/* Support Chat Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-slate-200">
        <button
          id="btn-support-back"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors focus:outline-none"
        >
          <ArrowLeft className="h-4 w-4 text-slate-600" />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-extrabold tracking-wide text-slate-900">Chat / Support</h2>
          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Support en ligne
          </span>
        </div>
        <div className="w-9" /> {/* Spacer */}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-12rem)] min-h-[300px]">
        {messages.map((msg) => {
          const isBot = msg.sender === 'support';
          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2.5 ${isBot ? 'justify-start' : 'justify-end'}`}
            >
              {isBot && (
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100">
                  <Bot className="h-4 w-4" />
                </span>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3.5 text-xs font-medium leading-relaxed shadow-sm ${
                  isBot
                    ? 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
                    : 'bg-blue-600 text-white rounded-br-none'
                }`}
              >
                <p>{msg.text}</p>
                <span
                  className={`text-[9px] mt-1.5 block text-right ${
                    isBot ? 'text-slate-400 font-normal' : 'text-blue-200'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>

              {!isBot && (
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200 text-slate-700 shadow-sm">
                  <User className="h-4 w-4" />
                </span>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
        <input
          id="support-chat-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Écrivez votre message..."
          className="flex-1 bg-slate-50 text-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-200 placeholder-slate-400"
        />
        <button
          id="btn-support-send"
          type="submit"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1A237E] hover:bg-indigo-900 text-white transition-colors focus:outline-none shadow-md shadow-indigo-600/10"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
