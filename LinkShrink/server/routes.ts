import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUrlSchema, bulkUrlSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/urls", async (req, res) => {
    try {
      const result = insertUrlSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: result.error.errors[0]?.message || "Invalid URL" 
        });
      }

      if (result.data.customCode) {
        const isAvailable = await storage.isShortCodeAvailable(result.data.customCode);
        if (!isAvailable) {
          return res.status(400).json({ error: "This custom code is already taken" });
        }
      }

      const expiresAt = result.data.expiresAt ? new Date(result.data.expiresAt) : undefined;
      const url = await storage.createUrl(result.data.originalUrl, result.data.customCode, expiresAt);
      return res.status(201).json(url);
    } catch (error) {
      console.error("Error creating URL:", error);
      return res.status(500).json({ error: "Failed to create short URL" });
    }
  });

  app.post("/api/urls/bulk", async (req, res) => {
    try {
      const result = bulkUrlSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: result.error.errors[0]?.message || "Invalid input" 
        });
      }

      for (const urlData of result.data.urls) {
        if (urlData.customCode) {
          const isAvailable = await storage.isShortCodeAvailable(urlData.customCode);
          if (!isAvailable) {
            return res.status(400).json({ error: `Custom code "${urlData.customCode}" is already taken` });
          }
        }
      }

      const urlsData = result.data.urls.map(u => ({
        originalUrl: u.originalUrl,
        customCode: u.customCode,
        expiresAt: u.expiresAt ? new Date(u.expiresAt) : undefined,
      }));

      const createdUrls = await storage.createBulkUrls(urlsData);
      return res.status(201).json(createdUrls);
    } catch (error) {
      console.error("Error creating bulk URLs:", error);
      return res.status(500).json({ error: "Failed to create short URLs" });
    }
  });

  app.get("/api/urls", async (req, res) => {
    try {
      const urls = await storage.getAllUrls();
      return res.json(urls);
    } catch (error) {
      console.error("Error fetching URLs:", error);
      return res.status(500).json({ error: "Failed to fetch URLs" });
    }
  });

  app.get("/api/urls/:id", async (req, res) => {
    try {
      const url = await storage.getUrlById(req.params.id);
      if (!url) {
        return res.status(404).json({ error: "URL not found" });
      }
      return res.json(url);
    } catch (error) {
      console.error("Error fetching URL:", error);
      return res.status(500).json({ error: "Failed to fetch URL" });
    }
  });

  app.get("/api/urls/:id/analytics", async (req, res) => {
    try {
      const analytics = await storage.getUrlAnalytics(req.params.id);
      if (!analytics) {
        return res.status(404).json({ error: "URL not found" });
      }
      return res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      return res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.delete("/api/urls/:id", async (req, res) => {
    try {
      const url = await storage.getUrlById(req.params.id);
      if (!url) {
        return res.status(404).json({ error: "URL not found" });
      }
      await storage.deleteUrl(req.params.id);
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting URL:", error);
      return res.status(500).json({ error: "Failed to delete URL" });
    }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      return res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      return res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/check-code/:code", async (req, res) => {
    try {
      const isAvailable = await storage.isShortCodeAvailable(req.params.code);
      return res.json({ available: isAvailable });
    } catch (error) {
      console.error("Error checking code:", error);
      return res.status(500).json({ error: "Failed to check code availability" });
    }
  });

  app.post("/api/cleanup", async (req, res) => {
    try {
      const count = await storage.cleanupExpiredUrls();
      return res.json({ cleaned: count });
    } catch (error) {
      console.error("Error cleaning up:", error);
      return res.status(500).json({ error: "Failed to cleanup expired URLs" });
    }
  });

  app.get("/:shortCode([A-Za-z0-9_-]{3,20})", async (req, res, next) => {
    const shortCode = req.params.shortCode;

    try {
      const url = await storage.getUrlByShortCode(shortCode);
      
      if (!url) {
        return next();
      }

      await storage.incrementClicks(shortCode);
      
      const referrer = req.get('Referer') || req.get('Referrer') || undefined;
      const userAgent = req.get('User-Agent') || undefined;
      const ipAddress = req.ip || req.connection.remoteAddress || undefined;
      
      await storage.recordClick(url.id, referrer, userAgent, ipAddress);

      return res.redirect(301, url.originalUrl);
    } catch (error) {
      console.error("Error redirecting:", error);
      return next();
    }
  });

  return httpServer;
}
