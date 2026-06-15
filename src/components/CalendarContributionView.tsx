import React, { useState } from "react";
import { CheckCircle, Calendar, Sparkles } from "lucide-react";

interface CalendarContributionViewProps {
  calendarData: Record<string, { count: number; items: string[] }>;
}

export default function CalendarContributionView({ calendarData }: CalendarContributionViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Generate last 30 days
  const last30Days = Array.from({ length: 30 }).map((_, i) => {
    const tzOffset = new Date().getTimezoneOffset() * 60 * 1000;
    const date = new Date(Date.now() - tzOffset - (29 - i) * 86400000);
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  });

  // Calculate grid color intensity
  const getColorClass = (count: number) => {
    if (count === 0) return "bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700";
    if (count <= 1) return "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200";
    if (count <= 3) return "bg-emerald-300 dark:bg-emerald-700 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-400";
    return "bg-emerald-500 dark:bg-emerald-500 text-white hover:bg-emerald-600";
  };

  const getDayLabel = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" });
  };

  const selectedDayInfo = selectedDate ? calendarData[selectedDate] : null;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl p-6 shadow-xs" id="calendar-view">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" />
            Productivity Consistency Calendar
          </h3>
          <p className="text-xs text-gray-500 dark:text-neutral-400">
            Last 30 days active track history. Click a day to view completed tasks.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400">Less</span>
          <div className="w-3 h-3 rounded bg-gray-100 dark:bg-neutral-800"></div>
          <div className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-950"></div>
          <div className="w-3 h-3 rounded bg-emerald-300 dark:bg-emerald-700"></div>
          <div className="w-3 h-3 rounded bg-emerald-500"></div>
          <span className="text-gray-400">More</span>
        </div>
      </div>

      {/* Grid wrapper */}
      <div className="flex flex-wrap gap-2.5 justify-center py-2">
        {last30Days.map((dateStr) => {
          const entry = calendarData[dateStr];
          const count = entry ? entry.count : 0;
          const isSelected = selectedDate === dateStr;

          return (
            <button
              key={dateStr}
              id={`cell-${dateStr}`}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono text-xs font-semibold select-none transition-all cursor-pointer relative ${getColorClass(
                count
              )} ${isSelected ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-neutral-900 scale-110" : ""}`}
              title={`${getDayLabel(dateStr)}: ${count} items completed`}
            >
              {dateStr.split("-")[2]}
              {count > 0 && (
                <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Click details panel */}
      {selectedDate && (
        <div className="mt-5 pt-5 border-t border-gray-100 dark:border-neutral-800 animate-slide-in">
          <h4 className="font-display font-medium text-sm text-gray-800 dark:text-neutral-200 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Activity Log for <span className="font-bold text-gray-900 dark:text-white">{getDayLabel(selectedDate)}</span>
          </h4>
          
          {selectedDayInfo && selectedDayInfo.items.length > 0 ? (
            <ul className="space-y-2">
              {selectedDayInfo.items.map((item, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-sm text-gray-700 dark:text-neutral-300 bg-gray-50 dark:bg-neutral-800/40 px-3 py-2 rounded-lg"
                >
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 dark:text-neutral-500 italic">
              No tasks or habits completed. Build consistency by completing tasks!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
