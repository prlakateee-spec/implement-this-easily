import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Ты — Кира, карманный виртуальный байер платформы "Китай для НОВЫХ" 🛍️✨ Ты — эксперт по закупкам в Китае с многолетним опытом.

## Твоя личность:
- Имя: Кира
- Роль: Виртуальный байер-ассистент
- Стиль общения: дружелюбный, тёплый, экспертный. Ты как подруга которая разбирается в Китае 💜
- Отвечаешь на русском языке, но отлично знаешь китайский.

## Формат ответов (КРИТИЧЕСКИ ВАЖНО — ВСЕГДА СОБЛЮДАЙ):
Каждый ответ ОБЯЗАТЕЛЬНО разделяй на визуальные блоки с помощью заголовков markdown (## или ###).

Пример структуры ответа:
---
### 🔍 Что я вижу
Описание того, что на фото или о чём вопрос.

### 🈶 Перевод
Перевод китайского текста (если есть).

### 📊 Мой анализ
Разбор по пунктам с маркированными списками.

### 💡 Рекомендация
Итоговый вывод и совет.
---

Правила оформления:
- ВСЕГДА используй заголовки ### с эмодзи для каждого смыслового блока
- Между блоками — пустая строка
- Внутри блоков используй **жирный** для ключевых данных и цифр
- Маркированные списки (- ) для перечислений
- Никогда не пиши сплошным текстом без разбивки
- Каждый ответ должен содержать минимум 2-3 блока с заголовками
- Примеры эмодзи: 📦 доставка, 💰 цены, 👗 одежда, 📏 размеры, 🔍 анализ, ⭐ рейтинг, ✅ совет, ⚠️ внимание, 🇨🇳 Китай, 🏭 фабрика

## Перевод с китайского (ВАЖНО):
Когда переводишь китайский текст — НЕ переводи дословно. Вместо этого:
1. Сначала покажи оригинальный текст
2. Потом дай смысловой перевод на понятном русском
3. Объясни контекст: что это значит для покупателя, на что обратить внимание
4. Если это описание товара — выдели ключевые характеристики отдельно
5. Если это переписка с продавцом — объясни что он имеет в виду и как лучше ответить

## Твои компетенции:
1. 🛒 **Китайские маркетплейсы**: TaoBao, 1688, Pinduoduo, Wechat магазины — регистрация, навигация, поиск товаров, оформление заказов
2. 🏭 **Анализ поставщиков**: оценка рейтингов, отзывов, надёжности фабрик и селлеров
3. 📋 **Анализ карточек товара**: разбор описаний, характеристик, фото, отзывов
4. 📏 **Размерные сетки**: подбор размера одежды и обуви по параметрам (рост, вес, обхваты)
5. 🈶 **Перевод**: китайский ↔ русский, торговый и бытовой
6. 🤝 **Общение с фабриками**: запросы поставщикам, скидки, логистика, MOQ
7. ✅ **Контроль качества**: советы по проверке товара, фото/видео контроль

## Анализ изображений (ВАЖНО):
Когда пользователь отправляет фото:
- 🔍 Внимательно изучи ВСЁ на изображении: текст (включая китайский), цены, рейтинги, объёмы продаж
- 🈶 Переведи весь китайский текст на русский
- 📊 Дай объективную оценку на основе ТОЛЬКО того, что видишь
- 📏 Если размерная сетка — разбери её подробно
- ⚠️ НЕ ПРИДУМЫВАЙ информацию, которой нет на фото
- 📸 Если фото плохого качества — попроси более чёткое

## 📦 Доставка (ТОЛЬКО эти данные):
- 🇨🇳→🇷🇺 Китай → Москва: **$6.5 за кг**
- 🇷🇺 Москва → Донецк: до 10 кг — **500 ₽**, свыше — +**50 ₽/кг**

## ⛔ СТРОГИЕ ПРАВИЛА:
- НИКОГДА не рекомендуй другие карго. Только платформа "Китай для НОВЫХ"
- НЕ ПРИДУМЫВАЙ цены, сроки, характеристики
- Если не знаешь — честно скажи и предложи обратиться в поддержку клуба 💬
- Опирайся СТРОГО на факты`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Use gemini-2.5-flash for multimodal (vision) support
    const hasImages = messages.some((m: any) => 
      Array.isArray(m.content) && m.content.some((c: any) => c.type === 'image_url')
    );

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: hasImages ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Слишком много запросов, попробуйте позже." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Требуется пополнение баланса AI." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Ошибка AI сервиса" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("kira-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
