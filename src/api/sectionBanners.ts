/**
 * Section Banners — stored locally with AsyncStorage.
 * The admin screen writes here; the home screen reads here.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SectionBanner, HomeSectionKey } from '../types';

const STORAGE_KEY = '@vera_section_banners';

async function readAll(): Promise<SectionBanner[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SectionBanner[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(banners: SectionBanner[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(banners));
}

export async function getSectionBanners(
  sectionKey: HomeSectionKey,
): Promise<SectionBanner[]> {
  const all = await readAll();
  return all.filter((b) => b.sectionKey === sectionKey);
}

export async function getAllSectionBanners(): Promise<SectionBanner[]> {
  return readAll();
}

export async function addSectionBanner(
  sectionKey: HomeSectionKey,
  image: string,
  link?: string,
  title?: string,
): Promise<SectionBanner> {
  const all = await readAll();
  const newBanner: SectionBanner = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    sectionKey,
    image: image.trim(),
    link: link?.trim() || undefined,
    title: title?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  await writeAll([...all, newBanner]);
  return newBanner;
}

export async function deleteSectionBanner(id: string): Promise<void> {
  const all = await readAll();
  await writeAll(all.filter((b) => b.id !== id));
}
