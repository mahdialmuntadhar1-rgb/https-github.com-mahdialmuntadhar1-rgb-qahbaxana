import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Run Agent
  app.post("/api/run-agent", (req, res) => {
    const { governorate, category } = req.body;

    if (!governorate || !category) {
      return res.status(400).json({ error: "Governorate and category are required" });
    }

    console.log(`Running agent for ${category} in ${governorate}...`);

    // Simulated Agent Results
    // In a real scenario, this might trigger a more complex workflow.
    // Since we can't call Gemini here, we return structured data that looks like agent output.
    const results = [
      {
        name: `${governorate} Central ${category.slice(0, -1)}`,
        category: category,
        city: governorate,
        phone: "+964 770 123 4567",
        confidence: 0.98
      },
      {
        name: `Al-Rafidain ${category}`,
        category: category,
        city: governorate,
        phone: "+964 780 987 6543",
        confidence: 0.92
      },
      {
        name: `Babylon Gate ${category.slice(0, -1)}`,
        category: category,
        city: governorate,
        phone: "+964 750 111 2222",
        confidence: 0.85
      },
      {
        name: `Tigris ${category}`,
        category: category,
        city: governorate,
        phone: "+964 790 333 4444",
        confidence: 0.78
      }
    ];

    // Add some randomness to simulate "finding" different things
    const count = Math.floor(Math.random() * 3) + 2;
    res.json(results.slice(0, count));
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
