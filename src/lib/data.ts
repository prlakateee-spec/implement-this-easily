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
    id: 'alipay',
    title: 'Регистрация Alipay',
    description: 'Настройка платежной системы для работы с Китаем.',
    emoji: '💳',
    modules: [
      { id: 'alipay-intro', title: 'Введение в Alipay', duration: '10 мин', type: 'video' },
      { id: 'alipay-register', title: 'Пошаговая регистрация', duration: '15 мин', type: 'text' },
      { id: 'alipay-verify', title: 'Верификация аккаунта', duration: '20 мин', type: 'video' },
    ],
  },
  {
    id: 'taobao',
    title: 'TaoBao',
    description: 'Крупнейший маркетплейс для розничных покупок.',
    emoji: '🛒',
    modules: [
      { id: 'taobao-intro', title: 'Знакомство с TaoBao', duration: '12 мин', type: 'video' },
      { id: 'taobao-search', title: 'Поиск товаров', duration: '15 мин', type: 'text' },
      { id: 'taobao-order', title: 'Оформление заказа', duration: '20 мин', type: 'video' },
    ],
  },
  {
    id: '1688',
    title: '1688',
    description: 'Оптовая платформа для закупок напрямую с фабрик.',
    emoji: '🏭',
    modules: [
      { id: '1688-intro', title: 'Введение в 1688', duration: '15 мин', type: 'video' },
      { id: '1688-suppliers', title: 'Поиск поставщиков', duration: '20 мин', type: 'text' },
      { id: '1688-negotiate', title: 'Переговоры с фабриками', duration: '25 мин', type: 'video' },
    ],
  },
  {
    id: 'pinduoduo',
    title: 'Pinduoduo',
    description: 'Платформа групповых покупок с низкими ценами.',
    emoji: '🍊',
    modules: [
      { id: 'pdd-intro', title: 'Что такое Pinduoduo', duration: '10 мин', type: 'video' },
      { id: 'pdd-app', title: 'Работа с приложением', duration: '15 мин', type: 'text' },
      { id: 'pdd-deals', title: 'Поиск выгодных сделок', duration: '18 мин', type: 'video' },
    ],
  },
  {
    id: 'contacts',
    title: 'Полезные контакты',
    description: 'База проверенных агентов, карго и сервисов.',
    emoji: '📇',
    modules: [
      { id: 'contacts-agents', title: 'Агенты и посредники', duration: '12 мин', type: 'text' },
      { id: 'contacts-cargo', title: 'Карго-компании', duration: '10 мин', type: 'text' },
      { id: 'contacts-services', title: 'Полезные сервисы', duration: '8 мин', type: 'tool' },
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
