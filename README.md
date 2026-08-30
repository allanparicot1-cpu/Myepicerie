# MyÉpicerie

Application d'équipe pour l'épicerie (planning, tâches, produits, cave à vin, congés, chefmaster...).

Ce dossier est un projet complet, prêt à être mis en ligne gratuitement sur **Vercel**, avec **Supabase**
comme base de données partagée (remplace le stockage utilisé dans Claude).

---

## Étape 1 — Créer la base de données (Supabase, gratuit)

1. Va sur https://supabase.com et crée un compte (gratuit).
2. Clique sur **New project**. Choisis un nom (ex: `myepicerie`) et un mot de passe pour la base
   (garde-le de côté, ce n'est pas celui de l'app — c'est juste pour Supabase).
3. Une fois le projet créé, va dans **SQL Editor** (menu de gauche) → **New query**.
4. Ouvre le fichier `supabase-setup.sql` (dans ce dossier), copie tout son contenu, colle-le dans
   l'éditeur SQL de Supabase, puis clique sur **Run**.
5. Va dans **Project Settings** (roue crantée) → **API**. Note deux valeurs :
   - **Project URL** (ressemble à `https://xxxxxxxxxxxx.supabase.co`)
   - **anon public** key (une longue chaîne de caractères)

Garde cette page ouverte, tu en auras besoin à l'étape 3.

---

## Étape 2 — Mettre le projet sur GitHub

1. Crée un compte gratuit sur https://github.com si tu n'en as pas.
2. Crée un nouveau dépôt (bouton **New**), par exemple nommé `myepicerie`.
3. Mets tous les fichiers de ce dossier dans ce dépôt (soit en les glissant-déposant sur la page
   GitHub, soit avec `git` si tu es à l'aise avec :
   ```
   git init
   git add .
   git commit -m "Premier envoi"
   git branch -M main
   git remote add origin https://github.com/TON-COMPTE/myepicerie.git
   git push -u origin main
   ```
   ).

**Important** : ne mets jamais ton fichier `.env` en ligne (il est déjà exclu automatiquement par
le fichier `.gitignore` fourni).

---

## Étape 3 — Déployer sur Vercel (gratuit)

1. Va sur https://vercel.com et crée un compte (tu peux te connecter directement avec ton compte
   GitHub, c'est le plus simple).
2. Clique sur **Add New** → **Project**.
3. Choisis le dépôt GitHub que tu viens de créer (`myepicerie`) et clique sur **Import**.
4. Vercel détecte automatiquement que c'est un projet Vite — laisse les réglages par défaut.
5. Avant de cliquer sur **Deploy**, déplie **Environment Variables** et ajoute les deux valeurs
   notées à l'étape 1 :
   - `VITE_SUPABASE_URL` → ton Project URL
   - `VITE_SUPABASE_ANON_KEY` → ta clé anon public
6. Clique sur **Deploy**. Après 1 à 2 minutes, ton app est en ligne avec une adresse du type
   `myepicerie.vercel.app` — gratuite, et mise à jour automatiquement à chaque fois que tu modifies
   le code sur GitHub.

---

## Rendre l'app "installable" sur téléphone

L'app est déjà configurée en PWA (Progressive Web App) : pas besoin de passer par l'App Store ou
le Google Play Store.

- **Android (Chrome)** : ouvrir le lien Vercel → menu ⋮ → **Ajouter à l'écran d'accueil**.
- **iPhone (Safari)** : ouvrir le lien → bouton Partager → **Sur l'écran d'accueil**.

Une icône apparaît alors comme une vraie app, en plein écran, sans barre de navigateur.

---

## Tester en local (optionnel, pour les curieux)

Si tu veux lancer le site sur ton ordinateur avant de le mettre en ligne :

```
npm install
cp .env.example .env
# remplis .env avec tes valeurs Supabase (étape 1)
npm run dev
```

Puis ouvre l'adresse affichée dans le terminal (en général `http://localhost:5173`).

---

## Ce qui a changé par rapport à la version testée dans Claude

- Le stockage partagé (planning, tâches, produits, etc.) utilise maintenant Supabase au lieu du
  stockage intégré à Claude — même principe (une donnée partagée par toute l'équipe), juste un
  autre service derrière.
- Les données propres à chaque appareil (qui est connecté sur ce téléphone, code admin déjà vu...)
  restent en local sur l'appareil (`localStorage`), comme avant.
- Le mot de passe de chaque compte reste haché (jamais stocké en clair), exactement comme avant.

**Point de vigilance** : la protection actuelle repose sur le prénom + mot de passe côté
application, pas sur une vraie authentification Supabase. C'est suffisant pour un usage interne
d'équipe, mais n'importe qui connaissant l'adresse Supabase et la clé publique pourrait
techniquement lire/écrire les données directement (comme c'était déjà le cas avec le stockage
précédent). Si tu veux un niveau de sécurité plus poussé plus tard (vraie authentification par
utilisateur, permissions fines), on pourra faire évoluer ça avec Supabase Auth.
