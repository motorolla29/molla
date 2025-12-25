interface TabsProps {
  activeTab: 'active' | 'archived';
  activeCount: number;
  archivedCount: number;
  onTabChange: (tab: 'active' | 'archived') => void;
}

export default function Tabs({
  activeTab,
  activeCount,
  archivedCount,
  onTabChange,
}: TabsProps) {
  return (
    <div className="flex border-b border-gray-200 mb-6">
      <button
        onClick={() => {
          if (activeTab !== 'active') {
            onTabChange('active');
          }
        }}
        className={`relative px-4 py-2 text-sm sm:text-base font-semibold hover:cursor-pointer border-b-2 border-transparent transition-colors ${
          activeTab === 'active'
            ? 'border-violet-400 text-violet-700'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Активные
        {activeCount > 0 && (
          <span className="absolute -top-px -right-px sm:-top-[3px] sm:-right-[3px] bg-violet-500 text-white text-[8px] sm:text-[10px] font-bold rounded-full min-w-[16px] h-4 sm:min-w-[20px] sm:h-5 flex items-center justify-center px-[6px]">
            {activeCount}
          </span>
        )}
      </button>
      <button
        onClick={() => {
          if (activeTab !== 'archived') {
            onTabChange('archived');
          }
        }}
        className={`relative ml-6 px-4 py-2 text-sm sm:text-base font-semibold hover:cursor-pointer border-b-2 border-transparent transition-colors ${
          activeTab === 'archived'
            ? 'border-violet-400 text-violet-700'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Архив
        {archivedCount > 0 && (
          <span className="absolute -top-px -right-px sm:-top-[3px] sm:-right-[3px] bg-gray-500 text-white text-[8px] sm:text-[10px] font-bold rounded-full min-w-[16px] h-4 sm:min-w-[20px] sm:h-5 flex items-center justify-center px-[6px]">
            {archivedCount}
          </span>
        )}
      </button>
    </div>
  );
}
