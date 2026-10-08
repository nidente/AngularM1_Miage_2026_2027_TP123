// Tests de contrat et de sécurité (TP3, extension facultative).
// Ils ne nécessitent pas MongoDB : chaque cas est refusé par le middleware
// auth ou par Multer avant toute requête à la base.
import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";

// Secret aléatoire propre à ce processus de test : aucun secret n'est écrit dans
// le code. Il doit être défini avant l'import de app.js, qui le lit au chargement.
process.env.JWT_SECRET = randomBytes(32).toString("hex");
const { createApp } = await import("../src/app.js");

let server, base;

test.before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

/** JWT valide pour un utilisateur fictif, signé avec le secret du test. */
const validToken = () =>
  jwt.sign({ sub: "6abba5ea7753b0635517a356" }, process.env.JWT_SECRET, { expiresIn: "5m" });

test("GET /api/tracks sans JWT → 401", async () => {
  const r = await fetch(`${base}/api/tracks`);
  assert.equal(r.status, 401);
  assert.equal((await r.json()).message, "Authentification requise");
});

test("DELETE /api/tracks/:id sans JWT → 401 (la suppression est protégée côté serveur)", async () => {
  const r = await fetch(`${base}/api/tracks/6abbef62499d215da5cbb4c0`, { method: "DELETE" });
  assert.equal(r.status, 401);
});

test("GET /api/tracks avec un JWT invalide → 401", async () => {
  const r = await fetch(`${base}/api/tracks`, {
    headers: { Authorization: "Bearer ceci.nest.pas-un-jwt" },
  });
  assert.equal(r.status, 401);
  assert.equal((await r.json()).message, "Jeton invalide ou expiré");
});

test("GET /api/tracks avec un JWT signé par un autre secret → 401", async () => {
  const forged = jwt.sign({ sub: "6abba5ea7753b0635517a356" }, "secret-de-l-attaquant");
  const r = await fetch(`${base}/api/tracks`, { headers: { Authorization: `Bearer ${forged}` } });
  assert.equal(r.status, 401);
});

test("POST /api/tracks sans fichier → 400", async () => {
  const body = new FormData();
  body.append("title", "Sans fichier");
  const r = await fetch(`${base}/api/tracks`, {
    method: "POST",
    headers: { Authorization: `Bearer ${validToken()}` },
    body,
  });
  assert.equal(r.status, 400);
  assert.equal((await r.json()).message, "Fichier audio requis");
});

test("POST /api/tracks avec un type MIME refusé → 400", async () => {
  const body = new FormData();
  body.append("audio", new Blob(["pas du son"], { type: "text/plain" }), "notes.txt");
  const r = await fetch(`${base}/api/tracks`, {
    method: "POST",
    headers: { Authorization: `Bearer ${validToken()}` },
    body,
  });
  assert.equal(r.status, 400);
  assert.equal((await r.json()).message, "Format audio non accepté");
});
