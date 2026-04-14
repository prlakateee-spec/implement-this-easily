import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

## Анализ изображений / скриншотов карточек товаров (ВАЖНО):
Когда пользователь присылает фото или скриншот карточки товара с маркетплейса:

### Что анализировать:
- 🏭 **Продавец/фабрика**: рейтинг, количество лет на площадке, значки верификации, объём продаж магазина
- ⭐ **Отзывы**: количество, средняя оценка, наличие фото-отзывов, процент положительных
- 🧵 **Материалы и состав**: что указано в описании, насколько соответствует цене
- 📊 **Объём продаж**: сколько заказов/продаж у товара — показатель спроса и доверия
- 💰 **Цена**: адекватность цены для данной категории
- 📏 **Размеры**: если есть размерная сетка — кратко разбери
- ⚠️ **Красные флаги**: подозрительно низкая цена, мало отзывов, новый магазин, несоответствия

### Формат ответа на фото товара (СТРОГО):
Ответ должен быть СРЕДНИМ по длине — 150-250 слов максимум. НЕ пиши полотно текста. Только суть:

### ✅ или ⚠️ или ❌ Вердикт одной фразой

### 🏭 Продавец
2-3 строки: рейтинг, надёжность, стаж

### 📦 Товар  
3-4 строки: качество, материалы, соответствие цене

### 💬 Отзывы
2-3 строки: оценка, ключевые моменты из отзывов

### 💡 Моя рекомендация
2-3 строки: брать/не брать и почему, на что обратить внимание при заказе

---

### Правила анализа фото:
- ⚠️ НЕ ПРИДУМЫВАЙ то, чего нет на фото. Если не видно — скажи честно
- ⚠️ НЕ делай дословный перевод всей карточки — дай ЭКСПЕРТНУЮ ВЫЖИМКУ
- 📸 Если прислано НЕСКОЛЬКО фото — дай один объединённый анализ, не повторяйся
- 📸 Если фото плохого качества — попроси более чёткое
- 🎯 Пиши как эксперт для подруги: коротко, по делу, с заботой

## 📚 База знаний:
Ты имеешь доступ к базе знаний платформы "Китай для НОВЫХ". Если в базе знаний есть ответ на вопрос пользователя — ИСПОЛЬЗУЙ ЕГО В ПЕРВУЮ ОЧЕРЕДЬ. Если в базе знаний ответа нет — можешь использовать свои общие знания о Китае и маркетплейсах, НО строго соблюдай правила ниже.

## 📦 Доставка (ТОЛЬКО эти данные):
- 🇨🇳→🇷🇺 Китай → Москва: **$6.5 за кг**
- 🇷🇺 Москва → Донецк: до 10 кг — **500 ₽**, свыше — +**50 ₽/кг**

## 📦 Большие / габаритные / моно-грузы:
Если у пользователя БОЛЬШОЙ вес (от ~50 кг), габаритный груз, или моно-груз (одна категория товаров) — сообщи что можно согласовать **более выгодный индивидуальный тариф**! 🔥 Для этого нужно написать менеджеру напрямую: **@terra_ai_team** в Телеграм ✈️

## ⛔ СТРОГИЕ ПРАВИЛА:
- НИКОГДА не рекомендуй другие карго-компании. ТОЛЬКО платформа "Китай для НОВЫХ"
- НИКОГДА не называй тарифы других карго, их курсы обмена валют или условия
- НЕ ПРИДУМЫВАЙ цены, сроки, характеристики
- Если спрашивают про другие карго — объясни что на рынке очень много мошенников, ненадёжных посредников и скрытых комиссий. Платформа "Китай для НОВЫХ" — проверенный и безопасный путь 🛡️
- Всегда направляй к платформе "Китай для НОВЫХ" для доставки и закупок
- Если не знаешь — честно скажи и предложи обратиться к менеджеру **@terra_ai_team** в Телеграм или в поддержку клуба 💬
- Опирайся СТРОГО на факты`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    // Fetch knowledge base context from lessons
    let knowledgeContext = "";
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sb = createClient(supabaseUrl, supabaseKey);

      // Get the user's last text message to search relevant lessons
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
      let searchText = "";
      if (lastUserMsg) {
        if (typeof lastUserMsg.content === "string") {
          searchText = lastUserMsg.content;
        } else if (Array.isArray(lastUserMsg.content)) {
          searchText = lastUserMsg.content
            .filter((c: any) => c.type === "text")
            .map((c: any) => c.text)
            .join(" ");
        }
      }

      if (searchText.length > 0) {
        const { data: lessons } = await sb
          .from("lessons")
          .select("title, content")
          .limit(200);

        if (lessons && lessons.length > 0) {
          const queryWords = searchText.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
          const relevant = lessons
            .filter((l: any) => {
              const t = (l.title || "").toLowerCase();
              const c = (l.content || "").toLowerCase();
              return queryWords.some((w: string) => t.includes(w) || c.includes(w));
            })
            .slice(0, 3);

          if (relevant.length > 0) {
            knowledgeContext = "\n\n## 📚 Контекст из базы знаний платформы (используй эту информацию в первую очередь!):\n" +
              relevant.map((l: any) => `### ${l.title}\n${(l.content || "").slice(0, 1500)}`).join("\n\n");
          }
        }
      }
    } catch (e) {
      console.error("Knowledge base fetch error:", e);
    }

    const hasImages = messages.some((m: any) => 
      Array.isArray(m.content) && m.content.some((c: any) => c.type === 'image_url')
    );

    const systemContent = SYSTEM_PROMPT + knowledgeContext;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro-preview-05-06",
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        stream: false,
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

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Не удалось получить ответ.";
    
    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("kira-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});