import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Trash2, ImagePlus, Camera, X, Plus, MessageSquare, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';

type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

type Msg = { role: 'user' | 'assistant'; content: string | ContentPart[] };

interface Conversation {
  id: string;
  title: string;
  messages: Msg[];
  updated_at: string;
}

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

function compressImage(file: File, maxDim: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

const SUGGESTIONS = [
  '📱 Как зарегистрироваться на TaoBao?',
  '👗 Помоги подобрать размер одежды',
  '📦 Сколько стоит доставка 15 кг в Донецк?',
  '🈶 Переведи с китайского на русский',
];

interface KiraChatProps {
  userId: string;
}

export function KiraChat({ userId }: KiraChatProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load conversations list
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('kira_conversations')
        .select('id, title, messages, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      if (data) {
        const convs = data.map(d => ({ ...d, messages: (d.messages as any) || [] })) as Conversation[];
        setConversations(convs);
        // Auto-open last conversation
        if (convs.length > 0 && !activeConvId) {
          setActiveConvId(convs[0].id);
          setMessages(convs[0].messages);
        }
      }
      setLoadingConvs(false);
    };
    load();
  }, [userId]);

  // Auto-save messages to DB (debounced)
  const saveMessages = useCallback((convId: string, msgs: Msg[], autoTitle?: string) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      // Strip base64 images from saved messages to save space — keep only text
      const cleanMsgs = msgs.map(m => {
        if (typeof m.content === 'string') return m;
        const parts = m.content.map(p => {
          if (p.type === 'image_url') return { type: 'text' as const, text: '[📸 Фото]' };
          return p;
        });
        return { ...m, content: parts };
      });

      const updates: any = { messages: cleanMsgs };
      if (autoTitle) updates.title = autoTitle;

      await supabase
        .from('kira_conversations')
        .update(updates)
        .eq('id', convId);

      // Update local list
      setConversations(prev => prev.map(c =>
        c.id === convId
          ? { ...c, messages: cleanMsgs, updated_at: new Date().toISOString(), ...(autoTitle ? { title: autoTitle } : {}) }
          : c
      ));
    }, 1000);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageFiles = async (files: FileList | null) => {
    if (!files) return;
    const newImages: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      // Resize large images to reduce base64 payload
      const base64 = await compressImage(file, 1600, 0.85);
      newImages.push(base64);
    }
    setPendingImages(prev => [...prev, ...newImages]);
  };

  const startNewChat = async () => {
    const { data } = await supabase
      .from('kira_conversations')
      .insert({ user_id: userId, title: 'Новый чат', messages: [] })
      .select('id, title, messages, updated_at')
      .single();

    if (data) {
      const conv = { ...data, messages: [] as Msg[] };
      setConversations(prev => [conv, ...prev]);
      setActiveConvId(conv.id);
      setMessages([]);
      setShowSidebar(false);
    }
  };

  const openConversation = (conv: Conversation) => {
    setActiveConvId(conv.id);
    setMessages(conv.messages);
    setShowSidebar(false);
  };

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('kira_conversations').delete().eq('id', convId);
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConvId === convId) {
      setActiveConvId(null);
      setMessages([]);
    }
  };

  const send = async (text: string, images: string[] = []) => {
    const allImages = [...pendingImages, ...images];
    if (!text.trim() && allImages.length === 0) return;
    if (loading) return;

    // Create conversation if none active
    let convId = activeConvId;
    if (!convId) {
      const { data } = await supabase
        .from('kira_conversations')
        .insert({ user_id: userId, title: 'Новый чат', messages: [] })
        .select('id, title, messages, updated_at')
        .single();
      if (!data) return;
      convId = data.id;
      setActiveConvId(convId);
      setConversations(prev => [{ ...data, messages: [] as Msg[] }, ...prev]);
    }

    let userContent: string | ContentPart[];
    if (allImages.length > 0) {
      const parts: ContentPart[] = [];
      parts.push({ type: 'text', text: text.trim() || 'Проанализируй это изображение — что ты видишь? Дай рекомендации.' });
      allImages.forEach(img => parts.push({ type: 'image_url', image_url: { url: img } }));
      userContent = parts;
    } else {
      userContent = text.trim();
    }

    const userMsg: Msg = { role: 'user', content: userContent };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setPendingImages([]);
    setLoading(true);

    // Auto-title from first message
    const isFirst = messages.length === 0;
    const autoTitle = isFirst ? (text.trim() || 'Анализ фото').slice(0, 60) : undefined;

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
        messages: newMessages,
        onDelta: upsert,
        onDone: () => {
          setLoading(false);
          // Save after streaming completes
          const finalMsgs = [...newMessages, { role: 'assistant' as const, content: assistantSoFar }];
          setMessages(finalMsgs);
          saveMessages(convId!, finalMsgs, autoTitle);
        },
      });
    } catch (e: any) {
      const errorMsg: Msg = { role: 'assistant', content: `❌ ${e.message}` };
      const finalMsgs = [...newMessages, errorMsg];
      setMessages(finalMsgs);
      saveMessages(convId!, finalMsgs, autoTitle);
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
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            {showSidebar ? <ChevronLeft size={20} /> : <MessageSquare size={20} />}
          </Button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">Кира — карманный байер</h1>
            <p className="text-xs text-muted-foreground">Помню все наши разговоры 🧠</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={startNewChat} className="text-muted-foreground">
            <Plus size={16} className="mr-1" /> Новый
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Conversations sidebar */}
        {showSidebar && (
          <div className="absolute inset-0 z-20 bg-background lg:relative lg:w-72 lg:inset-auto flex flex-col border-r border-border">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">💬 Чаты ({conversations.length})</span>
              <Button variant="ghost" size="sm" onClick={startNewChat}>
                <Plus size={16} />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loadingConvs ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                </div>
              ) : conversations.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">Пока нет чатов</p>
              ) : (
                conversations.map(c => (
                  <button
                    key={c.id}
                    onClick={() => openConversation(c)}
                    className={`w-full text-left p-3 rounded-xl transition-all group flex items-start gap-2 ${
                      c.id === activeConvId ? 'bg-secondary text-secondary-foreground' : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <MessageSquare size={14} className="shrink-0 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(c.updated_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                        {' · '}{(c.messages?.length || 0)} сообщ.
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteConversation(c.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </button>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-xl">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">Привет! Я Кира 👋</h2>
                  <p className="text-muted-foreground text-sm max-w-md">
                    Твой карманный байер и эксперт по Китаю. Я запоминаю все наши разговоры — можем продолжить с того места, где остановились! 🧠
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
                    <div className={`max-w-[85%] rounded-2xl text-sm ${
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md px-4 py-3'
                        : 'bg-muted/60 text-foreground rounded-bl-md px-5 py-4'
                    }`}>
                      {imgs.length > 0 && (
                        <div className={`flex flex-wrap gap-2 ${text ? 'mb-3' : ''}`}>
                          {imgs.map((src, j) => (
                            <img key={j} src={src} alt="Фото" className="rounded-lg max-h-48 max-w-full object-cover" />
                          ))}
                        </div>
                      )}
                      {text && m.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none
                          prose-headings:text-foreground prose-headings:font-bold
                          prose-h3:text-base prose-h3:mt-5 prose-h3:mb-2 prose-h3:pb-1 prose-h3:border-b prose-h3:border-border/50
                          prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-2.5 prose-h2:pb-1.5 prose-h2:border-b prose-h2:border-border/50
                          prose-p:my-2.5 prose-p:leading-[1.75]
                          prose-ul:my-2.5 prose-ul:space-y-1.5 prose-ol:my-2.5 prose-ol:space-y-1.5
                          prose-li:my-0 prose-li:leading-[1.75]
                          prose-strong:text-foreground prose-strong:font-semibold
                          prose-hr:my-5 prose-hr:border-border/40
                          prose-code:bg-background/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs
                          [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          <ReactMarkdown>{text}</ReactMarkdown>
                        </div>
                      ) : text ? (
                        <span className="whitespace-pre-wrap leading-[1.75]">{text}</span>
                      ) : null}
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

          {/* Pending images */}
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
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => { handleImageFiles(e.target.files); e.target.value = ''; }} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={e => { handleImageFiles(e.target.files); e.target.value = ''; }} />

          {/* Input */}
          <div className="flex gap-2 items-end">
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="icon"
                className="h-11 w-11 shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
                onClick={() => fileInputRef.current?.click()} disabled={loading} title="Фото из галереи">
                <ImagePlus size={20} />
              </Button>
              <Button type="button" variant="ghost" size="icon"
                className="h-11 w-11 shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
                onClick={() => cameraInputRef.current?.click()} disabled={loading} title="Сфотографировать">
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
      </div>
    </div>
  );
}
