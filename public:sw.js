// Service worker minimal : permet l'installation de l'app sur l'écran d'accueil.
// Pas de mise en cache agressive pour garder l'app toujours à jour.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Laisse passer toutes les requêtes normalement (pas de cache offline pour l'instant).
});
