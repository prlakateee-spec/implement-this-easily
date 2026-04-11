import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, ImagePlus, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type ContentPart = 
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

type Msg = { role: 'user' | 'assistant'; content: string | ContentPart[] };

function getTextContent(msg: Msg): string {
  if (typeof msg.content === 'string') return msg.content;
  return msg.content.filter(c => c.type === 'text').map(c => (c as any).text).join('');
}

function getImages(msg: Msg): string[] {
  if (typeof msg.content === 'string') return [];
  return msg.content.filter(c => c.type === 'image_url').map(c => (c as any).image_url.url);
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kira-chat`;

async function streamChat({
  messages,
  onDelta,
  onDone,
}: {
  messages: Msg[];
  onDelta: (t: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok || !resp.body) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || 'Ошибка подключения к Кире');
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let done = false;

  while (!done) {
    const { done: d, value } = await reader.read();
    if (d) break;
    buf += decoder.decode(value, { stream: true });

    let nl: number;
    while ((nl = buf.indexOf('\n')) !== -1) {
      let line = buf.slice(0, nl);
      buf = buf.slice(nl + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue;
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (json === '[DONE]') { done = true; break; }
      try {
        const parsed = JSON.parse(json);
        const c = parsed.choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch {
        buf = line + '\n' + buf;
        break;
      }
    }
  }
  onDone();
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const SUGGESTIONS = [
  'Как зарегистрироваться на TaoBao?',
  'Помоги подобрать размер одежды',
  'Сколько стоит доставка 15 кг в Донецк?',
  'Переведи с китайского на русский',
];

export function KiraChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageFiles = async (files: FileList | null) => {
    if (!files) return;
    const maxSize = 4 * 1024 * 1024; // 4MB
    const newImages: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > maxSize) {
        alert(`Файл "${file.name}" слишком большой (макс 4 МБ)`);
        continue;
      }
      const base64 = await fileToBase64(file);
      newImages.push(base64);
    }
    setPendingImages(prev => [...prev, ...newImages].slice(0, 4));
  };

  const send = async (text: string, images: string[] = []) => {
    const allImages = [...pendingImages, ...images];
    if (!text.trim() && allImages.length === 0) return;
    if (loading) return;

    let userContent: string | ContentPart[];
    if (allImages.length > 0) {
      const parts: ContentPart[] = [];
      if (text.trim()) {
        parts.push({ type: 'text', text: text.trim() });
      } else {
        parts.push({ type: 'text', text: 'Проанализируй это изображение — что ты видишь? Дай рекомендации.' });
      }
      allImages.forEach(img => {
        parts.push({ type: 'image_url', image_url: { url: img } });
      });
      userContent = parts;
    } else {
      userContent = text.trim();
    }

    const userMsg: Msg = { role: 'user', content: userContent };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setPendingImages([]);
    setLoading(true);

    let assistantSoFar = '';
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        onDelta: upsert,
        onDone: () => setLoading(false),
      });
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${e.message}` }]);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 animate-fade-in-up h-[calc(100vh-80px)] lg:h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Кира — карманный байер</h1>
            <p className="text-xs text-muted-foreground">AI-эксперт по закупкам в Китае</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setMessages([])} className="text-muted-foreground">
            <Trash2 size={16} className="mr-1" /> Очистить
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-xl">
              <Bot className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Привет! Я Кира 👋</h2>
              <p className="text-muted-foreground text-sm max-w-md">
                Твой карманный байер и эксперт по Китаю. Отправь фото карточки товара или размерной сетки — я проанализирую и дам рекомендации!
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => send(s)}
                  className="text-left text-sm p-3 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => {
            const text = getTextContent(m);
            const imgs = getImages(m);
            return (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'
                }`}>
                  {imgs.length > 0 && (
                    <div className={`flex flex-wrap gap-2 ${text ? 'mb-2' : ''}`}>
                      {imgs.map((src, j) => (
                        <img key={j} src={src} alt="Прикреплённое фото" className="rounded-lg max-h-48 max-w-full object-cover" />
                      ))}
                    </div>
                  )}
                  {text && <span className="whitespace-pre-wrap">{text}</span>}
                </div>
                {m.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            );
          })
        )}
        {loading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Pending images preview */}
      {pendingImages.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {pendingImages.map((img, i) => (
            <div key={i} className="relative group">
              <img src={img} alt="" className="w-16 h-16 rounded-lg object-cover border border-border" />
              <button
                onClick={() => setPendingImages(prev => prev.filter((_, j) => j !== i))}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => { handleImageFiles(e.target.files); e.target.value = ''; }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => { handleImageFiles(e.target.files); e.target.value = ''; }}
      />

      {/* Input */}
      <div className="flex gap-2 items-end">
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            title="Фото из галереи"
          >
            <ImagePlus size={20} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
            onClick={() => cameraInputRef.current?.click()}
            disabled={loading}
            title="Сфотографировать"
          >
            <Camera size={20} />
          </Button>
        </div>
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Спроси Киру или отправь фото..."
          className="resize-none min-h-[44px] max-h-32 bg-muted/50 rounded-xl"
          rows={1}
          disabled={loading}
        />
        <Button
          onClick={() => send(input)}
          disabled={(!input.trim() && pendingImages.length === 0) || loading}
          className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white"
          size="icon"
        >
          <Send size={18} />
        </Button>
      </div>
    </div>
  );
}
