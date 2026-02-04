import { useState, useEffect } from 'react';
import { TOTAL_MODULES } from '@/lib/data';

const STORAGE_KEY = 'china-club-progress';

export function useProgress() {
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setCompletedModules(JSON.parse(saved));
      } catch {
        setCompletedModules([]);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completedModules));
    }
  }, [completedModules, isLoaded]);

  const toggleModule = (moduleId: string) => {
    setCompletedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const progressPercentage = Math.round((completedModules.length / TOTAL_MODULES) * 100);

  return {
    completedModules,
    toggleModule,
    progressPercentage,
    isLoaded,
  };
}
