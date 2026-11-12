import React, { useEffect, useRef, useState } from 'react';
import { Gantt } from '@bryntum/gantt-community';
import '@bryntum/core-community/fontawesome/css/fontawesome.css';
import '@bryntum/core-community/fontawesome/css/solid.css';
import '@bryntum/gantt-community/gantt.css';
import '@bryntum/gantt-community/svalbard-dark.css';
import {
  Calendar,
  Sparkles,
  BarChart3,
} from 'lucide-react';

interface GanttTask {
  id: string;
  name: string;
  contractor: string;
  startDay: number; // Day offset relative to project start
  durationDays: number;
  progress: number; // 0 to 100
  milestoneAmount: number;
  dependencies: string[];
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PLANNED' | 'VERIFIED';
}

const INITIAL_TASKS: GanttTask[] = [
  {
    id: 'TASK-1',
    name: 'Requirements & Gemini AI Prompt Architecture',
    contractor: 'Elena Rostova (UI Designer)',
    startDay: 1,
    durationDays: 2,
    progress: 100,
    milestoneAmount: 1000.00,
    dependencies: [],
    status: 'COMPLETED',
  },
  {
    id: 'TASK-2',
    name: 'Backend API & PayPal Sandbox Webhook Setup',
    contractor: 'Alex Rivera (Full-Stack Engineer)',
    startDay: 3,
    durationDays: 3,
    progress: 75,
    milestoneAmount: 1500.00,
    dependencies: ['TASK-1'],
    status: 'IN_PROGRESS',
  },
  {
    id: 'TASK-3',
    name: 'Channel3 & AG Grid Component Integration',
    contractor: 'Alex Rivera (Full-Stack Engineer)',
    startDay: 6,
    durationDays: 2,
    progress: 30,
    milestoneAmount: 1200.00,
    dependencies: ['TASK-2'],
    status: 'IN_PROGRESS',
  },
  {
    id: 'TASK-4',
    name: 'Deliverable Optical OCR Verification & Payout Release',
    contractor: 'Verification Agent',
    startDay: 8,
    durationDays: 2,
    progress: 0,
    milestoneAmount: 1300.00,
    dependencies: ['TASK-3'],
    status: 'PLANNED',
  },
];

export const ProjectOperationsBryntum: React.FC = () => {
  const [tasks, setTasks] = useState<GanttTask[]>(INITIAL_TASKS);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [optimizationLog, setOptimizationLog] = useState<string | null>(null);
  const [projectStartDate] = useState(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const ganttHostRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<Gantt | null>(null);

  const formatDate = (date: Date) => (
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  );

  const getTaskStartDate = (startDay: number) => {
    const date = new Date(projectStartDate);
    date.setDate(date.getDate() + startDay - 1);
    return formatDate(date);
  };

  const getBryntumTasks = (items: GanttTask[]) => items.map((task) => ({
    id: task.id,
    name: task.name,
    startDate: getTaskStartDate(task.startDay),
    duration: task.durationDays,
    percentDone: task.progress,
  }));

  useEffect(() => {
    if (!ganttHostRef.current) return;

    const gantt = new Gantt({
      appendTo: ganttHostRef.current,
      columns: [{ type: 'name', width: 360 }],
      project: {
        startDate: formatDate(projectStartDate),
        tasks: getBryntumTasks(INITIAL_TASKS),
        dependencies: INITIAL_TASKS.flatMap((task) => task.dependencies.map((fromTask) => ({
          from: fromTask,
          to: task.id,
        }))),
      },
    });
    ganttRef.current = gantt;

    return () => {
      gantt.destroy();
      ganttRef.current = null;
    };
  }, [projectStartDate]);

  useEffect(() => {
    if (ganttRef.current) {
      ganttRef.current.taskStore.data = getBryntumTasks(tasks);
    }
  }, [tasks]);

  const totalBudget = tasks.reduce((acc, t) => acc + t.milestoneAmount, 0);
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const overallProgress = Math.round(
    tasks.reduce((acc, t) => acc + t.progress, 0) / tasks.length
  );

  const handleRunSchedulePreview = () => {
    setIsOptimizing(true);
    setOptimizationLog(null);

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === 'TASK-3') return { ...task, startDay: 5, durationDays: 2 };
        if (task.id === 'TASK-4') return { ...task, startDay: 7, durationDays: 2 };
        return task;
      })
    );
    setIsOptimizing(false);
    setOptimizationLog('Applied a local rule-based schedule adjustment. The Bryntum Gantt reflects the updated task dates; this is not an AI-generated plan.');
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950 border border-blue-800 text-[11px] font-semibold text-blue-300 mb-2">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bryntum Gantt · Illustrative project data</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Project Operations & Milestone Gantt Chart
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed mt-1">
              Review task dates and dependencies in Bryntum Gantt. The tasks and budgets are illustrative and are not linked to contractors or PayPal.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunSchedulePreview}
              disabled={isOptimizing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>{isOptimizing ? 'Updating schedule...' : 'Apply Rule-Based Schedule Preview'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-semibold uppercase">Overall Project Progress</span>
          <div className="text-2xl font-black text-white font-mono tabular-nums">{overallProgress}%</div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 mt-2">
            <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${overallProgress}%` }} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-semibold uppercase">Total Project Budget</span>
          <div className="text-2xl font-black text-emerald-400 font-mono tabular-nums">
            ${totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400">Illustrative budget; not linked to PayPal</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-semibold uppercase">Active Contractors</span>
          <div className="text-2xl font-black text-white font-mono tabular-nums">2 Assigned</div>
          <div className="text-[11px] text-slate-400">Alex Rivera & Elena Rostova</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-semibold uppercase">Estimated Completion</span>
          <div className="text-2xl font-black text-purple-400 font-mono tabular-nums">10 Days</div>
          <div className="text-[11px] text-slate-400">Deadline: Nov 20, 2026</div>
        </div>
      </div>

      {optimizationLog && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-900 text-xs text-emerald-300 flex items-center justify-between animate-fadeIn">
          <span>{optimizationLog}</span>
          <span className="font-mono font-bold bg-emerald-900 px-2 py-0.5 rounded text-[10px]">OPTIMIZED</span>
        </div>
      )}

      {/* Bryntum Gantt */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span>Project task schedule & dependencies</span>
          </span>
          <span className="text-xs text-slate-400">Powered by Bryntum Gantt Community</span>
        </div>
        <div ref={ganttHostRef} className="w-full h-[520px] overflow-hidden rounded-xl" />
      </div>
    </div>
  );
};
