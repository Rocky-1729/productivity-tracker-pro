import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { BarChart3, PieChart as PieIcon, LineChart } from "lucide-react";

interface AnalyticsChartsProps {
  summaryData: {
    stats: {
      totalTasks: number;
      completedTasks: number;
      pendingTasks: number;
      completionRate: number;
    };
    categories: Record<string, { completed: number; total: number }>;
    weekly: Array<{ date: string; day: string; completed: number }>;
    monthly: Array<{ label: string; completed: number }>;
  } | null;
}

export default function AnalyticsCharts({ summaryData }: AnalyticsChartsProps) {
  if (!summaryData) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl p-8 text-center text-gray-400">
        Loading interactive charts...
      </div>
    );
  }

  // Parse category data for charts
  const categoryChartData = Object.entries(summaryData.categories).map(([name, { completed, total }]) => ({
    name,
    completed,
    total,
    pending: Math.max(0, total - completed),
  }));

  // Parse completion pie chart
  const pieData = [
    { name: "Completed", value: summaryData.stats.completedTasks, color: "#10b981" },
    { name: "Pending", value: summaryData.stats.pendingTasks, color: "#9ca3af" },
  ];

  // If no tasks, show mock empty rate indicator in Pie Chart
  if (summaryData.stats.totalTasks === 0) {
    pieData[1] = { name: "Add tasks to see progress!", value: 1, color: "#cbd5e1" };
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="analytics-charts-grid">
      
      {/* Category distribution bar chart */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex flex-col h-[320px]">
        <h4 className="font-display font-semibold text-sm text-gray-800 dark:text-neutral-200 mb-3 flex items-center gap-1.5 shrink-0">
          <BarChart3 className="w-4 h-4 text-blue-500" />
          Active Tasks by Category
        </h4>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" className="dark:opacity-5" />
              <XAxis dataKey="name" fontSize={11} stroke="#9ca3af" tickLine={false} />
              <YAxis fontSize={11} stroke="#9ca3af" tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "12px" }}
              />
              <Legend verticalAlign="top" height={36} iconSize={10} fontSize={11} />
              <Bar name="Completed" dataKey="completed" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar name="Pending" dataKey="pending" fill="#9ca3af" opacity={0.3} stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Completion Pie Chart */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex flex-col h-[320px]">
        <h4 className="font-display font-semibold text-sm text-gray-800 dark:text-neutral-200 mb-3 flex items-center gap-1.5 shrink-0">
          <PieIcon className="w-4 h-4 text-emerald-500" />
          Task Completion Efficiency
        </h4>
        <div className="flex-1 w-full min-h-0 flex items-center justify-center relative">
          <div className="w-2/3 h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="font-display text-2xl font-bold text-gray-900 dark:text-white">
              {summaryData.stats.completionRate}%
            </span>
            <span className="text-[10px] text-gray-400 dark:text-neutral-500 uppercase tracking-wider font-semibold">
              Completed
            </span>
          </div>
        </div>
      </div>

      {/* Weekly Progress Over Area Chart */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex flex-col h-[320px]">
        <h4 className="font-display font-semibold text-sm text-gray-800 dark:text-neutral-200 mb-3 flex items-center gap-1.5 shrink-0">
          <LineChart className="w-4 h-4 text-violet-500" />
          Weekly Productivity Trends (Last 7 Days)
        </h4>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={summaryData.weekly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorWeekly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" className="dark:opacity-5" />
              <XAxis dataKey="day" fontSize={11} stroke="#9ca3af" tickLine={false} />
              <YAxis fontSize={11} stroke="#9ca3af" tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "12px" }}
              />
              <Area type="monotone" name="Items Done" dataKey="completed" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorWeekly)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly productivity overview */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex flex-col h-[320px]">
        <h4 className="font-display font-semibold text-sm text-gray-800 dark:text-neutral-200 mb-3 flex items-center gap-1.5 shrink-0">
          <LineChart className="w-4 h-4 text-blue-500" />
          Monthly Analytics History (Last 30 Days)
        </h4>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={summaryData.monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} strokeWidth={2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" className="dark:opacity-5" />
              <XAxis dataKey="label" fontSize={9} stroke="#9ca3af" tickLine={false} interval={2} />
              <YAxis fontSize={11} stroke="#9ca3af" tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "12px" }}
              />
              <Area type="monotone" name="Items Done" dataKey="completed" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorMonthly)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
