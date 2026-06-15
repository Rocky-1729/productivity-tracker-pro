import React, { useState } from "react";
import { Play, Pause, RotateCcw, SkipForward, Timer, Sparkles, CheckCircle, Bell, Settings2, HelpCircle } from "lucide-react";
import { motion } from "motion/react";
import { Task } from "../types.ts";

interface PomodoroWidgetProps {
  activeTaskId: string | null;
  tasks: Task[];
  seconds: number;
  duration: number;
  isRunning: boolean;
  mode: "focus" | "break";
  completedCount: number;
  onTogglePlay: () => void;
  onReset: () => void;
  onSkip: () => void;
  onSetMode: (mode: "focus" | "break") => void;
  onSelectTask: (taskId: string | null) => void;
  onConfigChange: (focusMins: number, breakMins: number) => void;
}

export default function PomodoroWidget({
  activeTaskId,
  tasks,
  seconds,
  duration,
  isRunning,
  mode,
  completedCount,
  onTogglePlay,
  onReset,
  onSkip,
  onSetMode,
  onSelectTask,
  onConfigChange,
}: PomodoroWidgetProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [customFocusMins, setCustomFocusMins] = useState(25);
  const [customBreakMins, setCustomBreakMins] = useState(5);

  const activeTask = tasks.find((t) => t.id === activeTaskId);
  const percentLeft = duration > 0 ? (seconds / duration) * 100 : 100;
  
  // Format MM:SS
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const pendingTasks = tasks.filter((t) => !t.completed);

  // SVG circular properties
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentLeft / 100) * circumference;

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onConfigChange(customFocusMins, customBreakMins);
    setShowConfig(false);
  };

  return (
    <div 
      className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-3xl p-5 shadow-xs relative overflow-hidden"
      id="pomodoro-sidebar-widget"
    >
      {/* Visual Accent */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 transition-all duration-500 ${
        mode === "focus" 
          ? "bg-red-500 shadow-[0_1px_8px_rgba(239,68,68,0.4)]" 
          : "bg-teal-500 shadow-[0_1px_8px_rgba(20,184,166,0.4)]"
      }`} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-xl ${
            mode === "focus" 
              ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400" 
              : "bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400"
          }`}>
            <Timer className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-black text-sm text-gray-900 dark:text-white leading-none">
              Focus Pomodoro
            </h3>
            <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">
              {mode === "focus" ? "Concentration mode" : "Rest interval"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all cursor-pointer"
            title="Configure interval lengths"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showConfig ? (
        <form onSubmit={handleSaveConfig} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                Focus (Mins)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={customFocusMins}
                onChange={(e) => setCustomFocusMins(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/60 rounded-lg focus:outline-none dark:text-white"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                Break (Mins)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={customBreakMins}
                onChange={(e) => setCustomBreakMins(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/60 rounded-lg focus:outline-none dark:text-white"
                required
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end shrink-0 pt-1">
            <button
              type="button"
              onClick={() => setShowConfig(false)}
              className="px-2.5 py-1 text-[11px] text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg cursor-pointer"
            >
              Apply Limits
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col items-center">
          {/* Circular Countdown Ring */}
          <div className="relative w-36 h-36 flex items-center justify-center my-2">
            <svg className="w-full h-full transform -rotate-90">
              {/* Outer shadow bg circle */}
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-gray-100 dark:stroke-neutral-800"
                strokeWidth="6"
                fill="transparent"
              />
              {/* Progress active circle */}
              <motion.circle
                cx="72"
                cy="72"
                r={radius}
                className={`transition-all duration-100 ${
                  mode === "focus" ? "stroke-red-500" : "stroke-teal-500"
                }`}
                strokeWidth="6"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset }}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Core Clock metrics */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-mono text-2xl font-black text-gray-800 dark:text-white tracking-tight">
                {formatTime(seconds)}
              </span>
              <span className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${
                mode === "focus" ? "text-red-500" : "text-teal-500"
              }`}>
                {mode === "focus" ? "Focus" : "Break"}
              </span>
            </div>
          </div>

          {/* Quick Preset Toggles */}
          <div className="flex gap-1.5 mb-4 text-[10px] font-semibold bg-gray-50 dark:bg-neutral-850 p-1 rounded-xl border border-gray-100/60 dark:border-neutral-800/80">
            <button
              onClick={() => onSetMode("focus")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                mode === "focus"
                  ? "bg-red-500 text-white shadow-xs"
                  : "text-gray-500 dark:text-neutral-400 hover:bg-gray-100/40 dark:hover:bg-neutral-800"
              }`}
            >
              🎯 Work Session
            </button>
            <button
              onClick={() => onSetMode("break")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                mode === "break"
                  ? "bg-teal-500 text-white shadow-xs"
                  : "text-gray-500 dark:text-neutral-400 hover:bg-gray-100/40 dark:hover:bg-neutral-800"
              }`}
            >
              🧘 Quick Rest
            </button>
          </div>

          {/* Associated Active Task */}
          <div className="w-full text-center px-2 mb-4">
            <span className="block text-[9px] uppercase font-bold text-gray-400 dark:text-neutral-500 tracking-wider">
              Focus Association
            </span>
            {activeTask ? (
              <div className="mt-1 flex items-center justify-center gap-1.5">
                <span className="text-xs font-bold text-gray-800 dark:text-neutral-200 truncate max-w-[180px]">
                  📌 {activeTask.title}
                </span>
                <button
                  onClick={() => onSelectTask(null)}
                  className="text-[10px] text-red-500 hover:underline font-bold"
                  title="Detrack active task"
                >
                  Detach
                </button>
              </div>
            ) : (
              <div className="mt-1">
                {pendingTasks.length > 0 ? (
                  <select
                    value={activeTaskId || ""}
                    onChange={(e) => onSelectTask(e.target.value || null)}
                    className="mt-1 text-xs bg-gray-50 dark:bg-neutral-850 text-gray-700 dark:text-neutral-300 border border-gray-200 dark:border-neutral-700 mx-auto rounded-lg px-2 py-1 max-w-[200px] outline-none"
                  >
                    <option value="">-- Associate a Task --</option>
                    {pendingTasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[11px] text-gray-500 dark:text-neutral-400 italic">
                    Create some tasks to track focus!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action buttons controls */}
          <div className="flex items-center gap-3 w-full justify-center">
            <button
              onClick={onReset}
              className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-gray-600 dark:text-neutral-300 rounded-xl transition-all cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onTogglePlay}
              className={`p-3 rounded-2xl flex items-center justify-center text-white shadow-md transition-all cursor-pointer ${
                mode === "focus" 
                  ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" 
                  : "bg-teal-500 hover:bg-teal-600 shadow-teal-500/20"
              }`}
              title={isRunning ? "Pause Track" : "Start Focus Cycle"}
            >
              {isRunning ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            </motion.button>

            <button
              onClick={onSkip}
              className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-gray-600 dark:text-neutral-300 rounded-xl transition-all cursor-pointer"
              title="Skip Session State"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Statistics completed indicator */}
          {completedCount > 0 && (
            <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-neutral-800/80 w-full flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-neutral-450">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>
                Completed:{" "}
                <strong className="text-gray-800 dark:text-white">
                  {completedCount} Pomodoro{completedCount > 1 ? "s" : ""}
                </strong>{" "}
                today!
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
