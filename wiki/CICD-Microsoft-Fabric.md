# CI/CD dans Microsoft Fabric — Guide de formation

> **Source officielle :** [Microsoft Learn — Tutoriel gestion du cycle de vie des applications](https://learn.microsoft.com/fr-fr/fabric/cicd/cicd-tutorial)

---

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Concepts clés](#concepts-clés)
3. [Prérequis](#prérequis)
4. [Étape 1 — Créer un espace de travail Premium](#étape-1--créer-un-espace-de-travail-premium)
5. [Étape 2 — Charger du contenu](#étape-2--charger-du-contenu)
6. [Étape 3 — Connecter l'espace de travail à Git](#étape-3--connecter-lespace-de-travail-à-git)
7. [Étape 4 — Créer un pipeline de déploiement](#étape-4--créer-un-pipeline-de-déploiement)
8. [Étape 5 — Déployer vers les autres étapes](#étape-5--déployer-vers-les-autres-étapes)
9. [Étape 6 — Créer un espace de travail isolé (branching)](#étape-6--créer-un-espace-de-travail-isolé-branching)
10. [Étape 7 — Modifier l'espace de travail](#étape-7--modifier-lespace-de-travail)
11. [Étape 8 — Valider les modifications (commit)](#étape-8--valider-les-modifications-commit)
12. [Étape 9 — Pull Request et fusion](#étape-9--pull-request-et-fusion)
13. [Étape 10 — Mettre à jour l'espace de travail partagé](#étape-10--mettre-à-jour-lespace-de-travail-partagé)
14. [Étape 11 — Comparer les étapes du pipeline](#étape-11--comparer-les-étapes-du-pipeline)
15. [Étape 12 — Déployer en production](#étape-12--déployer-en-production)
16. [Résumé du flux CI/CD](#résumé-du-flux-cicd)

---

## Vue d'ensemble

Microsoft Fabric propose une approche **CI/CD native** (Continuous Integration / Continuous Delivery) qui combine deux outils complémentaires :

| Outil | Rôle |
|---|---|
| **Intégration Git** | Contrôle de version, collaboration, gestion des branches |
| **Pipelines de déploiement** | Promotion du contenu entre les environnements (Dev → Test → Prod) |

Ce workflow permet à une équipe de données de **développer**, **tester** et **publier** du contenu Fabric (rapports Power BI, modèles sémantiques, notebooks, etc.) de façon structurée et traçable.

---

## Concepts clés

### Intégration Git

L'intégration Git dans Fabric permet de synchroniser un espace de travail avec un dépôt **Azure DevOps** ou **GitHub**. Chaque modification apportée aux éléments Fabric peut être :

- **Commitée** dans une branche Git
- **Révisée** via une Pull Request
- **Fusionnée** dans la branche principale de l'équipe

> Fabric supporte les éléments comme les modèles sémantiques, les rapports, les notebooks, les pipelines de données. Les fichiers `.pbix` ne sont **pas** synchronisés dans Git — seuls les fichiers sources décomposés le sont.

### Pipelines de déploiement

Un pipeline de déploiement organise le contenu en **3 étapes par défaut** :

```
[ Développement ] → [ Test ] → [ Production ]
```

Chaque étape est associée à un espace de travail Fabric distinct. Le pipeline permet de **comparer** le contenu entre les étapes et de **déployer** en un clic.

---

## Prérequis

### Côté Fabric

- Une **capacité Fabric** (ou Power BI Premium) — [s'inscrire à l'essai gratuit](https://app.fabric.microsoft.com/freetrial)
- Les **commutateurs de locataire** suivants activés par l'administrateur :
  - `Les utilisateurs peuvent créer des éléments Fabric`
  - `Les utilisateurs peuvent synchroniser des éléments d'espace de travail avec leurs référentiels Git`
  - `Créer des espaces de travail` *(si on veut brancher vers un nouvel espace de travail)*
  - `Les utilisateurs peuvent synchroniser avec des référentiels GitHub` *(GitHub uniquement)*

### Côté Git

#### Azure DevOps
- Un compte Azure DevOps actif (peut être dans un tenant différent du tenant Fabric)
- Accès à un dépôt existant

#### GitHub
- Un compte GitHub actif
- Un **Personal Access Token (PAT)** avec les droits appropriés :
  - **Jeton à granularité fine** *(recommandé)* : permission `Contents` en lecture/écriture
  - **Jeton classique** : scope `repo` activé

### Fichier d'exemple

Télécharger le fichier [`FoodSales.pbix`](https://github.com/microsoft/fabric-samples/blob/main/docs-samples/cicd/FoodSales.pbix) depuis le dépôt officiel `microsoft/fabric-samples`.

---

## Étape 1 — Créer un espace de travail Premium

1. Dans la barre de navigation gauche (expérience **Power BI**), aller dans **Espaces de travail > + Nouvel espace de travail**
2. Nommer l'espace de travail : `FoodSalesWS`
3. (Facultatif) Ajouter une description
4. Développer la section **Avancé** → sélectionner **Version d'évaluation de Fabric** ou **Power BI Premium**
5. Cliquer sur **Appliquer**

> **Pourquoi ?** Seuls les espaces de travail avec une capacité Fabric/Premium peuvent utiliser les pipelines de déploiement et l'intégration Git.

---

## Étape 2 — Charger du contenu

1. Dans l'espace de travail, cliquer sur **Charger > Parcourir**
2. Sélectionner le fichier `FoodSales.pbix`

L'espace de travail contient maintenant un **rapport**, un **modèle sémantique** et un **tableau de bord**.

### Configurer les informations d'identification *(une seule fois)*

Avant de créer un pipeline, il faut définir les credentials du modèle sémantique :

1. Aller dans **Paramètres > Power BI**
2. Sélectionner **Modèles sémantiques > Informations d'identification de la source de données > Modifier les informations d'identification**
3. Paramètres à définir :
   - **Méthode d'authentification** : `Anonyme`
   - **Niveau de confidentialité** : `Public`
   - **Ignorer la connexion de test** : décoché
4. Cliquer sur **Se connecter**

---

## Étape 3 — Connecter l'espace de travail à Git

L'espace de travail partagé est connecté à la **branche principale** (`main` ou `master`) du dépôt Git de l'équipe.

### Avec Azure DevOps

1. Ouvrir **Paramètres de l'espace de travail** (coin supérieur droit)
2. Sélectionner **Intégration Git**
3. Choisir **Azure DevOps**
4. Renseigner :
   - **Organisation** Azure DevOps
   - **Projet**
   - **Dépôt Git**
   - **Branche** : `main` (ou `master`)
   - **Dossier** : chemin dans le dépôt contenant le fichier `.pbix`
5. Cliquer sur **Se connecter et synchroniser**

Une fois connecté, l'espace de travail affiche :
- La **branche connectée**
- L'**état de synchronisation** de chaque élément
- L'icône `0` (aucune modification en attente)

> Pour GitHub, suivre la documentation [Connecter un espace de travail à GitHub](https://learn.microsoft.com/fr-fr/fabric/cicd/git-integration/git-get-started#connect-to-a-git-repo).

---

## Étape 4 — Créer un pipeline de déploiement

1. Depuis la page d'accueil de l'espace de travail, cliquer sur **Créer un pipeline de déploiement**
2. Nommer le pipeline : `FoodSalesDP`
3. Conserver les **3 étapes par défaut** (Développement / Test / Production)
4. Cliquer sur **Créer**
5. **Affecter** l'espace de travail `FoodSalesWS` à l'étape **Développement**

La phase de développement affiche le modèle sémantique, le rapport et le tableau de bord. Les phases Test et Production sont vides.

---

## Étape 5 — Déployer vers les autres étapes

### Développement → Test

1. Dans la vue de contenu de déploiement, cliquer sur **Déployer** depuis l'étape Développement
2. Confirmer le déploiement vers la phase de test

### Test → Production

1. Répéter l'opération depuis l'étape Test vers Production

Une **icône de coche verte** entre deux étapes indique que leur contenu est identique.

> **Rafraîchir le modèle sémantique** : cliquer sur le bouton **Actualiser** à côté de l'icône du modèle sémantique dans la carte de résumé de chaque phase.

---

## Étape 6 — Créer un espace de travail isolé (branching)

Chaque développeur travaille dans son **propre espace de travail isolé** (branché depuis la branche principale) pour ne pas interférer avec les modifications des autres.

1. Dans le menu **Contrôle de la source**, onglet **Branche**, cliquer sur la flèche vers le bas à côté du nom de la branche
2. Sélectionner **Créer une branche vers un nouvel espace de travail**
3. Renseigner :
   - **Nom de la branche** : `My FoodEdits`
   - **Nom de l'espace de travail** : `My_FoodSales`
4. Cliquer sur **Créer une branche**
5. Cliquer sur **Se connecter et synchroniser**

Fabric crée automatiquement le nouvel espace de travail, le synchronise avec la nouvelle branche, et redirige l'utilisateur vers ce nouvel espace.

> **Note :** Le fichier `.pbix` n'est pas copié dans Git (format non supporté). Seuls les fichiers sources décomposés sont synchronisés.

---

## Étape 7 — Modifier l'espace de travail

Dans cet exemple, on modifie le **format d'une colonne** dans le modèle sémantique.

1. Dans l'espace de travail, cliquer sur les **...** (points de suspension) du modèle sémantique > **Ouvrir le modèle de données**

   > Si `Ouvrir le modèle de données` est grisé : aller dans **Paramètres de l'espace de travail > Power BI > Général** et activer **Paramètres du modèle de données**.

2. Dans la table `Order_details`, sélectionner la colonne **Remise**
3. Dans le volet **Propriétés**, changer le **Format** de `Général` à `Pourcentage`

---

## Étape 8 — Valider les modifications (commit)

Après modification, l'icône de contrôle de code source affiche `1` — un élément a été modifié mais pas encore commité.

1. Cliquer sur l'**icône de contrôle de code source**
2. Sélectionner les éléments à commiter (le modèle sémantique affiché comme *Modifié*)
3. Ajouter un **message de commit** (facultatif mais recommandé)
4. Cliquer sur **Valider**

L'état du modèle sémantique passe à **Synced** — l'espace de travail et le dépôt Git sont synchronisés.

---

## Étape 9 — Pull Request et fusion

Dans le dépôt Git, créer une **Pull Request** pour fusionner la branche `My FoodEdits` dans la branche `main`.

### Fusion manuelle (Azure DevOps)

1. Cliquer sur **Créer une pull request** dans l'interface Fabric *ou* directement dans Azure DevOps
2. Renseigner un **titre** et une **description**
3. Cliquer sur **Créer**
4. Faire **réviser** la PR par un autre membre de l'équipe
5. **Fusionner** la pull request

> Une fois la PR fusionnée, l'espace de travail isolé peut être **supprimé** (il n'est pas supprimé automatiquement).

---

## Étape 10 — Mettre à jour l'espace de travail partagé

Revenir à l'espace de travail partagé (`FoodSalesWS`) connecté à la branche `main`.

L'icône de contrôle de code source affiche `1` — le dépôt Git est en avance sur l'espace de travail (état *Mise à jour requise*).

### Mise à jour manuelle

1. Cliquer sur l'**icône de contrôle de code source**
2. Cliquer sur **Mettre à jour tout**

L'état passe à **Synced** — l'espace de travail est à jour avec la branche `main`.

---

## Étape 11 — Comparer les étapes du pipeline

1. Cliquer sur **Afficher le pipeline de déploiement**

Une **icône orange** entre les étapes signale que le contenu a changé depuis le dernier déploiement.

2. Cliquer sur **Vérifier les modifications** pour afficher le détail des différences
3. Examiner les changements, puis fermer la fenêtre de révision

---

## Étape 12 — Déployer en production

Quand l'équipe est satisfaite des modifications testées :

1. Déployer de **Développement → Test** (même processus qu'à l'étape 5)
2. Déployer de **Test → Production**

---

## Résumé du flux CI/CD

```
                    ┌─────────────────────────────────┐
                    │  Dépôt Git (branche main)        │
                    └────────────┬────────────────────┘
                                 │ sync
                    ┌────────────▼────────────────────┐
                    │  Espace de travail partagé       │
                    │  (Dev) — FoodSalesWS             │
                    └────────────┬────────────────────┘
                                 │ branch out
          ┌──────────────────────▼─────────────────────┐
          │  Espace de travail isolé — My_FoodSales     │
          │  (branche : My FoodEdits)                   │
          │                                             │
          │  1. Modifier le modèle / rapport            │
          │  2. Commit des changements                  │
          │  3. Créer une Pull Request                  │
          │  4. Fusionner dans main                     │
          └──────────────────────┬─────────────────────┘
                                 │ update workspace
                    ┌────────────▼────────────────────┐
                    │  Espace de travail partagé       │
                    │  (Dev) — à jour                  │
                    └────────────┬────────────────────┘
                                 │ deploy
                    ┌────────────▼────────────────────┐
                    │  Pipeline de déploiement         │
                    │  Dev ──► Test ──► Production     │
                    └─────────────────────────────────┘
```

### Ce que vous avez appris

- Configurer un espace de travail Fabric avec une capacité Premium
- Connecter un espace de travail à un dépôt Git (Azure DevOps ou GitHub)
- Créer et gérer un pipeline de déploiement (Dev / Test / Prod)
- Travailler en isolation avec le **branching** d'espace de travail
- Commiter des modifications, créer des Pull Requests et fusionner
- Comparer et déployer le contenu entre les étapes du pipeline

---

> **Ressources complémentaires**
> - [Introduction à l'intégration Git — Microsoft Learn](https://learn.microsoft.com/fr-fr/fabric/cicd/git-integration/intro-to-git-integration)
> - [Introduction aux pipelines de déploiement — Microsoft Learn](https://learn.microsoft.com/fr-fr/fabric/cicd/deployment-pipelines/intro-to-deployment-pipelines)
> - [Déployer du contenu — Microsoft Learn](https://learn.microsoft.com/fr-fr/fabric/cicd/deployment-pipelines/deploy-content)
> - [Comparer les étapes d'un pipeline — Microsoft Learn](https://learn.microsoft.com/fr-fr/fabric/cicd/deployment-pipelines/compare-pipeline-content)
