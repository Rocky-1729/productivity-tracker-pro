import React, { useState, useEffect, useRef } from "react";
import { X, Sparkles, Loader2, Plus, Calendar, Tag } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TaskPriority, TaskType } from "../types.ts";

interface QuickAddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onAddTask: (taskData: {
    title: string;
    description: string;
    category: string;
    priority: TaskPriority;
    type: TaskType;
    dueDate: string;
  }) => Promise<void>;
}

export default function QuickAddTaskModal({
  isOpen,
  onClose,
  categories,
  onAddTask,
}: QuickAddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [type, setType] = useState<TaskType>(TaskType.ONE_TIME);
  const [category, setCategory] = useState(categories[0] || "Personal");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Autofocus the title input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await onAddTask({
        title: title.trim(),
        description: desc.trim(),
        category,
        priority,
        type,
        dueDate,
      });
      // Reset & Close
      setTitle("");
      setDesc("");
      setPriority(TaskPriority.MEDIUM);
      setType(TaskType.ONE_TIME);
      setCategory(categories[0] || "Personal");
      setDueDate("");
      onClose();
    } catch (err) {
      console.error("Quick add failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop mask filter overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-neutral-950/40 dark:bg-neutral-950/60 backdrop-blur-xs"
            id="quick-add-modal-backdrop"
          />

          {/* Minimal Modal Content Wrapper */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-3xl p-6 shadow-xl z-10"
            id="quick-add-modal-body"
          >
            {/* Header close trigger */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-gray-900 dark:text-white leading-none">
                    Quick Capture
                  </h3>
                  <span className="text-[10px] text-gray-450 dark:text-neutral-500 font-medium">
                    Fast activity drafting
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 transition-all cursor-pointer"
                title="Cancel capture"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title draft input */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                  What needs doing?
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="e.g. Finish spreadsheet, Email client"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/60 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500"
                  required
                />
              </div>

              {/* Optional brief note */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                  Short Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Keep it brief (optional)"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/60 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500"
                />
              </div>

              {/* Multi buttons for Priority Selection */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                  Priority level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: TaskPriority.LOW, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100", activeBg: "bg-emerald-600 text-white" },
                    { val: TaskPriority.MEDIUM, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-100", activeBg: "bg-amber-500 text-white" },
                    { val: TaskPriority.HIGH, color: "text-red-600 bg-red-50 dark:bg-red-950/20 border-red-100", activeBg: "bg-red-600 text-white" },
                  ].map((p) => {
                    const isActive = priority === p.val;
                    return (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => setPriority(p.val)}
                        className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          isActive
                            ? `${p.activeBg} border-transparent shadow-xs`
                            : `${p.color} dark:border-neutral-800 hover:opacity-85`
                        }`}
                      >
                        {p.val}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sideby side: Category & Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full pl-7.5 pr-2.5 py-1.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/60 rounded-xl text-xs focus:outline-none text-gray-900 dark:text-white"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                    Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as TaskType)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/60 rounded-xl text-xs focus:outline-none text-gray-900 dark:text-white"
                  >
                    <option value={TaskType.ONE_TIME}>One-Time</option>
                    <option value={TaskType.DAILY}>Daily Habit</option>
                  </select>
                </div>
              </div>

              {/* Optional Due Date */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                  Due Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full pl-7.5 pr-3 py-1.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/60 rounded-xl text-xs focus:outline-none text-gray-900 dark:text-white text-left"
                  />
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Drawer actions footer */}
              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-gray-600 dark:text-neutral-300 font-semibold text-xs rounded-xl cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-55 shadow-xs transition-all"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      Add to List
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
