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
    description: 'Полный гайд по установке, регистрации и настройке Alipay для покупок в Китае.',
    emoji: '💳',
    modules: [
      { id: 'alipay-install', title: 'Установка Alipay', duration: '5 мин', type: 'video' },
      { id: 'alipay-register', title: 'Регистрация Alipay', duration: '10 мин', type: 'video' },
      { id: 'alipay-international', title: 'Переключение на международную версию', duration: '5 мин', type: 'text' },
      { id: 'alipay-verify', title: 'Верификация Alipay', duration: '15 мин', type: 'video' },
      { id: 'alipay-password', title: 'Установка платежного пароля', duration: '5 мин', type: 'text' },
      { id: 'alipay-email', title: 'Добавление электронной почты', duration: '5 мин', type: 'text' },
      { id: 'alipay-limit', title: 'Увеличение дневного лимита', duration: '10 мин', type: 'video' },
      { id: 'alipay-language', title: 'Как включить русский язык', duration: '3 мин', type: 'text' },
      { id: 'alipay-forgot-password', title: 'Восстановление платежного пароля', duration: '8 мин', type: 'text' },
      { id: 'alipay-how-works', title: 'Как работает Alipay', duration: '10 мин', type: 'video' },
      { id: 'alipay-payment', title: 'Как оплачивать через Alipay', duration: '12 мин', type: 'video' },
      { id: 'alipay-withdraw', title: 'Как вывести деньги с Alipay', duration: '8 мин', type: 'text' },
      { id: 'alipay-transfer', title: 'Перевод денежных средств внутри Alipay', duration: '7 мин', type: 'text' },
      { id: 'alipay-receive', title: 'Как получать деньги от других пользователей', duration: '5 мин', type: 'text' },
      { id: 'alipay-limits', title: 'Лимиты и ограничения Alipay', duration: '10 мин', type: 'tool' },
    ],
  },
  {
    id: 'taobao',
    title: 'TaoBao',
    description: 'Полный гайд по покупкам на крупнейшем маркетплейсе Китая.',
    emoji: '🛒',
    modules: [
      { id: 'taobao-install', title: 'Установка приложения', duration: '5 мин', type: 'text' },
      { id: 'taobao-register', title: 'Регистрация в приложении', duration: '8 мин', type: 'text' },
      { id: 'taobao-translate', title: 'Как перевести на русский язык', duration: '5 мин', type: 'text' },
      { id: 'taobao-overview', title: 'Обзор приложения', duration: '7 мин', type: 'text' },
      { id: 'taobao-search', title: 'Поиск товаров', duration: '10 мин', type: 'text' },
      { id: 'taobao-product-card', title: 'Обзор карточки товара', duration: '8 мин', type: 'text' },
      { id: 'taobao-specs', title: 'Комплектации и характеристики', duration: '5 мин', type: 'text' },
      { id: 'taobao-reviews', title: 'Отзывы', duration: '5 мин', type: 'text' },
      { id: 'taobao-cart', title: 'Управление корзиной', duration: '7 мин', type: 'text' },
      { id: 'taobao-address', title: 'Оформление данных для доставки', duration: '10 мин', type: 'text' },
      { id: 'taobao-payment', title: 'Оплата заказа', duration: '8 мин', type: 'text' },
      { id: 'taobao-refund', title: 'Возврат заказа', duration: '5 мин', type: 'text' },
      { id: 'taobao-delivery', title: 'Оформление доставки из Китая', duration: '12 мин', type: 'text' },
      { id: 'taobao-tracking', title: 'Где найти трек-номер заказа', duration: '5 мин', type: 'text' },
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
