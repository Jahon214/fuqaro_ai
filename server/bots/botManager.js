import { createCitizenBot } from "./citizenBot.js";
import { createAdminBot, notifyAdmins } from "./adminBot.js";
import { db } from "../db.js";

class BotManager {
  constructor() {
    this.citizenBot = null;
    this.adminBot = null;
    this.citizenStatus = { connected: false, username: null, error: null };
    this.adminStatus = { connected: false, username: null, error: null };
  }

  async init() {
    const citizenToken = process.env.CITIZEN_BOT_TOKEN || db.cfg.citizenBotToken;
    const adminToken = process.env.ADMIN_BOT_TOKEN || db.cfg.adminBotToken;

    // 1. Initialize Admin Bot
    if (adminToken && adminToken.length > 15) {
      try {
        this.adminBot = createAdminBot(adminToken);
        const me = await this.adminBot.api.getMe();
        this.adminStatus = { connected: true, username: me.username, error: null };
        console.log(`[Admin Bot] Connected successfully as @${me.username}`);

        const webAppUrl = process.env.WEBAPP_URL || db.cfg.webAppUrl || "https://xovos-fuqaroai-psi.vercel.app";
        if (webAppUrl && webAppUrl.startsWith("https://")) {
          try {
            await this.adminBot.api.setChatMenuButton({
              menu_button: { type: "web_app", text: "Xovos Fuqaro AI Panel", web_app: { url: webAppUrl } }
            });
          } catch(e) {
            console.warn("[Admin Bot] setChatMenuButton error:", e.message);
          }
        }

        // Start polling in background
        this.adminBot.start({
          onStart: () => console.log(`[Admin Bot] Polling started...`)
        }).catch(err => {
          console.error("[Admin Bot] Polling error:", err.message);
          this.adminStatus.error = err.message;
        });
      } catch (err) {
        console.error("[Admin Bot] Initialization failed:", err.message);
        this.adminStatus = { connected: false, username: null, error: err.message };
      }
    } else {
      console.log("[Admin Bot] No token provided in .env (ADMIN_BOT_TOKEN). Running in standby/simulator mode.");
      this.adminStatus = { connected: false, username: null, error: "Token kiritilmagan (.env faylda ADMIN_BOT_TOKEN)" };
    }

    // 2. Initialize Citizen Bot
    if (citizenToken && citizenToken.length > 15) {
      try {
        this.citizenBot = createCitizenBot(citizenToken, (newCase) => {
          this.broadcastNewCase(newCase);
        });
        const me = await this.citizenBot.api.getMe();
        this.citizenStatus = { connected: true, username: me.username, error: null };
        console.log(`[Citizen Bot] Connected successfully as @${me.username}`);

        const webAppUrl = process.env.WEBAPP_URL || db.cfg.webAppUrl || "https://xovos-fuqaroai-psi.vercel.app";
        if (webAppUrl && webAppUrl.startsWith("https://")) {
          try {
            await this.citizenBot.api.setChatMenuButton({
              menu_button: { type: "web_app", text: "So'rovnoma", web_app: { url: webAppUrl } }
            });
          } catch(e) {
            console.warn("[Citizen Bot] setChatMenuButton error:", e.message);
          }
        }

        // Start polling in background
        this.citizenBot.start({
          onStart: () => console.log(`[Citizen Bot] Polling started...`)
        }).catch(err => {
          console.error("[Citizen Bot] Polling error:", err.message);
          this.citizenStatus.error = err.message;
        });
      } catch (err) {
        console.error("[Citizen Bot] Initialization failed:", err.message);
        this.citizenStatus = { connected: false, username: null, error: err.message };
      }
    } else {
      console.log("[Citizen Bot] No token provided in .env (CITIZEN_BOT_TOKEN). Running in standby/simulator mode.");
      this.citizenStatus = { connected: false, username: null, error: "Token kiritilmagan (.env faylda CITIZEN_BOT_TOKEN)" };
    }
  }

  /**
   * Broadcasts a new case to Admin Bot
   */
  async broadcastNewCase(newCase) {
    if (this.adminBot && this.adminStatus.connected) {
      await notifyAdmins(this.adminBot, newCase);
    } else {
      console.log(`[BotManager] Notification simulated for Case #${newCase.id} (Admin bot is in standby mode)`);
    }
  }

  getStatus() {
    return {
      citizenBot: this.citizenStatus,
      adminBot: this.adminStatus,
      adminChatCount: (db.cfg.adminChatIds || []).length,
      webAppUrl: db.cfg.webAppUrl || "http://localhost:5173"
    };
  }
}

export const botManager = new BotManager();
