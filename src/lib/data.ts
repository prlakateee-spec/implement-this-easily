// Course and module data for China Club

export interface Module {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'text' | 'tool';
}

export interface Course {
  id: string;
  title: string;
  description: string;
  emoji: string;
  modules: Module[];
}

export const COURSES: Course[] = [
  {
    id: 'sourcing',
    title: 'Основы сорсинга',
    description: 'Как найти поставщика и не потерять деньги.',
    emoji: '🔍',
    modules: [
      { id: 'intro-1688', title: 'Введение в 1688 и Alibaba', duration: '15 мин', type: 'video' },
      { id: 'scripts', title: 'Скрипты общения с китайцами', duration: '10 мин', type: 'text' },
      { id: 'factory-check', title: 'Чек-лист проверки фабрики', duration: '30 мин', type: 'tool' },
    ],
  },
  {
    id: 'logistics',
    title: 'Логистика и Карго',
    description: 'Белая и серая доставка. Таможня.',
    emoji: '🚢',
    modules: [
      { id: 'route-select', title: 'Выбор маршрута: ЖД, Море или Авиа', duration: '20 мин', type: 'video' },
      { id: 'density-calc', title: 'Расчет плотности груза', duration: '5 мин', type: 'tool' },
    ],
  },
  {
    id: 'branding',
    title: 'Брендинг и OEM',
    description: 'Создаем свой бренд с нуля.',
    emoji: '✨',
    modules: [
      { id: 'tz-production', title: 'Техническое задание (ТЗ) на производство', duration: '45 мин', type: 'text' },
      { id: 'qc-control', title: 'Контроль качества (QC)', duration: '25 мин', type: 'video' },
    ],
  },
];

export const TOTAL_MODULES = COURSES.reduce((acc, course) => acc + course.modules.length, 0);

export interface Achievement {
  id: string;
  title: string;
  emoji: string;
  requiredProgress: number;
  bgClass: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'newbie', title: 'Новичок', emoji: '👶', requiredProgress: 10, bgClass: 'bg-primary/10' },
  { id: 'importer', title: 'Импортер', emoji: '📦', requiredProgress: 50, bgClass: 'bg-accent/10' },
  { id: 'magnate', title: 'Магнат', emoji: '🚢', requiredProgress: 80, bgClass: 'bg-secondary' },
  { id: 'legend', title: 'Легенда', emoji: '👑', requiredProgress: 100, bgClass: 'bg-warning/20' },
];
