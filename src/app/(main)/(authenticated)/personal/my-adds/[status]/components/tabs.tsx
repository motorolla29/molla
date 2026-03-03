import ScrollableTabs, {
  type ScrollableTabItem,
} from '@/components/tabs/scrollable-tabs';

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
  const items: ScrollableTabItem[] = [
    {
      id: 'active',
      label: 'Активные',
      count: activeCount,
      countClassName: 'bg-violet-500 text-white',
    },
    {
      id: 'archived',
      label: 'Архив',
      count: archivedCount,
      countClassName: 'bg-gray-500 text-white',
    },
  ];

  return (
    <ScrollableTabs
      className="border-b border-gray-200 mb-6"
      items={items}
      activeId={activeTab}
      onChange={(id) => onTabChange(id as 'active' | 'archived')}
      showBaseLine={false}
      itemSpacingClassName="ml-2 sm:ml-4"
      activeTextClassName="text-violet-700"
      inactiveTextClassName="text-gray-500 hover:text-gray-700"
      indicatorClassName="pointer-events-none absolute bottom-0 h-[2px] bg-violet-400 rounded-full transition-[left,width] duration-300 ease-out"
      scrollClassName="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-thumb-rounded-full scrollbar-track-transparent pt-1 pb-4"
    />
  );
}
