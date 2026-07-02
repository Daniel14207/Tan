/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface DateItem {
  key: string; // e.g., "2026-06-28"
  weekday: string; // "Sun"
  monthDay: string; // "Jun 28"
}

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (dateStr: string) => void;
}

export default function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const dates = [
    { key: '2026-06-30', weekday: "Auj.", monthDay: "Aujourd'hui" },
    { key: '2026-07-01', weekday: 'Dem.', monthDay: 'Demain' },
    { key: '2026-07-02', weekday: 'Apr. Dem.', monthDay: 'Apr. Demain' },
    { key: 'all_future', weekday: 'Futurs', monthDay: 'Tous Futurs' },
  ];

  return (
    <div className="w-full bg-white/95 px-4 py-3 border-b border-slate-100 overflow-x-auto scrollbar-none flex gap-3 shadow-sm relative z-10">
      {dates.map((item) => {
        const isSelected = selectedDate === item.key;
        return (
          <button
            id={`date-selector-${item.key}`}
            key={item.key}
            onClick={() => onDateChange(item.key)}
            className={`flex flex-col items-center justify-center min-w-[80px] py-1.5 px-2 rounded-xl transition-all duration-200 focus:outline-none select-none border ${
              isSelected
                ? 'bg-[#1A237E] border-[#1A237E] text-white font-bold shadow-md scale-105'
                : 'bg-slate-50 border-slate-200/60 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <span className="text-[9px] uppercase tracking-wider font-extrabold font-sans">
              {item.weekday}
            </span>
            <span className="text-[11px] mt-0.5 font-bold font-sans">
              {item.monthDay}
            </span>
          </button>
        );
      })}
    </div>
  );
}
