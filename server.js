import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Intentionally vulnerable for the Broken Access Control demo:
// no authentication, no role check, direct URL access allowed.
app.get("/admin", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/api/products", (_req, res) => {
  res.json([
    {
      id: 1,
      name: "Bouquet Pivoine",
      price: 34.9,
      stock: 18,
      color: "rose",
      image: "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=900&q=80"
    },
    {
      id: 2,
      name: "Tulipes du Matin",
      price: 24.5,
      stock: 27,
      color: "jaune",
      image: "https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=900&q=80"
    },
    {
      id: 3,
      name: "Roses Velours",
      price: 42,
      stock: 9,
      color: "rouge",
      image: "https://images.unsplash.com/photo-1494972308805-463bc619d34e?auto=format&fit=crop&w=900&q=80"
    }
  ]);
});

app.get("/api/admin/orders", (_req, res) => {
  res.json({
    warning: "Endpoint volontairement non protege pour demonstration.",
    orders: [
      { id: "CMD-1042", customer: "Alice Martin", total: 68.8, status: "A preparer" },
      { id: "CMD-1043", customer: "Nora Diallo", total: 24.5, status: "Expediee" },
      { id: "CMD-1044", customer: "Leo Bernard", total: 126, status: "Paiement a verifier" }
    ]
  });
});

app.listen(port, () => {
  console.log(`Flower shop demo running on http://localhost:${port}`);
  console.log(`Vulnerable admin page: http://localhost:${port}/admin`);
});
