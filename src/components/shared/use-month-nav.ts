import { useState, useMemo } from 'react';

export function useMonthNav() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());

  const label = `${year}年${month + 1}月`;
  const goPrev = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const goNext = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };
  const currentMonthDate = useMemo(() => new Date(year, month, 1), [year, month]);
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

  return { label, goPrev, goNext, currentMonthDate, monthKey, year, month };
}
