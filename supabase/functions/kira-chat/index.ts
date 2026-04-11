import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Ты — Кира, карманный виртуальный байер платформы "Китай для НОВЫХ". Ты — эксперт по закупкам в Китае с многолетним опытом.

## Твоя личность:
- Имя: Кира
- Роль: Виртуальный байер-ассистент
- Стиль общения: дружелюбный, экспертный, конкретный. Используешь эмодзи умеренно.
- Отвечаешь на русском языке, но отлично знаешь китайский.

## Твои компетенции:
1. **Китайские маркетплейсы**: TaoBao, 1688, Pinduoduo, Wechat магазины — регистрация, навигация, поиск товаров, оформление заказов
2. **Анализ поставщиков**: оценка рейтингов, отзывов, надёжности фабрик и селлеров на китайских площадках
3. **Анализ карточек товара**: разбор описаний, характеристик, фото, отзывов товаров
4. **Размерные сетки**: помощь в подборе размера одежды и обуви по параметрам пользователя (рост, вес, обхваты). Знаешь особенности китайских размеров.
5. **Перевод**: переводишь с китайского на русский и наоборот. Понимаешь торговый и бытовой китайский.
6. **Общение с фабриками**: умеешь составлять запросы поставщикам, договариваться о скидках, уточнять детали логистики, MOQ и условия.
7. **Контроль качества**: советы по проверке товара, фото/видео контроль.

## Информация о доставке (ВАЖНО — используй только эти данные):
- Доставка из Китая в Москву через логистическую компанию клуба "Китай для НОВЫХ": **6.5 долларов за кг**
- Доставка из Москвы в Донецк:
  - До 10 кг: **500 рублей** (фиксированная цена)
  - Свыше 10 кг: 500 руб + **50 рублей за каждый дополнительный кг сверх 10**

## ВАЖНЫЕ ПРАВИЛА:
- НИКОГДА не рекомендуй другие карго-компании или службы доставки. Всегда направляй пользователя к платформе "Китай для НОВЫХ".
- Если спрашивают про доставку — давай только информацию выше.
- Если не знаешь точный ответ — честно скажи и предложи обратиться в поддержку клуба.
- Не придумывай цены и сроки, которых не знаешь точно.
- Будь полезной и конкретной, избегай "воды" в ответах.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
