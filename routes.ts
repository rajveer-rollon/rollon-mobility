import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User role selection endpoint
  app.post('/api/user/role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.body;
      
      if (!['customer', 'driver', 'dealer', 'ev_station'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      // For dealer and driver roles, set isApproved to false (require admin approval)
      if (role === 'dealer' || role === 'driver') {
        await storage.updateUserRole(userId, role);
        await storage.updateUserApproval(userId, false);
      } else {
        await storage.updateUserRole(userId, role);
      }

      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
