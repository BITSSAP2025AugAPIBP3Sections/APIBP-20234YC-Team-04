import { urls, urlClicks, type Url, type UrlStats, type UrlClick, type UrlAnalytics } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, lt, and, gte } from "drizzle-orm";
import { randomBytes } from "crypto";

export interface IStorage {
  createUrl(originalUrl: string, customCode?: string, expiresAt?: Date): Promise<Url>;
  getUrlByShortCode(shortCode: string): Promise<Url | undefined>;
  getUrlById(id: string): Promise<Url | undefined>;
  getAllUrls(): Promise<Url[]>;
  deleteUrl(id: string): Promise<void>;
  incrementClicks(shortCode: string): Promise<void>;
  getStats(): Promise<UrlStats>;
  isShortCodeAvailable(shortCode: string): Promise<boolean>;
  recordClick(urlId: string, referrer?: string, userAgent?: string, ipAddress?: string): Promise<void>;
  getUrlAnalytics(urlId: string): Promise<UrlAnalytics | null>;
  cleanupExpiredUrls(): Promise<number>;
  createBulkUrls(urlsData: Array<{ originalUrl: string; customCode?: string; expiresAt?: Date }>): Promise<Url[]>;
}

function generateShortCode(length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

export class DatabaseStorage implements IStorage {
  async createUrl(originalUrl: string, customCode?: string, expiresAt?: Date): Promise<Url> {
    const shortCode = customCode || generateShortCode();
    const [url] = await db
      .insert(urls)
      .values({ 
        originalUrl, 
        shortCode,
        expiresAt: expiresAt || null
      })
      .returning();
    return url;
  }

  async getUrlByShortCode(shortCode: string): Promise<Url | undefined> {
    const [url] = await db.select().from(urls).where(eq(urls.shortCode, shortCode));
    if (url && url.expiresAt && new Date(url.expiresAt) < new Date()) {
      return undefined;
    }
    return url || undefined;
  }

  async getUrlById(id: string): Promise<Url | undefined> {
    const [url] = await db.select().from(urls).where(eq(urls.id, id));
    return url || undefined;
  }

  async getAllUrls(): Promise<Url[]> {
    return db.select().from(urls).orderBy(desc(urls.createdAt));
  }

  async deleteUrl(id: string): Promise<void> {
    await db.delete(urls).where(eq(urls.id, id));
  }

  async incrementClicks(shortCode: string): Promise<void> {
    await db
      .update(urls)
      .set({ clicks: sql`${urls.clicks} + 1` })
      .where(eq(urls.shortCode, shortCode));
  }

  async getStats(): Promise<UrlStats> {
    const allUrls = await db.select().from(urls);
    
    const totalUrls = allUrls.length;
    const totalClicks = allUrls.reduce((sum, url) => sum + url.clicks, 0);
    
    const mostPopularUrl = allUrls.length > 0
      ? allUrls.reduce((max, url) => url.clicks > max.clicks ? url : max, allUrls[0])
      : null;

    return {
      totalUrls,
      totalClicks,
      mostPopularUrl: mostPopularUrl ? {
        shortCode: mostPopularUrl.shortCode,
        originalUrl: mostPopularUrl.originalUrl,
        clicks: mostPopularUrl.clicks,
      } : null,
    };
  }

  async isShortCodeAvailable(shortCode: string): Promise<boolean> {
    const [existing] = await db.select().from(urls).where(eq(urls.shortCode, shortCode));
    return !existing;
  }

  async recordClick(urlId: string, referrer?: string, userAgent?: string, ipAddress?: string): Promise<void> {
    await db.insert(urlClicks).values({
      urlId,
      referrer: referrer || null,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
    });
  }

  async getUrlAnalytics(urlId: string): Promise<UrlAnalytics | null> {
    const url = await this.getUrlById(urlId);
    if (!url) return null;

    const clicks = await db.select().from(urlClicks).where(eq(urlClicks.urlId, urlId)).orderBy(desc(urlClicks.clickedAt));

    const clicksByDay: Record<string, number> = {};
    const clicksByHour: Record<number, number> = {};
    const referrerCounts: Record<string, number> = {};
    const countryCounts: Record<string, number> = {};

    clicks.forEach(click => {
      const date = new Date(click.clickedAt).toISOString().split('T')[0];
      clicksByDay[date] = (clicksByDay[date] || 0) + 1;

      const hour = new Date(click.clickedAt).getHours();
      clicksByHour[hour] = (clicksByHour[hour] || 0) + 1;

      const ref = click.referrer || 'Direct';
      referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;

      const country = click.country || 'Unknown';
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    });

    return {
      url: {
        id: url.id,
        shortCode: url.shortCode,
        originalUrl: url.originalUrl,
        clicks: url.clicks,
        createdAt: url.createdAt.toISOString(),
        expiresAt: url.expiresAt?.toISOString() || null,
      },
      clicksByDay: Object.entries(clicksByDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30),
      clicksByHour: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: clicksByHour[hour] || 0,
      })),
      topReferrers: Object.entries(referrerCounts)
        .map(([referrer, count]) => ({ referrer, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      topCountries: Object.entries(countryCounts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      recentClicks: clicks.slice(0, 50).map(click => ({
        clickedAt: click.clickedAt.toISOString(),
        referrer: click.referrer,
        country: click.country,
        city: click.city,
      })),
    };
  }

  async cleanupExpiredUrls(): Promise<number> {
    const now = new Date();
    const expired = await db.select().from(urls).where(
      and(
        lt(urls.expiresAt, now)
      )
    );
    
    for (const url of expired) {
      await db.delete(urls).where(eq(urls.id, url.id));
    }
    
    return expired.length;
  }

  async createBulkUrls(urlsData: Array<{ originalUrl: string; customCode?: string; expiresAt?: Date }>): Promise<Url[]> {
    const results: Url[] = [];
    
    for (const data of urlsData) {
      const shortCode = data.customCode || generateShortCode();
      const [url] = await db
        .insert(urls)
        .values({
          originalUrl: data.originalUrl,
          shortCode,
          expiresAt: data.expiresAt || null,
        })
        .returning();
      results.push(url);
    }
    
    return results;
  }
}

export const storage = new DatabaseStorage();
