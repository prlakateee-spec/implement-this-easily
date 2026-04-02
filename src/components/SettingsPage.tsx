import { useState, useEffect } from 'react';
import { Save, Plus, X, Link2, FolderPlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Bookmark {
  id: string;
  title: string;
  url: string;
}

interface BookmarkCollection {
  id: string;
  name: string;
  emoji: string;
  bookmarks: Bookmark[];
}

const COLLECTION_EMOJIS = ['📁', '⭐', '🛒', '💡', '🔥', '💎', '🎯', '📌'];

interface SettingsPageProps {
  userName: string;
  onSaveName: (name: string) => void;
  userId?: string;
}

export function SettingsPage({ userName, onSaveName, userId }: SettingsPageProps) {
  const [name, setName] = useState(userName);
  const [nameSaved, setNameSaved] = useState(false);

  // Bookmarks state
  const [collections, setCollections] = useState<BookmarkCollection[]>([]);

  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [newBookmarkTitle, setNewBookmarkTitle] = useState('');
  const [newBookmarkUrl, setNewBookmarkUrl] = useState('');

  // Load collections from DB
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase
        .from('user_profiles')
        .select('collections')
        .eq('user_id', userId)
        .maybeSingle();
      if (data?.collections) {
        try {
          setCollections(typeof data.collections === 'string' ? JSON.parse(data.collections) : data.collections);
        } catch { setCollections([]); }
      }
    })();
  }, [userId]);

  const saveCollections = async (updated: BookmarkCollection[]) => {
    setCollections(updated);
    if (userId) {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase
        .from('user_profiles')
        .update({ collections: updated as any, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
    }
  };

  const handleSaveName = () => {
    onSaveName(name);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  const addCollection = () => {
    if (!newCollectionName.trim()) return;
    const emoji = COLLECTION_EMOJIS[collections.length % COLLECTION_EMOJIS.length];
    saveCollections([...collections, {
      id: crypto.randomUUID(),
      name: newCollectionName.trim(),
      emoji,
      bookmarks: [],
    }]);
    setNewCollectionName('');
    setShowNewCollection(false);
  };

  const deleteCollection = (id: string) => {
    saveCollections(collections.filter(c => c.id !== id));
    if (activeCollection === id) setActiveCollection(null);
  };

  const addBookmark = (collectionId: string) => {
    if (!newBookmarkTitle.trim() || !newBookmarkUrl.trim()) return;
    saveCollections(collections.map(c =>
      c.id === collectionId
        ? { ...c, bookmarks: [...c.bookmarks, { id: crypto.randomUUID(), title: newBookmarkTitle.trim(), url: newBookmarkUrl.trim() }] }
        : c
    ));
    setNewBookmarkTitle('');
    setNewBookmarkUrl('');
  };

  const deleteBookmark = (collectionId: string, bookmarkId: string) => {
    saveCollections(collections.map(c =>
      c.id === collectionId
        ? { ...c, bookmarks: c.bookmarks.filter(b => b.id !== bookmarkId) }
        : c
    ));
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-fade-in-up">
      <h1 className="text-3xl font-bold text-foreground">Личный кабинет</h1>

      {/* Name Settings */}
      <div className="bg-card rounded-2xl p-6 shadow-soft border border-border">
        <h2 className="text-lg font-bold text-foreground mb-4">Твоё имя</h2>
        <p className="text-sm text-muted-foreground mb-4">Так мы будем приветствовать тебя на главной</p>
        <div className="flex gap-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Введи своё имя"
            className="flex-1"
          />
          <Button onClick={handleSaveName} className="gap-2">
            <Save size={16} />
            {nameSaved ? 'Сохранено ✓' : 'Сохранить'}
          </Button>
        </div>
      </div>

      {/* Bookmarks / Collections */}
      <div className="bg-card rounded-2xl p-6 shadow-soft border border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-foreground">Мои подборки</h2>
            <p className="text-sm text-muted-foreground">Сохраняй полезные ссылки по категориям</p>
          </div>
          <Button onClick={() => setShowNewCollection(true)} variant="outline" className="gap-2">
            <FolderPlus size={16} />
            Новая подборка
          </Button>
        </div>

        {/* New collection input */}
        {showNewCollection && (
          <div className="flex gap-3 mb-6 p-4 bg-muted rounded-xl">
            <Input
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Название подборки"
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && addCollection()}
            />
            <Button onClick={addCollection} size="sm">Создать</Button>
            <Button onClick={() => setShowNewCollection(false)} variant="ghost" size="icon">
              <X size={16} />
            </Button>
          </div>
        )}

        {/* Collections grid */}
        {collections.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Link2 size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">Пока нет подборок</p>
            <p className="text-sm">Создай первую подборку, чтобы сохранять полезные ссылки</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className={`rounded-xl border transition-all cursor-pointer ${
                  activeCollection === collection.id
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border bg-muted/30 hover:border-primary/30 hover:bg-muted/50'
                }`}
              >
                <div
                  className="p-4 flex items-center justify-between"
                  onClick={() => setActiveCollection(activeCollection === collection.id ? null : collection.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{collection.emoji}</span>
                    <div>
                      <h3 className="font-bold text-foreground">{collection.name}</h3>
                      <p className="text-xs text-muted-foreground">{collection.bookmarks.length} ссылок</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); deleteCollection(collection.id); }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>

                {activeCollection === collection.id && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                    {collection.bookmarks.map((bookmark) => (
                      <div key={bookmark.id} className="flex items-center gap-2 group">
                        <Link2 size={14} className="text-primary shrink-0" />
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-foreground hover:text-primary truncate flex-1 underline-offset-2 hover:underline"
                        >
                          {bookmark.title}
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteBookmark(collection.id, bookmark.id)}
                        >
                          <X size={12} />
                        </Button>
                      </div>
                    ))}

                    <div className="flex gap-2 pt-2">
                      <Input
                        value={newBookmarkTitle}
                        onChange={(e) => setNewBookmarkTitle(e.target.value)}
                        placeholder="Название"
                        className="flex-1 h-8 text-sm"
                      />
                      <Input
                        value={newBookmarkUrl}
                        onChange={(e) => setNewBookmarkUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 h-8 text-sm"
                      />
                      <Button
                        size="sm"
                        className="h-8"
                        onClick={() => addBookmark(collection.id)}
                      >
                        <Plus size={14} />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
