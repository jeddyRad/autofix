# AutoFix MG

Plateforme web de mise en relation entre propriétaires de véhicules et prestataires automobiles (mécaniciens, dépanneurs, garages).

**Stack :** Angular 17 · Django 6 · PostgreSQL · Docker

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et démarré

## Configuration & Collaboration

Si vous rejoignez le projet et souhaitez le tester localement avec les clés API (Stripe, SMTP) et Docker, **veuillez d'abord lire le [Guide de Collaboration](COLLABORATION_GUIDE.md)** spécialement prévu à cet effet.

Sinon, de manière résumée, copiez le fichier d'environnement exemple :

```bash
cp .env.example .env
```

Modifiez `.env` si nécessaire (clé secrète Django, Stripe, etc.).

## Lancement — mode démo / production

Construit et démarre les 3 services (PostgreSQL, Django + Gunicorn, Angular + Nginx) :

```bash
docker compose up --build
```

| Service  | URL |
|----------|-----|
| Frontend | http://localhost:4200 |
| API      | http://localhost:8000/api/ |
| Admin Django | http://localhost:8000/admin/ |

## Lancement — mode développement (hot-reload)

Active les volumes montés et le rechargement automatique du code :

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

- Backend : `runserver` avec rechargement à chaque modification Python
- Frontend : `ng serve` avec rechargement à chaque modification TypeScript/HTML

## Données de démonstration

Une fois la stack démarrée, peuplez la base avec des comptes test :

```bash
docker compose exec backend python populate_db.py
```

Comptes créés :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@test.com | adminpass123 |
| Client | client@test.com | clientpass123 |
| Garagiste | garagiste@test.com | providerpass123 |
| Dépanneur | depanneur@test.com | providerpass123 |

## Arrêt

```bash
docker compose down
```

Pour supprimer aussi les données PostgreSQL :

```bash
docker compose down -v
```

## Structure du projet

```
autofix/
├── backend/          # Django 6 + DRF
├── frontend/         # Angular 17
├── docker-compose.yml
├── docker-compose.dev.yml
└── .env.example
```
