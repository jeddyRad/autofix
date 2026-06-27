# Guide de Collaboration & Configuration Test – AutoFix MG

Ce document a pour but d'aider tout nouveau collaborateur à configurer le projet localement et à tester l'ensemble du workflow (Authentification, Rendez-vous, Paiement) sans encombre.

## 1. Variables d'Environnement (.env)

Pour que l'application fonctionne de manière optimale, un certain nombre de services tiers doivent être configurés via le fichier `.env`.

Avant toute chose :
```bash
cp .env.example .env
```

### A. Configuration SMTP (Envoi de mails / OTP)
L'inscription et la récupération de mot de passe passent par un code OTP envoyé par email. En environnement de test, **n'utilisez pas de vraie messagerie de production**.
1. Créez un compte gratuit sur [Mailtrap](https://mailtrap.io/).
2. Créez une boîte de réception ("Inbox").
3. Récupérez les credentials SMTP et insérez-les dans votre `.env` :
```env
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USE_TLS=True
EMAIL_HOST_USER=votre_utilisateur_mailtrap
EMAIL_HOST_PASSWORD=votre_mot_de_passe_mailtrap
DEFAULT_FROM_EMAIL=noreply@autofixmg.com
```

### B. Configuration de Paiement (Stripe)
Le paiement s'effectue via Stripe. Il vous faut absolument une clé de test :
1. Créez un compte sur [Stripe Dashboard](https://dashboard.stripe.com/register).
2. Activez le **Mode Test** (généralement en haut à droite).
3. Allez dans l'onglet **Développeurs > Clés API**.
4. Copiez la **Clé secrète** (qui commence par `sk_test_...`) et ajoutez-la à votre `.env` :
```env
STRIPE_SECRET_KEY=sk_test_votre_clef_secrete_ici
```
> **Important** : Ne commitez jamais votre fichier `.env`.

---

## 2. Démarrage avec Docker Compose

Le projet utilise Docker pour uniformiser les environnements locaux. Il existe deux fichiers de configuration :
- `docker-compose.yml` : Lance le projet dans sa forme compilée.
- `docker-compose.dev.yml` : Monte les répertoires locaux en volume, ce qui permet le "Hot Reload" (le serveur redémarre tout seul si vous modifiez un fichier Python ou TypeScript).

**Pour le développement actif :**
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
```

> **Note** : Vérifiez que les ports `8000` (Backend) et `4200` (Frontend) ne sont pas déjà occupés sur votre machine (par un autre projet ou service local, ex: PostgreSQL local sur 5432).

---

## 3. Base de données & Migrations

Dès que les conteneurs sont lancés, vous devez appliquer la configuration de la base de données. 

**Étape A : Exécuter les migrations**
A faire systématiquement lors d'une première installation ou après un `git pull` s'il y a eu des changements dans les modèles.
```bash
docker compose exec backend python manage.py migrate
```

**Étape B : Créer un super administrateur (Optionnel mais recommandé)**
Permet d'accéder à l'interface `http://localhost:8000/admin/`.
```bash
docker compose exec backend python manage.py createsuperuser
```

**Étape C : Peupler la base avec des données de test**
Pour éviter de s'inscrire manuellement à chaque fois, vous pouvez lancer le script de population qui crée des comptes pré-configurés.
```bash
docker compose exec backend python populate_db.py
```
*Vérifiez le terminal pour voir les logins et mots de passe créés (ex: `admin@test.com`, `client@test.com`, `garagiste@test.com`).*

---

## 4. Workflow complet pour tester

Une fois cet environnement en place, le collaborateur peut suivre ce workflow nominal de test E2E (End-to-End) :

1. **Inscription** : Allez sur `http://localhost:4200/register`, inscrivez-vous en tant que client.
2. **OTP** : Allez dans votre boîte Mailtrap, récupérez le code à 6 chiffres, et insérez-le sur l'écran Angular.
3. **Recherche de Prestataire** : Connectez-vous, cherchez un mécanicien dans la liste.
4. **Prise de Rendez-vous** : Cliquez sur "Réserver", choisissez une date.
5. **Administration** : Connectez-vous avec un compte *Admin* `admin@test.com` et allez dans l'onglet Administration pour "Valider" le prestataire si ce n'est pas déjà fait.
6. **Validation Prestataire** : Connectez-vous avec le compte du mécanicien `garagiste@test.com`, allez dans le Tableau de bord > Rendez-vous actis, puis "Acceptez" l'intervention et fixez un prix.
7. **Paiement Stripe** : Reconnectez-vous en compte Client, le rendez-vous devrait être à l'état Accepté. Cliquez sur "Payer l'intervention". Vous serez redirigé vers l'interface de test Stripe (utilisez les [cartes de test Stripe](https://stripe.com/docs/testing)).
8. **Intervention** : Le paiement est validé, le prestataire clique sur "Commencer l'intervention", puis "Terminer l'intervention".
9. **Avis** : Le client va dans l'Historique et dépose un avis !

Bienvenue dans l'équipe AutoFix MG ! N'hésitez pas à poser vos questions sur l'arborescence s'il y a des difficultés.


## Pour l'utilisation de stripe de paiement

Voici les principaux numéros fictifs que vous pouvez saisir dans votre formulaire:

4242 4242 4242 4242: Simule un succès immédiat (Carte Visa standard).4000 0560 0000 0001 : Simule un échec pour fonds insuffisants (Utile pour tester l'affichage de vos messages d'erreur).
4000 0021 0000 0055 : Simule une carte expirée.
4000 0000 0000 0026 : Simule un code CVC incorrect.

exemple de remplissage 
Date d'expiration : 12/30  (date future)
CVC : 123
Nom : Test Autofix
