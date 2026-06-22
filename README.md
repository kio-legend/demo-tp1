# Fleurine - Demo Broken Access Control

Petit site Express de vente de fleurs cree pour demontrer une faille de type **Broken Access Control**.

Le projet contient volontairement une page d'administration accessible sans authentification :

- boutique publique : `http://localhost:3000/`
- page admin vulnerable : `http://localhost:3000/admin`
- API admin vulnerable : `http://localhost:3000/api/admin/orders`

Ce depot est prevu pour un usage pedagogique. Ne pas y mettre de vraies donnees client, de secrets, de tokens ou de mots de passe.

## Lancer le projet

Installer les dependances :

```bash
npm install
```

Demarrer le serveur :

```bash
npm run dev
```

Le site est ensuite disponible sur :

```text
http://localhost:3000
```

## Passer de la version vulnerable a la version corrigee

La version vulnerable est dans :

```text
server.js
```

La copie corrigee est dans :

```text
server-fixed.js
```

Pour montrer la correction pendant la demonstration :

```bash
mv server.js server-vulnerable.js
mv server-fixed.js server.js
npm run dev
```

Pour revenir a la version vulnerable :

```bash
mv server.js server-fixed.js
mv server-vulnerable.js server.js
npm run dev
```

## Objectif de la demonstration

La faille illustree est un controle d'acces manquant.

Une application peut afficher une page ou exposer une API reservee aux administrateurs, mais oublier de verifier cote serveur que l'utilisateur connecte possede vraiment le role admin.

Dans ce projet, les routes suivantes sont volontairement exposees :

```js
app.get("/admin", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/api/admin/orders", (_req, res) => {
  res.json({
    warning: "Endpoint volontairement non protege pour demonstration.",
    orders: [...]
  });
});
```

Il n'y a aucune verification de session, aucun middleware d'authentification et aucun controle de role.

## Exploiter la faille

### 1. Acceder au site comme un visiteur normal

Ouvrir la boutique :

```text
http://localhost:3000/
```

La page affiche une boutique classique avec des bouquets. A ce stade, un visiteur ne devrait normalement pas avoir acces aux informations d'administration.

### 2. Forcer l'acces a l'URL admin

Dans le navigateur, taper directement :

```text
http://localhost:3000/admin
```

Resultat attendu : la page admin s'affiche quand meme.

Cela prouve que le serveur ne verifie pas si l'utilisateur a le droit d'acceder a cette page.

### 3. Appeler directement l'API admin

Depuis un terminal :

```bash
curl http://localhost:3000/api/admin/orders
```

Resultat attendu : l'API renvoie des commandes, par exemple :

```json
{
  "warning": "Endpoint volontairement non protege pour demonstration.",
  "orders": [
    {
      "id": "CMD-1042",
      "customer": "Alice Martin",
      "total": 68.8,
      "status": "A preparer"
    }
  ]
}
```

La page `/admin` et l'API `/api/admin/orders` devraient etre reservees aux administrateurs. Le fait qu'elles soient accessibles directement est la faille.

## Pourquoi c'est dangereux

Un attaquant n'a pas besoin de casser un mot de passe pour exploiter ce probleme. Il peut simplement deviner ou trouver une URL sensible :

```text
/admin
/api/admin/orders
/api/admin/users
/api/admin/export
```

Si le serveur renvoie les donnees sans verifier les droits, l'attaquant peut consulter ou modifier des informations reservees.

Dans une vraie application, cela peut exposer :

- des donnees client ;
- des commandes ;
- des informations de paiement ;
- des exports internes ;
- des actions d'administration.

## Comment patcher la faille

Le correctif doit etre fait **cote serveur**. Cacher le lien Admin dans l'interface ne suffit pas, car un attaquant peut toujours taper l'URL directement.

### 1. Ajouter une verification d'authentification

Exemple minimal avec un middleware Express :

```js
function requireAuth(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ error: "Authentification requise" });
  }

  next();
}
```

### 2. Ajouter une verification de role

```js
function requireAdmin(req, res, next) {
  if (req.session?.user?.role !== "admin") {
    return res.status(403).json({ error: "Acces refuse" });
  }

  next();
}
```

### 3. Proteger toutes les routes admin

Les routes vulnerables :

```js
app.get("/admin", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/api/admin/orders", (_req, res) => {
  res.json({ orders: [...] });
});
```

Deviennent :

```js
app.get("/admin", requireAuth, requireAdmin, (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/api/admin/orders", requireAuth, requireAdmin, (_req, res) => {
  res.json({ orders: [...] });
});
```

### 4. Verifier le patch

Apres correction, tester sans etre connecte :

```bash
curl -i http://localhost:3000/admin
curl -i http://localhost:3000/api/admin/orders
```

Resultat attendu :

```text
401 Unauthorized
```

Puis tester avec un utilisateur connecte mais non admin.

Resultat attendu :

```text
403 Forbidden
```

Enfin, tester avec un vrai compte admin.

Resultat attendu :

```text
200 OK
```

## Bonnes pratiques a retenir

- Verifier les permissions sur chaque route sensible.
- Ne jamais faire confiance uniquement au front-end.
- Proteger les pages HTML et les endpoints API.
- Utiliser des statuts HTTP clairs : `401` si non connecte, `403` si connecte mais non autorise.
- Tester les acces avec plusieurs profils : visiteur, utilisateur standard, admin.
- Eviter de publier des donnees reelles dans un depot public.
