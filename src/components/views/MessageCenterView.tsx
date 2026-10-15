import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MessageSquare,
  Search,
  Send,
  User,
  ShoppingBag,
  ExternalLink,
  Settings,
  AlertCircle,
  CheckCircle2,
  Paperclip,
} from 'lucide-react';
import { toPersianDigits, getTodayJalali } from '../../utils/formatters';

interface Channel {
  id: string;
  name: string;
  icon: string;
  color: string;
  status: 'DISCONNECTED' | 'CONNECTED';
  unreadCount: number;
}

export const MessageCenterView: React.FC = () => {
  const { customers } = useApp();

  const channels: Channel[] = [
    { id: 'insta', name: 'اینستاگرام', icon: '📸', color: 'from-pink-500 to-rose-600', status: 'DISCONNECTED', unreadCount: 0 },
    { id: 'wa', name: 'واتس‌اپ تجاری', icon: '💬', color: 'from-emerald-500 to-teal-600', status: 'DISCONNECTED', unreadCount: 0 },
    { id: 'tg', name: 'تلگرام', icon: '✈️', color: 'from-blue-400 to-sky-600', status: 'DISCONNECTED', unreadCount: 0 },
    { id: 'rubika', name: 'روبیکا', icon: '🟣', color: 'from-purple-500 to-indigo-600', status: 'DISCONNECTED', unreadCount: 0 },
    { id: 'bale', name: 'بله', icon: '🌿', color: 'from-emerald-600 to-green-700', status: 'DISCONNECTED', unreadCount: 0 },
    { id: 'eitaa', name: 'ایتا', icon: '🟠', color: 'from-amber-500 to-orange-600', status: 'DISCONNECTED', unreadCount: 0 },
  ];

  const [selectedChannel, setSelectedChannel] = useState<string>('wa');
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Simulated conversations in local state
  const [conversations, setConversations] = useState<any[]>([
    {
      id: 'c-1',
      channelId: 'wa',
      senderName: 'محمد رضایی (مکانیک)',
      senderPhone: '۰۹۱۲۳۴۵۶۷۸۹',
      lastMessage: 'سلام، لنت ترمز جلو دنا پلاس ایساکویی موجود دارید؟',
      time: '۱۰:۲۵',
      unread: true,
      messages: [
        { sender: 'user', text: 'سلام، وقت بخیر', time: '۱۰:۲۴' },
        { sender: 'user', text: 'لنت ترمز جلو دنا پلاس ایساکویی موجود دارید؟ قیمت چنده؟', time: '۱۰:۲۵' },
      ],
    },
    {
      id: 'c-2',
      channelId: 'tg',
      senderName: 'فروشگاه لوازم یدکی امید',
      senderPhone: '۰۹۳۵۰۰۰۱۱۲۲',
      lastMessage: 'پیش‌فاکتور ارسالی برای تسمه تایم‌ها تأیید شد.',
      time: 'دیروز',
      unread: false,
      messages: [
        { sender: 'store', text: 'سلام و احترام، پیش‌فاکتور اقلام درخواستی ارسال شد.', time: 'دیروز' },
        { sender: 'user', text: 'پیش‌فاکتور ارسالی برای تسمه تایم‌ها تأیید شد. لطفاً بفرستید.', time: 'دیروز' },
      ],
    },
  ]);

  const currentChannelObj = channels.find((c) => c.id === selectedChannel);
  const filteredConversations = conversations.filter((c) => c.channelId === selectedChannel);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeChat) return;

    const newMsg = {
      sender: 'store',
      text: replyText.trim(),
      time: 'اکنون',
    };

    const updated = conversations.map((c) => {
      if (c.id === activeChat.id) {
        return {
          ...c,
          messages: [...c.messages, newMsg],
          lastMessage: replyText.trim(),
        };
      }
      return c;
    });

    setConversations(updated);
    setActiveChat({
      ...activeChat,
      messages: [...activeChat.messages, newMsg],
    });
    setReplyText('');
  };

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
              مرکز یکپارچه پیام‌رسان‌ها و ارتباط با مشتریان
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            پاسخگویی متمرکز به پیام‌های واتس‌اپ، اینستاگرام، تلگرام، بله، ایتا و روبیکا در یک پنجره
          </p>
        </div>

        <button
          onClick={() => setIsConfigModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
        >
          <Settings className="w-4 h-4" />
          <span>تنظیمات وب‌هوک و توکن کانال‌ها</span>
        </button>
      </div>

      {/* Channel selector tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => {
              setSelectedChannel(ch.id);
              setActiveChat(null);
            }}
            className={`p-3 rounded-2xl border text-right transition flex items-center justify-between ${
              selectedChannel === ch.id
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{ch.icon}</span>
              <span className="text-xs font-bold">{ch.name}</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 font-mono">
              قطع
            </span>
          </button>
        ))}
      </div>

      {/* 3-Column Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[600px]">
        {/* Column 1: Conversations List (3.5 cols) */}
        <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="جستجو در گفتگوها..."
                className="w-full pr-8 pl-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-1">
                <p>گفتگویی در کانال {currentChannelObj?.name} یافت نشد.</p>
                <p className="text-[10px]">وضعیت اتصال: تنظیم نشده</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setActiveChat(conv)}
                  className={`p-3 cursor-pointer transition ${
                    activeChat?.id === conv.id
                      ? 'bg-amber-50 dark:bg-amber-950/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white truncate">
                      {conv.senderName}
                    </span>
                    <span className="text-[10px] text-slate-400">{conv.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-1">
                    {conv.lastMessage}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Active Chat Conversation (5.5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {activeChat.senderName}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {toPersianDigits(activeChat.senderPhone)}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {currentChannelObj?.name}
                </span>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/20 text-xs">
                {activeChat.messages.map((m: any, idx: number) => {
                  const isStore = m.sender === 'store';
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isStore ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-xs p-3 rounded-2xl ${
                          isStore
                            ? 'bg-amber-500 text-slate-950 font-medium'
                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="text-[9px] text-slate-400 px-1 mt-0.5">{m.time}</span>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="نوشتن پاسخ و ارسال به مشتری..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 text-xs space-y-2">
              <MessageSquare className="w-10 h-10 stroke-1 text-slate-300" />
              <p>گفتگویی انتخاب نشده است.</p>
              <p className="text-[11px]">از ستون سمت راست یک چت را انتخاب کنید.</p>
            </div>
          )}
        </div>

        {/* Column 3: Customer Profile & Order Tools (3 cols) */}
        <div className="lg:col-span-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between text-xs space-y-4">
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <User className="w-4 h-4 text-amber-500" />
              <span>پروفایل و دفتر حساب مشتری</span>
            </h4>

            {activeChat ? (
              <div className="space-y-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">نام مشتری:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{activeChat.senderName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">شماره تماس:</span>
                  <span className="font-mono">{toPersianDigits(activeChat.senderPhone)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">وضعیت حساب:</span>
                  <span className="text-emerald-600 font-bold">تسویه / بدون بدهی</span>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-[11px]">
                پس از انتخاب گفتگو، اطلاعات مشتری و سوابق سفارشات او در این بخش نمایش داده می‌شود.
              </p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 space-y-1">
            <div className="font-bold flex items-center gap-1 text-slate-700 dark:text-slate-300">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              وضعیت درگاه کانال
            </div>
            <p>اتصال مستقیم API پیام‌رسان {currentChannelObj?.name} هنوز پیکربندی نشده است.</p>
          </div>
        </div>
      </div>

      {/* Webhook & Credentials Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              تنظیمات درگاه پیام‌رسان‌ها
            </h3>
            <p className="text-slate-500 text-[11px]">
              برای دریافت و ارسال پیام‌های واقعی، توکن API یا وب‌هوک رسمی هر پیام‌رسان را وارد کنید:
            </p>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">انتخاب پیام‌رسان</label>
                <select className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <option>واتس‌اپ تجاری (WhatsApp Cloud API)</option>
                  <option>تلگرام (Bot Token)</option>
                  <option>بله (Bale Bot API)</option>
                  <option>ایتا (Eitaa Open API)</option>
                  <option>روبیکا (Rubika Bot)</option>
                  <option>اینستاگرام (Instagram Graph API)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">توکن دسترسی / API Token</label>
                <input
                  type="password"
                  placeholder="Bearer token or bot token..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">نشانی وب‌هوک دریافت رویدادها</label>
                <input
                  type="text"
                  readOnly
                  value="https://api.mohan-auto.ir/webhooks/messages"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-slate-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 text-slate-500"
              >
                بستن
              </button>
              <button
                onClick={() => {
                  alert('تنظیمات امنیتی ذخیره گردید. وضعیت در حالت انتظار تأیید وب‌هوک است.');
                  setIsConfigModalOpen(false);
                }}
                className="px-4 py-2 bg-amber-500 font-bold text-slate-950 rounded-xl"
              >
                ذخیره تنظیمات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
