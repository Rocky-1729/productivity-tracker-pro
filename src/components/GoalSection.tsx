import React, { useState } from "react";
import { Target, PlusCircle, Trash2, ArrowUpRight, Check, Dumbbell, Award } from "lucide-react";
import { Goal } from "../types.ts";

interface GoalSectionProps {
  goals: Goal[];
  onAddGoal: (title: string, category: string, targetValue: number) => Promise<void>;
  onUpdateProgress: (id: string, currentValue: number) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
}

export default function GoalSection({ goals, onAddGoal, onUpdateProgress, onDeleteGoal }: GoalSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Study");
  const [targetVal, setTargetVal] = useState("10");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetVal) return;
    const targetValue = parseFloat(targetVal);
    if (isNaN(targetValue) || targetValue <= 0) return;

    setLoading(true);
    try {
      await onAddGoal(title, category, targetValue);
      setTitle("");
      setTargetVal("10");
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStep = async (goal: Goal, delta: number) => {
    const newVal = Math.max(0, goal.currentValue + delta);
    await onUpdateProgress(goal.id, newVal);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl p-6 shadow-xs" id="goals-management-container">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-500" />
            Strategic Achievements & Goals
          </h3>
          <p className="text-xs text-gray-500 dark:text-neutral-400">
            Set and monitor multi-day milestones
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 transition-all flex items-center gap-1 cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          {showAddForm ? "Cancel" : "Add Goal"}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-neutral-800/40 rounded-xl space-y-3 animate-slide-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Goal Indicator</label>
              <input
                type="text"
                placeholder="e.g. Read 12 books, Gym weekly"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Category tag</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
              >
                <option value="Study">📚 Study</option>
                <option value="Work">💼 Work</option>
                <option value="Health">❤️ Health</option>
                <option value="Exercise">🏃 Exercise</option>
                <option value="Personal">👤 Personal</option>
              </select>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Target Value / Counter</label>
              <input
                type="number"
                min="1"
                placeholder="Target count e.g. 1
                "
                value={targetVal}
                onChange={(e) => setTargetVal(e.target.value)}
                className="w-full px-3 py-1.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg cursor-pointer"
            >
              {loading ? "Adding..." : "Add to Milestones"}
            </button>
          </div>
        </form>
      )}

      {goals.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-gray-100 dark:border-neutral-800 rounded-xl text-gray-400">
          <Dumbbell className="w-8 h-8 text-indigo-300 mx-auto mb-2" />
          <p className="text-xs">No active stretch goals yet. Break milestones down into steps!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const completionRate = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
            const isCompleted = goal.currentValue >= goal.targetValue;

            return (
              <div
                key={goal.id}
                id={`goal-item-${goal.id}`}
                className={`p-4 border rounded-xl flex flex-col justify-between transition-all ${
                  isCompleted
                    ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/40"
                    : "bg-gray-50/30 dark:bg-neutral-800/20 border-gray-100 dark:border-neutral-800/85"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 border border-gray-100 dark:border-neutral-700/50">
                      {goal.category}
                    </span>
                    <button
                      onClick={() => onDeleteGoal(goal.id)}
                      className="text-gray-400 hover:text-red-500 transition-all p-1 cursor-pointer"
                      title="Delete goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="font-display font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5 leading-snug">
                    {goal.title}
                    {isCompleted && <Award className="w-4 h-4 text-amber-500 shrink-0" />}
                  </h4>
                </div>

                <div className="mt-4">
                  {/* Values indicator */}
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-neutral-400 mb-1">
                    <span>
                      Progress:{" "}
                      <span className="text-gray-900 dark:text-white font-bold">{goal.currentValue}</span> /{" "}
                      {goal.targetValue}
                    </span>
                    <span>{completionRate}%</span>
                  </div>

                  {/* Progress bar container */}
                  <div className="w-full bg-gray-200 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isCompleted ? "bg-emerald-500" : "bg-indigo-600"
                      }`}
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>

                  {/* Quick increments */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStep(goal, -1)}
                      className="px-2.5 py-1.5 bg-white dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-xs font-bold rounded-lg cursor-pointer"
                      title="Decrement progress"
                      disabled={goal.currentValue <= 0}
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleStep(goal, 1)}
                      className="px-2.5 py-1.5 bg-white dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-xs font-bold rounded-lg cursor-pointer"
                      title="Increment progress"
                      disabled={isCompleted}
                    >
                      +
                    </button>
                    {isCompleted && (
                      <span className="ml-auto text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-0.5">
                        <Check className="w-3.5 h-3.5" /> Met
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
