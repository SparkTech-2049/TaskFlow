'use client';

import { useState, useEffect, useCallback } from 'react';

export interface CategoryItem {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  subCategories?: CategoryItem[];
}

let cached: CategoryItem[] | null = null;
let fetchPromise: Promise<CategoryItem[]> | null = null;

async function fetchCategories(): Promise<CategoryItem[]> {
  if (cached) return cached;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch('/api/categories')
    .then((r) => r.ok ? r.json() : [])
    .then((data) => {
      const topLevel = data.filter((c: Record<string, unknown>) => !c.parentId && !c.parent_id);
      const subLevel = data.filter((c: Record<string, unknown>) => c.parentId || c.parent_id);
      const mapped: CategoryItem[] = topLevel.map((cat: Record<string, unknown>) => ({
        id: cat.id as string,
        name: cat.name as string,
        color: cat.color as string,
        icon: (cat.icon ?? null) as string | null,
        subCategories: subLevel
          .filter((s: Record<string, unknown>) => (s.parentId || s.parent_id) === cat.id)
          .map((s: Record<string, unknown>) => ({
            id: s.id as string,
            name: s.name as string,
            color: s.color as string,
          })),
      }));
      cached = mapped;
      fetchPromise = null;
      return mapped;
    })
    .catch(() => {
      fetchPromise = null;
      return [] as CategoryItem[];
    });

  return fetchPromise;
}

export function useCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>(cached ?? []);

  useEffect(() => {
    if (cached) {
      setCategories(cached);
      return;
    }
    fetchCategories().then(setCategories);
  }, []);

  const invalidateCache = useCallback(() => {
    cached = null;
    fetchPromise = null;
    fetchCategories().then(setCategories);
  }, []);

  return { categories, invalidateCache };
}
