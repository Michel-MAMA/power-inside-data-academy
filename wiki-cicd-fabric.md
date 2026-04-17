# CI/CD dans Microsoft Fabric — Guide de formation

> **Source officielle :** [Tutoriel sur la gestion du cycle de vie des applications — Microsoft Learn](https://learn.microsoft.com/fr-fr/fabric/cicd/cicd-tutorial)

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Prérequis](#2-prérequis)
3. [Étape 1 — Créer un espace de travail Premium](#3-étape-1--créer-un-espace-de-travail-premium)
4. [Étape 2 — Charger du contenu](#4-étape-2--charger-du-contenu)
5. [Étape 3 — Connecter l'espace de travail à Git](#5-étape-3--connecter-lespace-de-travail-à-git)
6. [Étape 4 — Créer un pipeline de déploiement](#6-étape-4--créer-un-pipeline-de-déploiement)
7. [Étape 5 — Déployer vers les autres étapes](#7-étape-5--déployer-vers-les-autres-étapes)
8. [Étape 6 — Créer un espace de travail isolé (branch out)](#8-étape-6--créer-un-espace-de-travail-isolé-branch-out)
9. [Étape 7 — Modifier l'espace de travail](#9-étape-7--modifier-lespace-de-travail)
10. [Étape 8 — Valider les modifications (Commit)](#10-étape-8--valider-les-modifications-commit)
11. [Étape 9 — Créer une Pull Request et fusionner](#11-étape-9--créer-une-pull-request-et-fusionner)
12. [Étape 10 — Mettre à jour l'espace de travail partagé](#12-étape-10--mettre-à-jour-lespace-de-travail-partagé)
13. [Étape 11 — Comparer les étapes du pipeline](#13-étape-11--comparer-les-étapes-du-pipeline)
14. [Étape 12 — Déployer vers la production](#14-étape-12--déployer-vers-la-production)
15. [Résumé](#15-résumé)

---

## 1. Vue d'ensemble

Ce tutoriel couvre le processus complet de gestion du cycle de vie des applications dans Microsoft Fabric. Il combine deux fonctionnalités clés :

| Fonctionnalité | Rôle |
|---|---|
| **Intégration Git** | Contrôle de version, collaboration, suivi des modifications |
| **Pipelines de déploiement** | Promotion du contenu entre les environnements (Dev → Test → Prod) |

**Flux de travail global :**

```
Dépôt Git (branche main)
        │
        ▼
Espace de travail Dev (connecté à main)
        │  déploiement
        ▼
Espace de travail Test
        │  déploiement
        ▼
Espace de travail Production
```

Chaque développeur travaille dans sa propre branche / espace de travail isolé, puis crée une Pull Request pour intégrer ses modifications dans la branche partagée.

---

## 2. Prérequis

### 2.1 Prérequis Fabric

- Une **capacité Fabric** (ou Power BI Premium) — [essai gratuit disponible](https://app.fabric.microsoft.com/home)
- Les commutateurs de locataire suivants doivent être **activés** par l'administrateur :

| Commutateur | Utilité |
|---|---|
| Les utilisateurs peuvent créer des éléments Fabric | Créer des artefacts dans Fabric |
| Les utilisateurs peuvent synchroniser des éléments d'espace de travail avec leurs dépôts Git | Activer l'intégration Git |
| Créer des espaces de travail | Nécessaire pour le branch-out vers un nouvel espace |
| Les utilisateurs peuvent synchroniser avec des dépôts GitHub | Pour les utilisateurs GitHub uniquement |

> Ces paramètres peuvent être délégués à l'administrateur de capacité ou à l'administrateur d'espace de travail.

### 2.2 Prérequis Git

#### Azure DevOps
- Un compte Azure DevOps actif (même locataire différent de Fabric accepté)
- Accès à un dépôt existant

#### GitHub
- Un compte GitHub actif
- Un **Personal Access Token (PAT)** — deux options :
  - **Jeton à granularité fine** (recommandé) : permission **Contenu** en lecture/écriture
  - **Jeton classique** : étendues `repo` activées

### 2.3 Fichier exemple

Télécharger le fichier [FoodSales.pbix](https://github.com/microsoft/fabric-samples/blob/main/docs-samples/cicd/FoodSales.pbix) dans un dépôt Git accessible en écriture.

---

## 3. Étape 1 — Créer un espace de travail Premium

1. Dans la barre de navigation gauche (expérience **Power BI**), cliquer sur **Espaces de travail > + Nouvel espace de travail**
2. Nommer l'espace de travail : `FoodSalesWS`
3. (Facultatif) Ajouter une description
4. Développer la section **Avancé** et sélectionner le type de licence :
   - **Version d'évaluation de Fabric**, ou
   - **Power BI Premium**
5. Cliquer sur **Appliquer**

---

## 4. Étape 2 — Charger du contenu

### 4.1 Importer le fichier .pbix

1. Dans la barre de menus supérieure, sélectionner **Charger > Parcourir**
2. Sélectionner le fichier `FoodSales.pbix` téléchargé

L'espace de travail contient maintenant un **rapport**, un **modèle sémantique** et un **tableau de bord**.

### 4.2 Modifier les informations d'identification *(première fois uniquement)*

> Cette étape est à effectuer **une seule fois** par modèle sémantique.

1. Aller dans **Paramètres > Power BI**
2. Sélectionner **Modèles sémantiques > Informations d'identification de la source de données > Modifier les informations d'identification**
3. Configurer :
   - **Méthode d'authentification** : `Anonyme`
   - **Niveau de confidentialité** : `Public`
   - Décocher **Ignorer la connexion de test**
4. Cliquer sur **Se connecter**

---

## 5. Étape 3 — Connecter l'espace de travail à Git

L'objectif est de connecter l'espace de travail partagé à la **branche principale** du dépôt Git, pour que toute l'équipe puisse suivre les modifications et revenir à des versions précédentes.

1. Aller dans **Paramètres de l'espace de travail** (coin supérieur droit)
2. Sélectionner **Intégration Git**
3. Choisir **Azure DevOps** (ou GitHub)
4. Renseigner les informations de connexion :

| Champ | Valeur |
|---|---|
| Organisation | Votre organisation Azure DevOps |
| Projet | Votre projet |
| Dépôt Git | Votre dépôt |
| Branche | `main` (ou `master`) |
| Dossier | Dossier contenant le fichier `.pbix` |

5. Cliquer sur **Se connecter et synchroniser**

Une fois connecté, l'icône de **Contrôle de code source** affiche `0` — les éléments de l'espace de travail et du dépôt sont identiques.

> Pour plus d'infos : [Introduction à l'intégration Git dans Fabric](https://learn.microsoft.com/fr-fr/fabric/cicd/git-integration/intro-to-git-integration)

---

## 6. Étape 4 — Créer un pipeline de déploiement

Un pipeline de déploiement permet de promouvoir le contenu entre les environnements **Développement**, **Test** et **Production**.

1. Depuis la page d'accueil de l'espace de travail, cliquer sur **Créer un pipeline de déploiement**
2. Nommer le pipeline : `FoodSalesDP` (description facultative), puis **Suivant**
3. Accepter les trois étapes par défaut : **Dev / Test / Production**, puis **Créer**
4. Affecter l'espace de travail `FoodSalesWS` à l'étape **Développement**

La phase de développement affiche le modèle sémantique, le rapport et le tableau de bord. Les étapes Test et Production sont vides.

> Pour plus d'infos : [Introduction aux pipelines de déploiement](https://learn.microsoft.com/fr-fr/fabric/cicd/deployment-pipelines/intro-to-deployment-pipelines)

---

## 7. Étape 5 — Déployer vers les autres étapes

### Dev → Test

1. Depuis l'étape **Développement**, cliquer sur **Déployer**
2. Confirmer le déploiement vers la phase de **Test**

Une icône de coche verte indique que le contenu des deux étapes est identique.

### Test → Production

Répéter la même opération depuis l'étape **Test** vers **Production**.

### Actualiser le modèle sémantique

Pour actualiser les données à n'importe quelle étape, cliquer sur le bouton **Actualiser** à côté de l'icône du modèle sémantique dans la carte de résumé.

> Pour plus d'infos : [Déployer du contenu avec les pipelines de déploiement](https://learn.microsoft.com/fr-fr/fabric/cicd/deployment-pipelines/deploy-content)

---

## 8. Étape 6 — Créer un espace de travail isolé (branch out)

Pour éviter d'interférer avec les modifications des autres membres de l'équipe, chaque développeur crée **son propre espace de travail** associé à **sa propre branche Git**.

1. Dans le menu **Contrôle de la source**, onglet *Branche*, cliquer sur la flèche bas à côté du nom de la branche
2. Sélectionner **Créer une branche vers un nouvel espace de travail**
3. Renseigner :
   - **Nom de la branche** : `MyFoodEdits`
   - **Nom de l'espace de travail** : `My_FoodSales`
4. Cliquer sur **Créer une branche**
5. Cliquer sur **Se connecter et synchroniser**

Fabric crée automatiquement l'espace de travail et le synchronise avec la nouvelle branche.

> **Note :** Les fichiers `.pbix` ne sont pas copiés dans le dépôt Git lors de la synchronisation (non pris en charge). Le modèle sémantique sera présent sous forme de dossier de définition.

---

## 9. Étape 7 — Modifier l'espace de travail

Dans cet exemple, nous modifions le format d'une colonne du modèle sémantique via le **modèle de données**.

1. Dans l'espace de travail, cliquer sur les **points de suspension** du modèle sémantique > **Ouvrir le modèle de données**

   > Si l'option est désactivée : **Paramètres > Power BI > Général** et activer **Paramètres du modèle de données**

2. Dans la table `Order_details`, sélectionner la colonne **Remise**
3. Dans le volet **Propriétés**, changer le **Format** de `Général` à `Pourcentage`

---

## 10. Étape 8 — Valider les modifications (Commit)

Après modification, l'icône de contrôle de code source affiche `1` — une modification non validée existe.

1. Cliquer sur l'icône **Contrôle de code source**
2. Vérifier que le modèle sémantique affiche l'état **Modifié**
3. Sélectionner l'élément à valider
4. (Facultatif) Ajouter un message de commit
5. Cliquer sur **Valider**

L'état passe à **Synced** — l'espace de travail et le dépôt Git sont synchronisés.

---

## 11. Étape 9 — Créer une Pull Request et fusionner

### Option manuelle

1. Dans le contrôle de source, cliquer sur **Créer une pull request**
2. Renseigner le titre, la description, les reviewers souhaités
3. Cliquer sur **Créer**
4. Une fois la revue effectuée, **Fusionner la pull request** (merge vers `main`)

> Une fois la fusion effectuée, l'espace de travail isolé `My_FoodSales` peut être supprimé manuellement (il n'est pas supprimé automatiquement).

### Option automatisée

Il est possible d'automatiser la fusion via des règles de branche et des pipelines CI dans Azure DevOps ou GitHub Actions.

---

## 12. Étape 10 — Mettre à jour l'espace de travail partagé

Après la fusion dans `main`, l'espace de travail partagé (`FoodSalesWS`) est désynchronisé. L'icône de contrôle de code source affiche `1` et le modèle sémantique indique l'état **Mise à jour requise**.

### Option manuelle

1. Cliquer sur l'icône **Contrôle de code source**
2. Vérifier les éléments modifiés
3. Cliquer sur **Mettre à jour tout**

### Option automatisée

Il est possible d'automatiser cette mise à jour via l'API REST de Fabric ou des pipelines CI/CD.

L'état repasse à **Synced**.

---

## 13. Étape 11 — Comparer les étapes du pipeline

1. Depuis l'espace de travail, cliquer sur **Afficher le pipeline de déploiement**
2. Observer l'icône orange `✗` entre les étapes — des modifications ont été apportées depuis le dernier déploiement
3. Cliquer sur **Vérifier les modifications** pour afficher les différences entre Dev et Test
4. Examiner les modifications, puis fermer la fenêtre

> Pour plus d'infos : [Comparer les étapes d'un pipeline de déploiement](https://learn.microsoft.com/fr-fr/fabric/cicd/deployment-pipelines/compare-pipeline-content)

---

## 14. Étape 12 — Déployer vers la production

Lorsque les modifications sont validées en Test, répéter le processus de déploiement (identique à l'**Étape 5**) :

- **Test → Production**

---

## 15. Résumé

Ce tutoriel couvre le cycle de vie complet d'un artefact dans Microsoft Fabric :

| Étape | Action |
|---|---|
| 1 | Créer un espace de travail avec capacité Fabric |
| 2 | Charger le contenu et configurer les credentials |
| 3 | Connecter l'espace de travail à la branche `main` Git |
| 4 | Créer un pipeline de déploiement (Dev / Test / Prod) |
| 5 | Déployer le contenu initial dans toutes les étapes |
| 6 | Créer une branche et un espace de travail isolé pour développer |
| 7 | Apporter des modifications au modèle sémantique |
| 8 | Committer les modifications dans la branche Git |
| 9 | Créer une Pull Request et fusionner dans `main` |
| 10 | Mettre à jour l'espace de travail partagé |
| 11 | Comparer les étapes Dev et Test |
| 12 | Déployer en Test puis en Production |

### Concepts clés à retenir

- **Intégration Git** = contrôle de version et collaboration (suivi, historique, revert)
- **Pipelines de déploiement** = promotion de contenu entre environnements sans scripts manuels
- **Branch out** = isolation du travail individuel pour éviter les conflits
- **Pull Request** = point de revue et de validation avant intégration dans l'environnement partagé
- Les fichiers `.pbix` ne sont pas pris en charge dans le dépôt Git — seuls les artefacts Fabric natifs sont synchronisés

---

## Ressources complémentaires

| Ressource | Lien |
|---|---|
| Tutoriel officiel Microsoft Learn | [CI/CD Tutorial — Fabric](https://learn.microsoft.com/fr-fr/fabric/cicd/cicd-tutorial) |
| Introduction à l'intégration Git | [Intro to Git Integration](https://learn.microsoft.com/fr-fr/fabric/cicd/git-integration/intro-to-git-integration) |
| Introduction aux pipelines de déploiement | [Intro to Deployment Pipelines](https://learn.microsoft.com/fr-fr/fabric/cicd/deployment-pipelines/intro-to-deployment-pipelines) |
| Éléments Fabric pris en charge par Git | [Supported Items](https://learn.microsoft.com/fr-fr/fabric/cicd/git-integration/intro-to-git-integration#supported-items) |
| Fichier exemple FoodSales.pbix | [GitHub - fabric-samples](https://github.com/microsoft/fabric-samples/blob/main/docs-samples/cicd/FoodSales.pbix) |
