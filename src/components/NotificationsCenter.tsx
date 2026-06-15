import React, { useState } from "react";
import { Bell, Check, Sparkles, AlertCircle, Calendar, ShieldCheck, Heart } from "lucide-react";
import { AppNotification } from "../types.ts";

interface NotificationsCenterProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => Promise<void>;
}

export default function NotificationsCenter({ notifications, onMarkRead }: NotificationsCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read);

  const getIcon = (type: string) => {
    switch (type) {
      case "alert":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case "success":
        return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      default:
        return <Calendar className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative" id="notifications-dropdown-root">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-neutral-800 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-300 transition-all cursor-pointer select-none"
        title="View notifications"
      >
        <Bell className="w-5 h-5" />
        {unread.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center animate-pulse">
            {unread.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Transparent clickcatcher */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-slide-in">
            <div className="p-4 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
              <h4 className="font-display font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-blue-500" />
                Notifications Center
              </h4>
              <span className="text-[10px] bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full text-gray-500 font-semibold">
                {unread.length} unread
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 dark:divide-neutral-800/80">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-xs">
                  No active reminders or warnings yet. Complete items to keep streaks high!
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3.5 flex gap-2.5 transition-all ${
                      notif.read ? "bg-white dark:bg-neutral-900 opacity-60" : "bg-blue-50/20 dark:bg-neutral-800/20"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{getIcon(notif.type)}</div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-700 dark:text-neutral-300 leading-normal">
                        {notif.text}
                      </p>
                      <span className="text-[9px] text-gray-400 dark:text-neutral-500 mt-1 block">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {!notif.read && (
                      <button
                        onClick={() => onMarkRead(notif.id)}
                        className="text-gray-400 hover:text-emerald-500 p-1 rounded hover:bg-gray-50 dark:hover:bg-neutral-800 h-fit cursor-pointer align-middle shrink-0"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="bg-gray-50 dark:bg-neutral-800/30 p-2 text-center border-t border-gray-100 dark:border-neutral-800/80">
              <button
                onClick={() => setIsOpen(false)}
                className="text-[10px] font-bold text-gray-600 dark:text-neutral-400 hover:underline cursor-pointer"
              >
                Close dropdown
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
