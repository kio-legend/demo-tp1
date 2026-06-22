import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((cookie) => cookie.trim().split("="))
      .filter(([key, value]) => key && value)
      .map(([key, value]) => [key, decodeURIComponent(value)])
  );
}

function getCurrentUser(req) {
  const cookies = parseCookies(req.headers.cookie);

  if (cookies.demo_session === "admin") {
    return { name: "Admin Demo", role: "admin" };
  }

  if (cookies.demo_session === "customer") {
    return { name: "Client Demo", role: "customer" };
  }

  return null;
}

function prefersHtml(req) {
  return req.headers.accept?.includes("text/html");
}

function requireAuth(req, res, next) {
  const user = getCurrentUser(req);

  if (!user) {
    if (prefersHtml(req)) {
      return res.status(401).send(`
        <!doctype html>
        <html lang="fr">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Authentification requise</title>
            <link rel="stylesheet" href="/styles.css" />
          </head>
          <body class="admin-page">
            <main class="admin-content">
              <section class="panel">
                <div class="panel-heading">
                  <h1>401 - Authentification requise</h1>
                </div>
                <div style="padding: 20px;">
                  <p>La page admin est maintenant protegee cote serveur.</p>
                  <a class="button" href="/demo-login-admin">Connexion admin de demo</a>
                </div>
              </section>
            </main>
          </body>
        </html>
      `);
    }

    return res.status(401).json({ error: "Authentification requise" });
  }

  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    if (prefersHtml(req)) {
      return res.status(403).send(`
        <!doctype html>
        <html lang="fr">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Acces refuse</title>
            <link rel="stylesheet" href="/styles.css" />
          </head>
          <body class="admin-page">
            <main class="admin-content">
              <section class="panel">
                <div class="panel-heading">
                  <h1>403 - Acces refuse</h1>
                </div>
                <div style="padding: 20px;">
                  <p>Votre session existe, mais votre role ne permet pas d'acceder a l'administration.</p>
                  <a class="button" href="/">Retour boutique</a>
                </div>
              </section>
            </main>
          </body>
        </html>
      `);
    }

    return res.status(403).json({ error: "Acces refuse" });
  }

  next();
}

app.get("/demo-login-admin", (_req, res) => {
  res.cookie("demo_session", "admin", {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 1000 * 60 * 30
  });
  res.redirect("/admin");
});

app.get("/demo-login-customer", (_req, res) => {
  res.cookie("demo_session", "customer", {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 1000 * 60 * 30
  });
  res.redirect("/");
});

app.get("/demo-logout", (_req, res) => {
  res.clearCookie("demo_session");
  res.redirect("/");
});

app.get("/admin.html", requireAuth, requireAdmin, (_req, res) => {
  res.redirect(308, "/admin");
});

app.get("/admin.js", requireAuth, requireAdmin, (req, res, next) => {
  next();
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/admin", requireAuth, requireAdmin, (_req, res) => {
  res.set("Cache-Control", "no-store");
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

app.get("/api/admin/orders", requireAuth, requireAdmin, (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({
    orders: [
      { id: "CMD-1042", customer: "Alice Martin", total: 68.8, status: "A preparer" },
      { id: "CMD-1043", customer: "Nora Diallo", total: 24.5, status: "Expediee" },
      { id: "CMD-1044", customer: "Leo Bernard", total: 126, status: "Paiement a verifier" }
    ]
  });
});

app.listen(port, () => {
  console.log(`Flower shop fixed demo running on http://localhost:${port}`);
  console.log(`Protected admin page: http://localhost:${port}/admin`);
  console.log(`Demo admin login: http://localhost:${port}/demo-login-admin`);
  console.log(`Demo customer login: http://localhost:${port}/demo-login-customer`);
});
