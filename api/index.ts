const MONGODB_ATLAS_URL = "mongodb+srv://Recodex:Recodex2004@recodex.wahwbbo.mongodb.net/recodex?appName=Recodex";
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mongodb")) {
  process.env.DATABASE_URL = MONGODB_ATLAS_URL;
}

import app from "../backend/src/server";

export default app;
