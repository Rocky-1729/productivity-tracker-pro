import React, { useState } from "react";
import { User, LogOut, X, Shield, Sparkles, Loader2, Calendar } from "lucide-react";
import { Api } from "../api.ts";

interface ProfileModalProps {
  user: any;
  onClose: () => void;
  onLogout: () => void;
  onProfileUpdated: (updatedUser: any) => void;
}

const AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
];

export default function ProfileModal({ user, onClose, onLogout, onProfileUpdated }: ProfileModalProps) {
  const [name, setName] = useState(user.name);
  const [selectedAvatar, setSelectedAvatar] = useState(user.profilePic || AVATARS[0]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setSuccessMsg(null);
    try {
      const updated = await Api.auth.updateProfile(name.trim(), selectedAvatar);
      onProfileUpdated(updated);
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = new Date(user.joinedDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in" id="profile-modal-root">
      {/* Clickcatcher */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl z-10 animate-scale-up">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-blue-500" />
          Manage Your Profile
        </h3>

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Avatar Selector Grid */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-neutral-400 mb-2">
              Select Profile Avatar
            </label>
            <div className="flex gap-2 flex-wrap mb-4">
              {AVATARS.map((av) => (
                <button
                  type="button"
                  key={av}
                  onClick={() => setSelectedAvatar(av)}
                  className={`relative w-12 h-12 rounded-full overflow-hidden border-2 cursor-pointer transition-all ${
                    selectedAvatar === av ? "border-blue-500 scale-105 shadow-md" : "border-transparent opacity-65 hover:opacity-100"
                  }`}
                >
                  <img src={av} alt="avatar option" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-neutral-400 mb-1">
              Full Account Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-neutral-400 mb-1">
              Registered Email (Cannot be changed)
            </label>
            <input
              type="email"
              value={user.email}
              className="w-full px-3 py-2.5 bg-gray-100 dark:bg-neutral-800/60 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm text-gray-500 cursor-not-allowed"
              disabled
            />
          </div>

          {/* Productivity stats breakdown */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-800/80">
            <div>
              <span className="block text-[10px] text-gray-400 dark:text-neutral-500 uppercase font-bold tracking-wider">Joined Date</span>
              <span className="font-medium text-xs text-gray-700 dark:text-white flex items-center gap-1 mt-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                {formattedDate}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-gray-400 dark:text-neutral-500 uppercase font-bold tracking-wider">Total Score</span>
              <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                {user.score} pts
              </span>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onLogout}
              className="w-1/3 py-2.5 border border-red-200 hover:border-red-300 dark:border-red-950/60 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/10 font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                "Save Preferences"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
