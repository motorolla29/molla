'use client';

import { useEffect, useRef, useState } from 'react';

export interface ScrollableTabItem {
  id: string;
  label: string;
  count?: number;
  countClassName?: string;
}

interface ScrollableTabsProps {
  items: ScrollableTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string; // wrapper classes (e.g. mb-6)
  showBaseLine?: boolean;
  baseLineClassName?: string;
  scrollClassName?: string;
  listClassName?: string;
  buttonClassName?: string;
  itemSpacingClassName?: string; // applied to buttons except the first
  activeTextClassName?: string;
  inactiveTextClassName?: string;
  indicatorClassName?: string;
}

export default function ScrollableTabs({
  items,
  activeId,
  onChange,
  className = '',
  showBaseLine = true,
  baseLineClassName = 'pointer-events-none absolute bottom-1 h-px w-full bg-gray-200 rounded-full',
  scrollClassName = 'flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-thumb-rounded-full scrollbar-track-transparent pt-1 pb-1',
  listClassName = 'relative flex items-center w-max min-w-full',
  buttonClassName = 'relative px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold hover:cursor-pointer whitespace-nowrap transition-colors duration-150 overflow-visible',
  itemSpacingClassName = '',
  activeTextClassName = 'text-violet-400',
  inactiveTextClassName = 'text-neutral-400 hover:text-gray-400',
  indicatorClassName = 'pointer-events-none absolute bottom-0 h-[2px] bg-violet-400 rounded-full transition-[left,width] duration-300 ease-out z-1',
}: ScrollableTabsProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
  }>({
    left: 0,
    width: 0,
  });

  // Обновляем позицию индикатора при смене активного таба / ресайзе
  useEffect(() => {
    const updateIndicator = () => {
      const el = tabRefs.current[activeId];
      if (el) {
        const left = el.offsetLeft;
        const width = el.offsetWidth;
        setIndicatorStyle({ left, width });
      }
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);

    return () => {
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeId, items.length]);

  const handleClick = (id: string) => {
    if (id !== activeId) {
      onChange(id);
    }
    const el = tabRefs.current[id];
    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  };

  return (
    <div className={className}>
      <div className="relative">
        <div ref={scrollRef} className={scrollClassName}>
          <div className={listClassName}>
            {items.map((item, idx) => (
              <button
                key={item.id}
                ref={(el) => {
                  tabRefs.current[item.id] = el;
                }}
                onClick={() => handleClick(item.id)}
                className={`${buttonClassName} ${
                  activeId === item.id
                    ? activeTextClassName
                    : inactiveTextClassName
                } ${idx > 0 ? itemSpacingClassName : ''}`}
              >
                {item.label}
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`absolute -top-[3px] -right-[3px] text-[8px] sm:text-[10px] font-bold rounded-full min-w-[16px] h-4 sm:min-w-[20px] sm:h-5 flex items-center justify-center px-[6px] ${
                      item.countClassName ?? 'bg-violet-500 text-white'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            ))}

            {/* Анимированный нижний бордер под активным табом */}
            <div
              className={indicatorClassName}
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
              }}
            />
          </div>
        </div>

        {showBaseLine && <div className={baseLineClassName} />}
      </div>
    </div>
  );
}
