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
  const dates: DateItem[] = [
    { key: '2026-06-28', weekday: 'Sun', monthDay: 'Jun 28' },
    { key: '2026-06-29', weekday: 'Mon', monthDay: 'Jun 29' },
    { key: '2026-06-30', weekday: 'Tue', monthDay: 'Jun 30' },
    { key: '2026-07-01', weekday: 'Wed', monthDay: 'Jul 1' },
    { key: '2026-07-02', weekday: 'Thu', monthDay: 'Jul 2' },
  ];

  return (
    <div className="w-full bg-white px-4 py-3 border-b border-gray-200 overflow-x-auto scrollbar-none flex gap-3">
      {dates.map((item) => {
        const isSelected = selectedDate === item.key;
        return (
          <button
            id={`date-selector-${item.key}`}
            key={item.key}
            onClick={() => onDateChange(item.key)}
            className={`flex flex-col items-center justify-center min-w-[76px] py-2 rounded-xl transition-all duration-200 focus:outline-none select-none border ${
              isSelected
                ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-md scale-105'
                : 'bg-transparent border-transparent text-gray-500 opacity-60 hover:opacity-100 hover:bg-slate-50'
            }`}
          >
            <span className="text-[10px] uppercase tracking-wider font-bold font-sans">
              {item.weekday}
            </span>
            <span className="text-sm mt-0.5 font-bold font-sans">
              {item.monthDay.split(' ')[1] || item.monthDay}
            </span>
          </button>
        );
      })}
    </div>
  );
}
