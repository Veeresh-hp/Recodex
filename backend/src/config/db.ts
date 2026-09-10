import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "mongodb+srv://Recodex:Recodex2004@recodex.wahwbbo.mongodb.net/recodex?appName=Recodex";
}

export const realPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "mongodb+srv://Recodex:Recodex2004@recodex.wahwbbo.mongodb.net/recodex?appName=Recodex",
    },
  },
  log: ["error"],
});

// Mock Storage
const MOCK_USERS: any[] = [
  { id: "sandbox-admin-001", email: "veereshhp2004@gmail.com", name: "Veeresh H P", role: "admin", profileImage: null, createdAt: new Date(), updatedAt: new Date() },
  { id: "sandbox-dev-002", email: "veereshhp04@gmail.com", name: "Veeresh H P (Dev)", role: "developer", profileImage: null, createdAt: new Date(), updatedAt: new Date() }
];

let MOCK_PROJECTS: any[] = [];
try {
  const rawProjects = require("./mockProjects.json");
  if (Array.isArray(rawProjects) && rawProjects.length > 0) {
    MOCK_PROJECTS = rawProjects.map((p: any) => ({
      ...p,
      imageUrl: p.image || p.imageUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }
} catch (e) {
  MOCK_PROJECTS = [];
}

const MOCK_PROJECT_DEVS: any[] = [
  { projectId: "recodex-live-demo-project", userId: "sandbox-dev-002" }
];

const MOCK_INQUIRIES: any[] = [];

const MOCK_QUERY_MESSAGES: any[] = [];

const matchesWhere = (item: any, where: any): boolean => {
  if (!where) return true;
  if (where.OR && Array.isArray(where.OR)) {
    return where.OR.some((cond: any) => matchesWhere(item, cond));
  }
  for (const [key, val] of Object.entries(where)) {
    if (val === undefined) continue;
    if (key === "id" && item.id !== val && item.ticketId !== val) return false;
    if (key === "ticketId" && item.ticketId !== val && item.id !== val) return false;
    if (key === "email") {
      const emailVal = typeof val === "object" && val !== null ? (val as any).equals : val;
      if (emailVal && (item.email || "").toLowerCase() !== String(emailVal).toLowerCase()) return false;
    }
    if (key === "message") {
      if (typeof val === "object" && val !== null && (val as any).contains) {
        if (!item.message.includes((val as any).contains)) return false;
      } else if (item.message !== val) {
        return false;
      }
    }
  }
  return true;
};

const mockPrisma: any = {
  $connect: async () => {},
  $disconnect: async () => {},
  user: {
    findUnique: async (args: any) => {
      const { where } = args;
      return MOCK_USERS.find(u => u.id === where.id || u.email === where.email) || null;
    },
    findMany: async () => {
      return MOCK_USERS;
    },
    upsert: async (args: any) => {
      const { where, update, create } = args;
      const existing = MOCK_USERS.find(u => u.id === where.id);
      if (existing) {
        Object.assign(existing, update, { updatedAt: new Date() });
        return existing;
      } else {
        const newUser = { ...create, createdAt: new Date(), updatedAt: new Date() };
        MOCK_USERS.push(newUser);
        return newUser;
      }
    },
    update: async (args: any) => {
      const { where, data } = args;
      const existing = MOCK_USERS.find(u => u.id === where.id);
      if (existing) {
        Object.assign(existing, data, { updatedAt: new Date() });
        return existing;
      }
      throw new Error("User not found");
    },
    delete: async (args: any) => {
      const { where } = args;
      const idx = MOCK_USERS.findIndex(u => u.id === where.id);
      if (idx !== -1) {
        return MOCK_USERS.splice(idx, 1)[0];
      }
      throw new Error("User not found");
    }
  },
  project: {
    findMany: async (args: any) => {
      const { where } = args || {};
      if (!where) return MOCK_PROJECTS;
      return MOCK_PROJECTS.filter(p => {
        if (where.category && p.category !== where.category) return false;
        return true;
      });
    },
    findUnique: async (args: any) => {
      const { where } = args;
      return MOCK_PROJECTS.find(p => p.id === where.id) || null;
    },
    create: async (args: any) => {
      const { data } = args;
      const newProj = { ...data, devsCount: 0, stars: 0, forks: 0, createdAt: new Date(), updatedAt: new Date() };
      MOCK_PROJECTS.push(newProj);
      return newProj;
    },
    update: async (args: any) => {
      const { where, data } = args;
      const existing = MOCK_PROJECTS.find(p => p.id === where.id);
      if (existing) {
        const updatedData: any = {};
        for (const [key, val] of Object.entries(data)) {
          if (val && typeof val === 'object') {
            if ('increment' in (val as any)) {
              updatedData[key] = (existing[key] || 0) + (val as any).increment;
            } else if ('decrement' in (val as any)) {
              updatedData[key] = (existing[key] || 0) - (val as any).decrement;
            } else {
              updatedData[key] = val;
            }
          } else {
            updatedData[key] = val;
          }
        }
        Object.assign(existing, updatedData, { updatedAt: new Date() });
        return existing;
      }
      throw new Error("Project not found");
    },
    delete: async (args: any) => {
      const { where } = args;
      const idx = MOCK_PROJECTS.findIndex(p => p.id === where.id);
      if (idx !== -1) {
        return MOCK_PROJECTS.splice(idx, 1)[0];
      }
      throw new Error("Project not found");
    }
  },
  projectDev: {
    findUnique: async (args: any) => {
      const { where } = args;
      if (where.projectId_userId) {
        const { projectId, userId } = where.projectId_userId;
        return MOCK_PROJECT_DEVS.find(pd => pd.projectId === projectId && pd.userId === userId) || null;
      }
      return null;
    },
    create: async (args: any) => {
      const { data } = args;
      MOCK_PROJECT_DEVS.push(data);
      return data;
    }
  },
  inquiry: {
    create: async (args: any) => {
      const { data } = args;
      const tId = data.ticketId || `inq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newInq = {
        id: data.id || tId,
        ticketId: tId,
        ...data,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      };
      MOCK_INQUIRIES.unshift(newInq);
      return newInq;
    },
    findFirst: async (args: any) => {
      const { where } = args || {};
      return MOCK_INQUIRIES.find((i) => matchesWhere(i, where)) || null;
    },
    findUnique: async (args: any) => {
      const { where } = args || {};
      return MOCK_INQUIRIES.find((i) => matchesWhere(i, where)) || null;
    },
    findMany: async (args: any) => {
      const { where, take } = args || {};
      let list = MOCK_INQUIRIES.filter((i) => matchesWhere(i, where));
      if (take && typeof take === "number") {
        list = list.slice(0, take);
      }
      return list;
    },
    count: async (args: any) => {
      const { where } = args || {};
      return MOCK_INQUIRIES.filter((i) => matchesWhere(i, where)).length;
    },
    delete: async (args: any) => {
      const { where } = args;
      const idx = MOCK_INQUIRIES.findIndex((i) => matchesWhere(i, where));
      if (idx !== -1) {
        return MOCK_INQUIRIES.splice(idx, 1)[0];
      }
      return null;
    },
    deleteMany: async (args: any) => {
      const { where } = args;
      const beforeCount = MOCK_INQUIRIES.length;
      for (let i = MOCK_INQUIRIES.length - 1; i >= 0; i--) {
        if (matchesWhere(MOCK_INQUIRIES[i], where)) {
          MOCK_INQUIRIES.splice(i, 1);
        }
      }
      return { count: beforeCount - MOCK_INQUIRIES.length };
    },
    update: async (args: any) => {
      const { where, data } = args;
      const existing = MOCK_INQUIRIES.find((i) => matchesWhere(i, where));
      if (existing) {
        Object.assign(existing, data);
        return existing;
      }
      // If updating but not found, create it
      const created = {
        id: where.id || where.ticketId || `inq-${Date.now()}`,
        ticketId: where.ticketId || where.id,
        ...data,
        createdAt: new Date(),
      };
      MOCK_INQUIRIES.unshift(created);
      return created;
    }
  },
  queryMessage: {
    create: async (args: any) => {
      const { data } = args;
      const newMsg = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ...data,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: new Date(),
      };
      MOCK_QUERY_MESSAGES.push(newMsg);
      return newMsg;
    },
    findMany: async (args: any) => {
      const { where } = args || {};
      return MOCK_QUERY_MESSAGES.filter((m) => matchesWhere(m, where));
    },
    deleteMany: async (args: any) => {
      const { where } = args;
      const before = MOCK_QUERY_MESSAGES.length;
      for (let i = MOCK_QUERY_MESSAGES.length - 1; i >= 0; i--) {
        if (matchesWhere(MOCK_QUERY_MESSAGES[i], where)) {
          MOCK_QUERY_MESSAGES.splice(i, 1);
        }
      }
      return { count: before - MOCK_QUERY_MESSAGES.length };
    }
  }
};

/**
 * Resilient Prisma Proxy:
 * Dispatches every query to MongoDB Atlas realPrisma first.
 * If realPrisma throws (e.g. cold boot network blip or engine issue on Vercel),
 * it falls back gracefully to the comprehensive in-memory model emulator.
 */
const prismaProxy = new Proxy(realPrisma, {
  get(target: any, modelKey: string) {
    const realModel = target[modelKey];
    const mockModel = mockPrisma[modelKey];

    if (!realModel) return mockModel;

    return new Proxy(realModel, {
      get(modelTarget: any, methodKey: string) {
        const realMethod = modelTarget[methodKey];
        const mockMethod = mockModel?.[methodKey];

        if (typeof realMethod !== "function") {
          return realMethod || mockMethod;
        }

        return async function (...args: any[]) {
          try {
            return await realMethod.apply(modelTarget, args);
          } catch (dbErr: any) {
            console.warn(`[PRISMA RESILIENCE] realPrisma.${modelKey}.${methodKey} warning, invoking resilient fallback:`, dbErr?.message || dbErr);
            if (typeof mockMethod === "function") {
              return await mockMethod.apply(mockModel, args);
            }
            throw dbErr;
          }
        };
      },
    });
  },
}) as any;

export default prismaProxy;
