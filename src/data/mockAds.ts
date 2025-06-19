export interface AdBase {
  id: string;
  category: string;
  title: string;
  description: string;
  city: string;
  cityLabel: string;
  address: string;
  location: { lat: number; lng: number };
  price?: number;
  currency?: 'RUB' | 'USD' | 'EUR';
  datePosted: string; // ISO-string
  photos: string[];
  seller: {
    id: string;
    name: string;
    rating: number; // от 0 до 5
    contact: {
      type: 'phone' | 'email' | 'chat';
      value: string;
    };
  };
  details: string; // теперь просто текст
}

export const mockAds: AdBase[] = [
  {
    id: '1',
    category: 'goods',
    title: 'Новый смартфон XYZ, 128GB',
    description:
      'Продам новый смартфон XYZ 128GB, полностью запечатан, гарантия 2 года. Цвет: черный.',
    city: 'Москва',
    cityLabel: 'moscow',
    address: 'г. Москва, ул. Арбат, д. 12',
    location: { lat: 55.752023, lng: 37.617499 },
    price: 39990,
    currency: 'RUB',
    datePosted: '2025-06-10T10:15:00Z',
    photos: ['1.jpg', '2.jpg', '3.jpg'],
    seller: {
      id: 'seller1',
      name: 'Иван Иванов',
      rating: 4.8,
      contact: { type: 'phone', value: '+7 (912) 345-67-89' },
    },
    details: 'Смартфон в идеальном состоянии, запечатан, гарантия 2 года.',
  },
  {
    id: '2',
    category: 'services',
    title: 'Репетитор по английскому языку',
    description:
      'Опытный репетитор предлагает занятия по английскому онлайн и оффлайн. Подготовка к экзаменам, разговорный английский.',
    city: 'Санкт-Петербург',
    cityLabel: 'saint_petersburg',
    address: 'г. Санкт-Петербург, пр. Невский, д. 50',
    location: { lat: 59.93428, lng: 30.335099 },
    price: 1000,
    currency: 'RUB',
    datePosted: '2025-06-09T14:30:00Z',
    photos: [], // нет фотографий
    seller: {
      id: 'seller2',
      name: 'Екатерина Петрова',
      rating: 4.5,
      contact: { type: 'email', value: 'kate.petrov@example.com' },
    },
    details:
      'Занятия по английскому: подготовка к экзаменам, разговорный уровень. Опыт 5 лет.',
  },
  {
    id: '3',
    category: 'realestate',
    title: '1-комнатная квартира в аренду, центр',
    description:
      'Сдам 1-комнатную квартиру 35м² в центре города, рядом метро. Мебель, интернет, без комиссии.',
    city: 'Новосибирск',
    cityLabel: 'novosibirsk',
    address: 'г. Новосибирск, ул. Ленина, д. 100',
    location: { lat: 55.030199, lng: 82.92043 },
    price: 25000,
    currency: 'RUB',
    datePosted: '2025-06-08T09:00:00Z',
    photos: ['4.webp', '5.jpg', '6.jpg'],
    seller: {
      id: 'seller3',
      name: 'Андрей Смирнов',
      rating: 4.2,
      contact: { type: 'phone', value: '+7 (913) 987-65-43' },
    },
    details:
      '1-комнатная квартира 35 м², 3/5 этаж, меблирована, интернет включён, без комиссии. Аренда от 6 месяцев.',
  },
  {
    id: '4',
    category: 'auto',
    title: 'Продам Toyota Corolla 2015',
    description:
      'Toyota Corolla 2015 года, пробег 85000 км, бензин, автомат. Своевременное техобслуживание, без аварий.',
    city: 'Екатеринбург',
    cityLabel: 'yekaterinburg',
    address: 'г. Екатеринбург, ул. Малышева, д. 10',
    location: { lat: 56.838926, lng: 60.605702 },
    price: 700000,
    currency: 'RUB',
    datePosted: '2025-06-07T11:20:00Z',
    photos: ['7.jpg', '8.jpg'],
    seller: {
      id: 'seller4',
      name: 'Ольга Кузнецова',
      rating: 4.7,
      contact: { type: 'phone', value: '+7 (950) 123-45-67' },
    },
    details:
      'Toyota Corolla 2015, пробег 85000 км, бензин, автомат, без аварий, своевременное ТО.',
  },
  {
    id: '5',
    category: 'goods',
    title: 'Диван IKEA б/у, хорошее состояние',
    description:
      'Удобный диван из IKEA, двухместный, б/у, состояние отличное. Нужно только перевезти.',
    city: 'Казань',
    cityLabel: 'kazan',
    address: 'г. Казань, ул. Баумана, д. 20',
    location: { lat: 55.790278, lng: 49.134722 },
    price: 8000,
    currency: 'RUB',
    datePosted: '2025-06-05T16:45:00Z',
    photos: [],
    seller: {
      id: 'seller5',
      name: 'Руслан Галкин',
      rating: 4.1,
      contact: { type: 'chat', value: 'chat_user_5' },
    },
    details:
      'Диван IKEA двухместный, в отличном состоянии, б/у, требует только перевозки.',
  },
  {
    id: '6',
    category: 'services',
    title: 'Услуги грузчиков',
    description:
      'Грузчики для переезда, любые этажи. Без выходных. Цена договорная в зависимости от объёма.',
    city: 'Москва',
    cityLabel: 'moscow',
    address: 'г. Москва, метро Таганская',
    location: { lat: 55.74, lng: 37.65 },
    price: 500,
    currency: 'RUB',
    datePosted: '2025-06-06T08:30:00Z',
    photos: ['9.png', '10.jpg'],
    seller: {
      id: 'seller6',
      name: 'Петр Новиков',
      rating: 4.3,
      contact: { type: 'phone', value: '+7 (901) 234-56-78' },
    },
    details:
      'Услуги грузчиков для переезда, круглосуточно. Оплата по часам или договорная.',
  },
  {
    id: '7',
    category: 'realestate',
    title: 'Продам участок 10 соток',
    description:
      'Участок 10 соток в пригороде, ИЖС. Электричество рядом, подъездная дорога асфальтирована.',
    city: 'Санкт-Петербург',
    cityLabel: 'saint_petersburg',
    address: 'Ленинградская обл., Всеволожский р-н',
    location: { lat: 60.0, lng: 30.5 },
    price: 1200000,
    currency: 'RUB',
    datePosted: '2025-06-04T12:00:00Z',
    photos: [],
    seller: {
      id: 'seller7',
      name: 'Мария Волкова',
      rating: 4.6,
      contact: { type: 'email', value: 'maria.volkova@example.com' },
    },
    details:
      'Участок 10 соток в пригороде, ИЖС, электричество рядом, асфальтированный подъезд.',
  },
  {
    id: '8',
    category: 'auto',
    title: 'Nissan Leaf 2018, электромобиль',
    description:
      'Электромобиль Nissan Leaf 2018 года, пробег 40000 км, полный электропакет. Зарядка от обычной розетки.',
    city: 'Новосибирск',
    cityLabel: 'novosibirsk',
    address: 'г. Новосибирск, ул. Красный проспект',
    location: { lat: 55.03, lng: 82.92 },
    price: 1200000,
    currency: 'RUB',
    datePosted: '2025-06-03T09:15:00Z',
    photos: ['7.jpg', '8.jpg'],
    seller: {
      id: 'seller8',
      name: 'Дмитрий Орлов',
      rating: 4.4,
      contact: { type: 'phone', value: '+7 (913) 555-66-77' },
    },
    details:
      'Nissan Leaf 2018, пробег 40000 км, электромобиль, полная комплектация.',
  },
  {
    id: '9',
    category: 'services',
    title: 'Курьерская доставка по городу',
    description:
      'Быстрая курьерская доставка документов и небольших посылок по Москве.',
    city: 'Москва',
    cityLabel: 'moscow',
    address: 'г. Москва, офисный центр Сити',
    location: { lat: 55.755826, lng: 37.6173 },
    price: 300,
    currency: 'RUB',
    datePosted: '2025-06-02T13:00:00Z',
    photos: ['11.jpg'],
    seller: {
      id: 'seller9',
      name: 'Анна Соколова',
      rating: 4.9,
      contact: { type: 'chat', value: 'sokolova_chat' },
    },
    details:
      'Курьерская доставка документов и мелких посылок по Москве, быстро.',
  },
  {
    id: '10',
    category: 'goods',
    title: 'Кофемашина б/у, в хорошем состоянии',
    description:
      'Кофемашина Bosch, пробег небольшой, регулярно чистилась. Есть инструкция.',
    city: 'Казань',
    cityLabel: 'kazan',
    address: 'г. Казань, переулок Пушкина, д. 5',
    location: { lat: 55.79, lng: 49.13 },
    price: 5000,
    currency: 'RUB',
    datePosted: '2025-06-01T10:00:00Z',
    photos: ['1.jpg', '2.jpg'],
    seller: {
      id: 'seller10',
      name: 'Илья Козлов',
      rating: 4.0,
      contact: { type: 'phone', value: '+7 (927) 111-22-33' },
    },
    details: 'Кофемашина Bosch, б/у, в хорошем состоянии, есть инструкция.',
  },
  {
    id: '11',
    category: 'realestate',
    title: 'Продаётся 2-комнатная квартира',
    description:
      'Продам 2-комнатную квартиру 55м², хороший ремонт, рядом парковка и магазины.',
    city: 'Екатеринбург',
    cityLabel: 'yekaterinburg',
    address: 'г. Екатеринбург, ул. Вайнера, д. 20',
    location: { lat: 56.838, lng: 60.605 },
    price: 5500000,
    currency: 'RUB',
    datePosted: '2025-05-30T15:30:00Z',
    photos: ['4.webp', '5.jpg', '6.jpg'],
    seller: {
      id: 'seller11',
      name: 'Светлана Морозова',
      rating: 4.5,
      contact: { type: 'phone', value: '+7 (900) 222-33-44' },
    },
    details:
      '2-комнатная квартира 55 м², хороший ремонт, 5/9 этаж, рядом парковка и магазины.',
  },
  {
    id: '12',
    category: 'auto',
    title: 'Велосипед горный, почти новый',
    description:
      'Горный велосипед Trek, куплен год назад, использовался несколько раз. Рама 18".',
    city: 'Санкт-Петербург',
    cityLabel: 'saint_petersburg',
    address: 'г. Санкт-Петербург, ул. Петроградская набережная',
    location: { lat: 59.96, lng: 30.28 },
    price: 15000,
    currency: 'RUB',
    datePosted: '2025-05-28T11:00:00Z',
    photos: [],
    seller: {
      id: 'seller12',
      name: 'Максим Иванов',
      rating: 4.2,
      contact: { type: 'email', value: 'max.ivanov@example.com' },
    },
    details: 'Горный велосипед Trek 18", почти новый, пробег ~100 км.',
  },
  {
    id: '13',
    category: 'services',
    title: 'Дизайн логотипов и фирменного стиля',
    description:
      'Профессиональный дизайнер предлагает услуги по разработке логотипов, брендбука и полиграфии.',
    city: 'Казань',
    cityLabel: 'kazan',
    address: 'г. Казань, ул. Кремлёвская, д. 1',
    location: { lat: 55.797, lng: 49.123 },
    price: 20000,
    currency: 'RUB',
    datePosted: '2025-05-25T09:45:00Z',
    photos: ['11.jpg'],
    seller: {
      id: 'seller13',
      name: 'Алексей Сидоров',
      rating: 4.9,
      contact: { type: 'email', value: 'alex.sidorov@example.com' },
    },
    details:
      'Услуги дизайна: логотипы, брендбук, полиграфия. Фиксированная цена, срок обсуждается.',
  },
  {
    id: '14',
    category: 'goods',
    title: 'Книги: классическая литература',
    description:
      'Набор из 10 книг классической литературы в хорошем состоянии. Цена за весь набор.',
    city: 'Москва',
    cityLabel: 'moscow',
    address: 'г. Москва, ул. Тверская, д. 15',
    location: { lat: 55.764, lng: 37.605 },
    price: 3000,
    currency: 'RUB',
    datePosted: '2025-05-20T12:00:00Z',
    photos: [],
    seller: {
      id: 'seller14',
      name: 'Марина Лебедева',
      rating: 4.3,
      contact: { type: 'chat', value: 'marina_lebed_chat' },
    },
    details:
      'Набор из 10 книг классической литературы, состояние хорошее, цена за весь комплект.',
  },
  {
    id: '15',
    category: 'realestate',
    title: 'Комната в коммуналке, недорого',
    description:
      'Сдам комнату 12м² в коммунальной квартире. Район тихий, метро в шаговой доступности.',
    city: 'Новосибирск',
    cityLabel: 'novosibirsk',
    address: 'г. Новосибирск, ул. Достоевского, д. 5',
    location: { lat: 55.031, lng: 82.9205 },
    price: 10000,
    currency: 'RUB',
    datePosted: '2025-05-18T08:00:00Z',
    photos: ['1.jpg', '2.jpg'],
    seller: {
      id: 'seller15',
      name: 'Ольга Белова',
      rating: 4.0,
      contact: { type: 'phone', value: '+7 (913) 333-44-55' },
    },
    details:
      'Комната 12 м², коммуналка, 2/5 этаж, без мебели, аренда от 3 месяцев.',
  },
];
