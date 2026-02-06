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
    description: 'Полный гайд по оптовым закупкам на крупнейшей B2B-платформе Китая.',
    emoji: '🏭',
    modules: [
      { id: '1688-install', title: 'Установка 1688', duration: '5 мин', type: 'text' },
      { id: '1688-register', title: 'Регистрация в 1688', duration: '8 мин', type: 'text' },
      { id: '1688-account', title: 'Личный кабинет', duration: '7 мин', type: 'text' },
      { id: '1688-search', title: 'Как искать товар', duration: '10 мин', type: 'text' },
      { id: '1688-product-card', title: 'Обзор карточки товара', duration: '10 мин', type: 'text' },
      { id: '1688-order', title: 'Как заказать товар', duration: '12 мин', type: 'text' },
      { id: '1688-tracking', title: 'Как отследить товар', duration: '5 мин', type: 'text' },
      { id: '1688-refund', title: 'Как вернуть товар', duration: '8 мин', type: 'text' },
    ],
  },
  {
    id: 'pinduoduo',
    title: 'Pinduoduo',
    description: 'Полный гайд по покупкам на платформе групповых покупок с низкими ценами.',
    emoji: '🍊',
    modules: [
      { id: 'pdd-intro', title: 'Что такое Pinduoduo', duration: '5 мин', type: 'text' },
      { id: 'pdd-install', title: 'Установка приложения', duration: '8 мин', type: 'text' },
      { id: 'pdd-register', title: 'Регистрация в приложении', duration: '5 мин', type: 'text' },
      { id: 'pdd-overview', title: 'Обзор приложения', duration: '7 мин', type: 'text' },
      { id: 'pdd-search', title: 'Поиск товаров', duration: '5 мин', type: 'text' },
      { id: 'pdd-product-card', title: 'Обзор карточки товара', duration: '6 мин', type: 'text' },
      { id: 'pdd-specs', title: 'Комплектация и характеристики', duration: '4 мин', type: 'text' },
      { id: 'pdd-reviews', title: 'Отзывы', duration: '3 мин', type: 'text' },
      { id: 'pdd-cart', title: 'Управление корзиной (избранное)', duration: '4 мин', type: 'text' },
      { id: 'pdd-address', title: 'Оформление данных для доставки', duration: '6 мин', type: 'text' },
      { id: 'pdd-payment', title: 'Оплата заказа', duration: '5 мин', type: 'text' },
      { id: 'pdd-tracking', title: 'Отслеживание заказов', duration: '4 мин', type: 'text' },
    ],
  },
  {
    id: 'wechat',
    title: 'WeChat',
    description: 'Полный гайд по установке, регистрации, верификации и настройке платежей в WeChat.',
    emoji: '💬',
    modules: [
      { id: 'wechat-install', title: 'Установка WeChat', duration: '5 мин', type: 'text' },
      { id: 'wechat-register', title: 'Регистрация в WeChat', duration: '10 мин', type: 'text' },
      { id: 'wechat-verify', title: 'Верификация аккаунта', duration: '15 мин', type: 'text' },
      { id: 'wechat-password', title: 'Установка платежного пароля', duration: '5 мин', type: 'text' },
      { id: 'wechat-payments', title: 'Баланс и платежи', duration: '10 мин', type: 'text' },
      { id: 'wechat-change-password', title: 'Изменение платежного пароля', duration: '5 мин', type: 'text' },
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
