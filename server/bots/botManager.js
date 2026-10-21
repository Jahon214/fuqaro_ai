import { createAdminBot, notifyAdmins } from "./adminBot.js";
import { db } from "../db.js";

class BotManager {
  constructor() {
    this.adminBot = null;
    this.adminStatus = { connected: false, username: null, error: null };
  }

  async init() {
    const adminToken = process.env.ADMIN_BOT_TOKEN || db.cfg.adminBotToken || "8816434488:AAHnsPRhLZ7CBj3nAjIYQOonasYkoufeKMc";

    // 1. Initialize Admin Bot (Only Admin Bot is used, Citizen Bot has been decommissioned)
    if (adminToken && adminToken.length > 15) {
      try {
        this.adminBot = createAdminBot(adminToken);
        const me = await this.adminBot.api.getMe();
        this.adminStatus = { connected: true, username: me.username, error: null };
        console.log(`[Admin Bot] Connected successfully as @${me.username}`);

        const webAppUrl = process.env.WEBAPP_URL || db.cfg.webAppUrl || "https://fuqaroxovosai.vercel.app";
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
      adminBot: this.adminStatus,
      adminChatCount: (db.cfg.adminChatIds || []).length,
      webAppUrl: db.cfg.webAppUrl || "https://fuqaroxovosai.vercel.app"
    };
  }
}

export const botManager = new BotManager();
