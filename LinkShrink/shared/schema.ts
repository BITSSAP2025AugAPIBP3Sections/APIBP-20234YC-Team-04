import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const urls = pgTable("urls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shortCode: varchar("short_code", { length: 20 }).notNull().unique(),
  originalUrl: text("original_url").notNull(),
  clicks: integer("clicks").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const urlClicks = pgTable("url_clicks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  urlId: varchar("url_id").notNull().references(() => urls.id, { onDelete: "cascade" }),
  clickedAt: timestamp("clicked_at").notNull().defaultNow(),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  country: text("country"),
  city: text("city"),
});

export const urlsRelations = relations(urls, ({ many }) => ({
  clicks: many(urlClicks),
}));

export const urlClicksRelations = relations(urlClicks, ({ one }) => ({
  url: one(urls, {
    fields: [urlClicks.urlId],
    references: [urls.id],
  }),
}));

export const insertUrlSchema = createInsertSchema(urls).pick({
  originalUrl: true,
}).extend({
  originalUrl: z.string().url("Please enter a valid URL"),
  customCode: z.string().min(3, "Custom code must be at least 3 characters").max(20, "Custom code must be at most 20 characters").regex(/^[A-Za-z0-9_-]+$/, "Only letters, numbers, hyphens and underscores allowed").optional(),
  expiresAt: z.string().optional(),
});

export type InsertUrl = z.infer<typeof insertUrlSchema>;
export type Url = typeof urls.$inferSelect;
export type UrlClick = typeof urlClicks.$inferSelect;

export const urlStatsSchema = z.object({
  totalUrls: z.number(),
  totalClicks: z.number(),
  mostPopularUrl: z.object({
    shortCode: z.string(),
    originalUrl: z.string(),
    clicks: z.number(),
  }).nullable(),
});

export type UrlStats = z.infer<typeof urlStatsSchema>;

export const urlAnalyticsSchema = z.object({
  url: z.object({
    id: z.string(),
    shortCode: z.string(),
    originalUrl: z.string(),
    clicks: z.number(),
    createdAt: z.string(),
    expiresAt: z.string().nullable(),
  }),
  clicksByDay: z.array(z.object({
    date: z.string(),
    count: z.number(),
  })),
  clicksByHour: z.array(z.object({
    hour: z.number(),
    count: z.number(),
  })),
  topReferrers: z.array(z.object({
    referrer: z.string(),
    count: z.number(),
  })),
  topCountries: z.array(z.object({
    country: z.string(),
    count: z.number(),
  })),
  recentClicks: z.array(z.object({
    clickedAt: z.string(),
    referrer: z.string().nullable(),
    country: z.string().nullable(),
    city: z.string().nullable(),
  })),
});

export type UrlAnalytics = z.infer<typeof urlAnalyticsSchema>;

export const bulkUrlSchema = z.object({
  urls: z.array(z.object({
    originalUrl: z.string().url("Please enter a valid URL"),
    customCode: z.string().min(3).max(20).regex(/^[A-Za-z0-9_-]+$/).optional(),
    expiresAt: z.string().optional(),
  })).min(1, "At least one URL is required").max(50, "Maximum 50 URLs at once"),
});

export type BulkUrlInput = z.infer<typeof bulkUrlSchema>;
