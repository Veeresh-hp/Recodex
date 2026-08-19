import { PrismaClient } from "@prisma/client";

const realPrisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
});

// Mock Storage
const MOCK_USERS: any[] = [
  { id: "sandbox-admin-001", email: "veereshhp2004@gmail.com", name: "Veeresh H P", role: "admin", profileImage: null, createdAt: new Date(), updatedAt: new Date() },
  { id: "sandbox-dev-002", email: "veereshhp04@gmail.com", name: "Veeresh H P (Dev)", role: "developer", profileImage: null, createdAt: new Date(), updatedAt: new Date() },
  { id: "sandbox-client-003", email: "veereshhp_client@gmail.com", name: "Veeresh H P (Client)", role: "client", profileImage: null, createdAt: new Date(), updatedAt: new Date() }
];

const MOCK_PROJECTS: any[] = [
  {
    id: "recodex-live-demo-project",
    title: "Enterprise Custom Portal Implementation",
    description: "Interactive visual metrics interface aligned to custom API synchronization modules.",
    longDescription: "Detailed sandbox platform providing developers and client organizations full end-to-end monitoring metrics, live deployment timeline records, secure role elevation, and compiler simulation tools.",
    status: "Active",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600",
    category: "Web Systems",
    tags: ["VITE", "REACT", "TYPESCRIPT", "TAILWIND", "EXPRESS", "PRISMA"],
    devsCount: 1,
    stars: 87,
    forks: 14,
    files: JSON.stringify({
      "src/server.ts": "import express from 'express';\nconst app = express();\napp.listen(5000, () => console.log('Mock Server Ready'));",
      "README.md": "# Mock Project Node\nThis is a simulation sandbox node."
    }),
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const MOCK_PROJECT_DEVS: any[] = [
  { projectId: "recodex-live-demo-project", userId: "sandbox-dev-002" }
];

const MOCK_INQUIRIES: any[] = [
  {
    id: "inq-1",
    name: "John Client",
    email: "john@enterprise.com",
    phone: "+1 (555) 777-0091",
    type: "spec-build",
    message: "Looking to build a custom micro-frontend architecture for our payment gateway with strict PCI-DSS audits.",
    reply: null,
    createdAt: new Date()
  }
];

let useMock = false;

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
      const newInq = { id: `inq-${Date.now()}`, ...data, createdAt: new Date() };
      MOCK_INQUIRIES.push(newInq);
      return newInq;
    },
    findMany: async () => {
      return MOCK_INQUIRIES;
    },
    delete: async (args: any) => {
      const { where } = args;
      const idx = MOCK_INQUIRIES.findIndex(i => i.id === where.id);
      if (idx !== -1) {
        return MOCK_INQUIRIES.splice(idx, 1)[0];
      }
      throw new Error("Inquiry not found");
    },
    update: async (args: any) => {
      const { where, data } = args;
      const existing = MOCK_INQUIRIES.find(i => i.id === where.id);
      if (existing) {
        Object.assign(existing, data);
        return existing;
      }
      throw new Error("Inquiry not found");
    }
  }
};

realPrisma.$connect()
  .then(() => {
    console.log("Connected to MongoDB Atlas database successfully!");
  })
  .catch((err) => {
    console.warn("MongoDB Atlas connection failed. Falling back to local database emulator.", err.message);
    useMock = true;
  });

const prismaProxy = new Proxy(realPrisma, {
  get(target, prop) {
    if (useMock) {
      return mockPrisma[prop as keyof typeof mockPrisma] || undefined;
    }
    return target[prop as keyof typeof target];
  }
}) as any;

export default prismaProxy;
