# Cahier des Charges Technique – Projet Fil Rouge

# CDA (Concepteur Développeur d’Applications)

## Contexte et Objectifs du Projet

Dans le cadre de la formation CDA, chaque apprenant réalisera un **projet fil rouge** individuel sur 6 mois
(janvier à juin). L’objectif est de mener un projet complet, de l’idée initiale jusqu’au produit final, qui sera
présenté devant un jury en fin de formation. Ce projet doit permettre de mettre en pratique l’ensemble
des compétences acquises (analyse du besoin, conception, développement front-end/back-end, base de
données, tests, déploiement, etc.).

Ce **cahier des charges technique** vous est fourni comme référence et cadre de travail. Il définit les
**exigences techniques** et les étapes clés du projet afin de garantir une base commune de
compréhension et de faciliter la coordination tout au long du projet. En d’autres termes, tandis que
votre cahier des charges fonctionnel (CDCF) décrira **“quoi”** réaliser (besoins et fonctionnalités
attendues), ce cahier des charges technique se concentre sur **“comment”** le réaliser – en précisant les
choix d’architecture, de technologies et les contraintes à respecter. Chaque étudiant devra s’y
conformer lors de la réalisation de son projet.

**Organisation générale :** Le projet est découpé en **6 jalons mensuels** (fin de chaque mois de janvier à
juin). Pour chaque jalon, des livrables précis sont attendus (documents, code, etc., détaillés ci-dessous).
Les travaux sont individuels, toutefois l’entraide entre apprenants est encouragée pour surmonter les
difficultés techniques. Chaque livraison fera l’objet d’une évaluation et de retours. Le respect des
échéances est crucial pour étaler la charge de travail et assurer l’avancement du projet dans les temps
impartis.

## Contraintes Techniques et Socle Technologique Imposé

Afin d’harmoniser les projets et de couvrir le périmètre technique attendu, le **socle technologique est
imposé** pour tous les apprenants (vous n’avez pas le choix des technologies principales). Vous devrez
**justifier vos choix d’implémentation** (par exemple monolithique vs API séparée, choix du framework
front) dans votre cahier des charges fonctionnel initial à l’aide d’une courte analyse comparative. Les
exigences techniques sont les suivantes :

```
Back-end : Framework Symfony (PHP). Le cœur de l’application sera développé en Symfony
(version récente LTS de préférence). Vous pouvez réaliser une application full-stack Symfony
(Symfony gérant le back-end et le front avec Twig) ou bien développer une API Symfony RESTful
consommée par un front-end séparé. Dans le second cas, le front-end devra être une application
web moderne (React ou Angular principalement). Quel que soit l’option, indiquez dans votre
CDCF le choix retenu et pourquoi il est adapté à votre projet.
```
```
Front-end :
```
```
Si vous optez pour une application full Symfony : vous utiliserez Twig/HTML, CSS (framework CSS
au choix, par ex. Bootstrap) et Javascript pour l’interface utilisateur.
```
```
1
```
```
2
```
#### •

#### •

#### •


```
Si vous optez pour un front-end séparé : ce sera une Single Page Application en React ou
Angular (au choix, en dernière version stable).
```
```
Dans tous les cas, l’interface devra être responsive (adaptée desktop et mobile) et soignée en
termes d’UX/UI (charte graphique cohérente, ergonomie travaillée).
```
```
Base de données : Système de gestion de base de données relationnel obligatoire. Au choix :
MySQL/MariaDB, PostgreSQL ou SQL Server. NoSQL est exclu. Le schéma devra être conçu et
normalisé (Merise, voir jalon 3) et implémenté via un ORM (ex : Doctrine) ou SQL.
```
```
API externe : Intégrez au moins une API tierce externe dans votre application (exemples d’APIs
possibles : services Google Maps, OpenWeatherMap, API d’authentification OAuth Google/
Facebook, API de paiement, etc. en fonction de votre sujet). Cette intégration vise à vous
familiariser avec la consommation de services web externes. Prévoyez les appels à l’API et le
traitement des réponses, et assurez-vous de gérer les clés d’API de manière sécurisée
(configurées dans des variables d’environnement, non codées en dur).
```
```
Containerisation (Docker) : Le projet devra être dockerisé. Fournissez des conteneurs Docker
pour votre application (serveur web + PHP, base de données, etc.). L’utilisation de Docker garantit
un environnement uniforme du développement à la production (fini les “ça marche sur ma
machine” ). En effet, “l’utilisation de Docker avec Symfony réduit la complexité du déploiement,
permet une standardisation entre les environnements de développement, de test et de production,
facilite la reproductibilité des environnements, et offre une automatisation complète des processus de
déploiement”. Vous exploiterez Docker Compose pour orchestrer vos services (par ex, un
conteneur pour Symfony + PHP, un pour la BD, etc.), ce qui facilitera également les tests et la CI/
CD.
```
```
Contrôle de version (Git) : Hébergez votre code sur une plateforme Git (GitHub, GitLab... repo
privé ou public selon préférence). Adoptez une stratégie de versionnement professionnelle :
travaillez sur des branches (par fonctionnalité, ou branches develop / main , etc.), mergez via des
pull requests si possible. Le référentiel Git devra refléter l’historique du projet (commits
fréquents et significatifs, messages de commit clairs).
```
```
Intégration Continue (CI) : Mettez en place une pipeline CI pour automatiser l’intégration du
code. À chaque push sur le repo, au minimum les tests automatiques doivent s’exécuter et le
build/packaging de l’application peut être réalisé. Par exemple, configurez GitHub Actions ou
GitLab CI pour lancer les tests unitaires et fonctionnels automatiquement. Une intégration
continue efficace valide chaque changement de code par une compilation et une batterie de
tests automatisés, garantissant que les modifications n’ont pas introduit de régression.
L’objectif est d’identifier rapidement les bugs après chaque commit plutôt qu’en fin de projet.
```
```
Déploiement Continu (CD) : Idéalement, complétez la CI par un volet CD (Continuous Delivery/
Deployment) pour automatiser le déploiement de l’application. Par exemple, la pipeline pourrait
bâtir une image Docker de l’application et (si vous avez un serveur cible) la déployer
automatiquement sur un environnement de préproduction ou production. Ce volet peut être mis
en œuvre selon vos moyens (dépôt Docker Hub, déploiement sur un PaaS, etc.). L’important est
de montrer que vous avez réfléchi à la mise en production du projet. Nota: le déploiement
continu n’est pas forcément vers un serveur réel dans notre contexte pédagogique, mais au
minimum, vous devez être en mesure de fournir une procédure claire de mise en production
(script de déploiement, ou commandes Docker à exécuter, etc.).
```
#### • • • • • 3 4 • • 5 •


```
Tests automatisés : Le projet doit comporter des tests automatisés à plusieurs niveaux :
```
```
Tests unitaires (sur les composants métier, utils, etc. à l’aide de PHP Unit par exemple).
Tests fonctionnels ou d’intégration (simulateurs de requêtes HTTP pour tester vos API/
contrôleurs, tests end-to-end sur le front si SPA, par ex. avec Jest, Selenium, etc.).
```
```
D’autres types de tests sont appréciés si pertinents : tests de performance (mesurer le temps de
réponse de certaines fonctionnalités), tests de sécurité (scans de vulnérabilités basiques), tests
d’UI (par ex. vérification que l’interface rend bien sur mobile)... L’approche CI/CD implique
d’automatiser un maximum de ces vérifications à chaque changement de code afin d’assurer la
fiabilité continue du logiciel.
```
```
Sécurité : Votre application devra respecter les bonnes pratiques de sécurité web. En particulier,
assurez-vous de vous prémunir contre les failles courantes du Top 10 OWASP :
```
```
Injection SQL : utiliser des requêtes préparées ou l’ORM pour éviter toute injection de code SQL
malveillant.
XSS (Cross-Site Scripting) : ne jamais insérer d’entrée utilisateur non filtrée dans les pages
rendues, échapper les caractères spéciaux, utiliser les mécanismes fournis par Twig/Symfony
pour la sortie sécurisée. (Les failles XSS et injections font partie des attaques les plus critiques,
permettant à des attaquants d’injecter des scripts malveillants ou des commandes non prévues
pouvant voler des données sensibles).
CSRF : protéger les formulaires sensibles par des tokens CSRF (Symfony le propose nativement),
afin d’empêcher les soumissions frauduleuses depuis un site tiers.
Authentification et mots de passe : si votre application gère des comptes utilisateurs, les mots
de passe devront être hachés correctement (algorithme robuste comme bcrypt/Argon2, ne
jamais stocker de mots de passe en clair). La politique de mot de passe doit être sérieuse
(longueur minimale, éventuellement complexité). Envisagez de limiter les tentatives de
connexion pour éviter le brute force (ex : temporisation ou captcha après X échecs).
```
```
Protection des données personnelles (RGPD) : si votre projet manipule des données
personnelles (nom, email, etc.), il doit être conforme au RGPD. Cela implique transparence sur la
collecte des données, possibilité pour un utilisateur de demander la suppression de ses
données, stockage sécurisé des informations sensibles, etc. (Le RGPD est une directive légale
européenne à respecter pour la protection des données personnelles .) Incluez dans votre
documentation les mentions légales nécessaires (politique de confidentialité simplifiée pour
votre appli, même si fictive).
```
```
Architecture logicielle : Adoptez une architecture multi-couche propre (pattern MVC pour la
partie logicielle, architecture n-tiers pour la partie déploiement). Respectez la séparation des
responsabilités : vue vs contrôleur vs modèle, couche API vs couche métier vs couche d’accès aux
données, etc. Évitez de mêler du code de logique métier dans les vues ou vice-versa. Votre code
doit suivre les bonnes pratiques de développement (lisibilité, modularité, DRY/KISS, respect des
conventions de codage PSR pour PHP, etc.). Documentez ces aspects d’architecture dans vos
livrables de conception (voir jalon 4).
```
#### • • • • 6 • 7 • • 8 •

```
9 10
```
-

#### •

```
11
```
#### •


## Méthodologie et Organisation du Projet

Chaque apprenant est responsable de la **gestion de son projet** du début à la fin. Pour cela, il est
attendu que vous appliquiez une méthodologie de gestion de projet appropriée, et que vous vous
outilliez pour organiser votre travail efficacement :

```
Méthode de gestion de projet : Vous pouvez suivre une approche classique (cycle en V) ou agile
(Scrum/Kanban) en fonction de ce qui est le plus adapté à votre façon de travailler en solo.
L’approche agile est recommandée, étant donné que vous aurez des livraisons mensuelles
itératives (chaque jalon correspondant à une version enrichie du projet). Par exemple, vous
pouvez planifier des sprints correspondant aux jalons, avec des objectifs clairs pour chacun. Si
vous optez pour Scrum, vous serez à la fois Product Owner, Scrum Master et Dev de votre projet
```
- ce qui est un défi d’organisation! Dans tous les cas, définissez dès le début un **planning
prévisionnel** du projet (découpage des tâches par mois/sprint) et mettez-le à jour en fonction de
l’avancement réel.

```
Planning et suivi : Utilisez des outils pour planifier et suivre vos tâches. Un diagramme de
Gantt global peut être réalisé pour visualiser les phases du projet et les dates de rendus. En
parallèle (ou à la place), vous pouvez tenir un tableau de bord Kanban (via Trello, Jira, GitHub
Projects...) listant toutes les tâches à faire, en cours, terminées. Cela vous aidera à prioriser et à
ne rien oublier. Identifiez les tâches critiques et leurs échéances (ex: conception terminée d’ici fin
mars, développement de telle fonctionnalité en avril, etc.). N’oubliez pas d’anticiper du temps
pour les imprévus et les tests.
```
```
Gestion de configuration et branches Git : Mettez en place une organisation claire de votre
dépôt Git. Par exemple, vous pouvez adopter GitFlow ou une variante simplifiée :
```
```
Une branche principale (main ou master) contenant les versions stables (livrables aux
jalons).
Une branche de développement (develop) où s’intègrent les fonctionnalités en cours avant
stabilisation.
Des branches feature pour chaque nouvelle fonctionnalité ou user story, qui seront fusionnées
(merge) une fois terminées et testées.
```
```
Pensez à utiliser des messages de commit explicites, et à versionner également vos fichiers de
configuration (Docker, CI, etc.).
```
```
Outils de collaboration : Même en travaillant seul, traitez votre projet de manière
professionnelle. Par exemple, utilisez les issues GitHub/GitLab pour tracer les fonctionnalités/
bugs, utilisez la wiki ou le README du repo pour documenter l’installation, etc. Cela vous aidera à
structurer votre travail et constituera un plus pour la soutenance (capacité à utiliser les outils de
gestion de projet).
```
```
DevOps – CI/CD : Comme mentionné dans le socle technique, planifiez la mise en place de votre
pipeline CI/CD. Choisissez la plateforme (GitHub Actions, GitLab CI, etc.) et décrivez quelles
étapes seront automatisées (tests, build, déploiement). Par exemple : “À chaque push sur la
branche develop, GitHub Actions exécute les tests PHP Unit et bâtit l’image Docker de l’application; sur
push de tag release en main, déploiement automatique de l’image sur le serveur de prod.” Même si
tout n’est pas implémenté dès le début, ayez cette vision dès le cahier des charges. Vous devrez
configurer progressivement ces automatisations au fil des jalons.
```
#### •

#### •

```
12
```
```
13
```
#### • • • • • • •


En synthèse, soyez **organisé et proactif**. Ce projet au long cours nécessite régularité et rigueur.
N’attendez pas le dernier moment pour développer : suivez les jalons, ce découpage est là pour vous
guider et éviter l’effet “tunnel”. Documentez bien à chaque étape, conservez les traces (commits Git,
documentation des choix, etc.) afin de pouvoir justifier vos décisions techniques lors de la soutenance.

## Calendrier des Jalons et Livrables Attendus

Le projet est structuré en **6 jalons** , correspondant aux 6 mois de développement. Chaque fin de mois,
vous devrez remettre les livrables attendus via la plateforme Teams (section Devoirs), de préférence
avant le _dernier jour ouvrable_ du mois concerné. Les livrables pourront être des documents PDF, des
liens vers votre dépôt Git, des archives de code, etc., selon la nature demandée. Sauf indication
contraire, chaque rendu est **écrit** (un document, éventuellement accompagné de fichiers annexes). Des
soutenances orales intermédiaires pourront être organisées sur certains jalons pour faire un point
d’avancement (vous en serez informés en amont si c’est le cas), mais partons du principe que
l’évaluation se fait sur pièces écrites/logiciels rendus.

Voici le détail des six jalons, avec leur échéance et le contenu attendu :

### Jalon 1 – Janvier : Cahier des Charges Fonctionnel

**Échéance :** Dernier jour ouvrable de janvier 2026 (31/01/2026).
**Livrable :Cahier des charges fonctionnel** (document PDF).
**Contenu attendu :** Ce document doit présenter de manière structurée votre projet tel que conçu au
niveau _métier_ et _fonctionnel_. Il correspond au **chapitre III. Cahier des charges** du rapport final. Il devra
inclure :

```
Contexte métier : Présentez le sujet que vous avez choisi pour votre application. Décrivez le
domaine ou le secteur d’activité concerné, le problème à résoudre ou le besoin auquel répondra
votre application, et qui seront les utilisateurs cibles. Par exemple, s’il s’agit d’une application de
gestion de bibliothèque en ligne, expliquez brièvement la situation actuelle des bibliothèques et
l’intérêt d’une solution numérique. Cette section « Contexte » plante le décor et justifie l’existence
du projet.
```
```
Objectifs du projet : Énoncez clairement les objectifs principaux de votre application. Que
permettra-t-elle de faire? Quels bénéfices ou valeur ajoutée apportera-t-elle aux utilisateurs ou à
l’organisation? Vous pouvez formuler cela sous forme de bullet points. Par exemple : “Permettre
aux utilisateurs de créer un compte et de réserver des livres en ligne” , “Digitaliser le suivi des emprunts
pour réduire les tâches manuelles du bibliothécaire” , etc. Les objectifs doivent être SMART
(Spécifiques, Mesurables, Atteignables, Réalistes, Temporellement définis).
```
```
Périmètre fonctionnel (exigences fonctionnelles) : Détaillez les fonctionnalités attendues de
l’application. Il s’agit des exigences fonctionnelles majeures. Listez les fonctionnalités sous
forme de liste numérotée ou de sous-sections, en décrivant pour chacune ce qu’elle fait. Par
exemple :
```
```
Fonctionnalité 1 : Gestion des utilisateurs (inscription, connexion, profils, rôles...).
Fonctionnalité 2 : Recherche de livres par titre/auteur.
Fonctionnalité 3 : Emprunt et réservation de livres en ligne.
```
#### • • • • • •


```
Fonctionnalité 4 : Interface d’administration pour le bibliothécaire (gestion du catalogue, suivi
des emprunts, etc.).
... etc.
Il est important de couvrir tous les cas d’utilisation principaux. N’entrez pas encore dans les
détails d’implémentation technique ici, restez orienté “besoin utilisateur”. Si certaines
fonctionnalités sont hors scope (pas prévues dans le temps imparti), vous pouvez le mentionner
pour cadrer le périmètre.
```
```
Exigences techniques : Dans un cahier des charges fonctionnel , cette partie sert à lister les
contraintes et choix techniques globaux du projet (sans rentrer dans la réalisation détaillée qui
sera traitée plus tard). Ici, récapitulez le socle technique imposé en l’adaptant à votre projet :
```
```
Indiquez le choix d’architecture : application Symfony monolithique ou Symfony API + front
Angular/React? Précisez votre option.
Précisez les principaux composants techniques : langage (PHP 8+), framework (Symfony),
bibliothèque front (React 18 ou Angular 15, etc. si applicable), base de données (nommez le
SGBD choisi, par ex. MySQL 8 ou PostgreSQL 15), outils de conteneurisation (Docker), etc.
Justifiez brièvement ces choix par rapport aux besoins de votre projet. Par exemple : pourquoi
un front séparé en React est pertinent (ex : application à usage grand public nécessitant une UX
très réactive) ou pourquoi au contraire un full Symfony suffit (ex : back-office interne, simplicité
de développement). Si vous hésitez entre plusieurs solutions, expliquez en une phrase le résultat
de votre benchmark ou comparaison (par ex. “Symfony a été retenu plutôt que Laravel car la
promotion est formée sur Symfony et pour garantir une homogénéité technique” ).
Indiquez les contraintes imposées : utilisation de Docker, CI/CD, tests, sécurité (listez-les sans
forcément détailler, car c’est dans le CDC technique qu’on les explique – néanmoins, assurez-vous
que le destinataire du CDCF sache qu’il y a ces exigences techniques à satisfaire).
Contraintes de qualité : vous pouvez mentionner brièvement des attentes comme “code
maintenable, respect des normes PSR, documentation du code”.
```
_(Note : Bien que le CDCF se concentre sur le_ quoi _, il peut inclure une section d’exigences techniques pour
cadrer le_ comment _de haut niveau, surtout dans un contexte pédagogique où le socle est imposé. Veillez
cependant à ne pas trop détailler d’emblée la solution technique – gardez cela pour la conception technique
ultérieure. Ici on attend surtout que vous confirmiez utiliser Symfony, une BD SQL, etc., en montrant que vous
avez compris ces choix.)_

```
Contraintes et enjeux du projet : Décrivez les contraintes temporelles et autres contraintes
du projet. Par exemple, précisez la durée (6 mois de développement, avec présentation finale en
fin de formation), les jalons mensuels (vous pouvez mentionner que le projet sera découpé en 6
phases correspondant à ce document). Indiquez le temps dont vous disposez chaque semaine
si pertinent (ex : si c’est un projet en alternance, X jours par semaine).
Mentionnez d’éventuelles contraintes réglementaires ou normatives liées au sujet (ex : pour un
projet manipulant des données de santé, mention de la réglementation HIPAA ou RGPD ; pour
un site e-commerce, conformité PCI-DSS si paiements en ligne, etc.).
Abordez les risques majeurs identifiés en amont : par exemple, “dépendance à une API tierce
pouvant changer”, “délai court pour implémenter toutes les fonctionnalités souhaitées” , etc., ainsi que
les hypothèses prises (par ex. “on suppose que l’API Google Maps restera gratuite pour nos
volumes” ).
Enfin, vous pouvez inclure ici les critères de succès du projet : comment saura-t-on à la fin que
le projet est une réussite? (Ex: l’ensemble des fonctionnalités implémentées et testées,
performance acceptable <1s par requête, interface validée par des utilisateurs tests, etc.)
```
#### • • • • • • • • • • •


En résumé, le Jalon 1 consiste à produire un **CDCF complet** et validé. Ce document sera votre référence
fonctionnelle tout au long du développement. Il doit idéalement être **validé par le référent** (votre
formateur) avant d’entamer la conception détaillée, afin de s’assurer que le sujet et le périmètre sont
cohérents et réalisables dans le temps imparti. Une fois validé, vous pourrez passer à la phase de
design au jalon suivant.

### Jalon 2 – Février : Méthodologie de Projet & Conception UI/UX

**Échéance :** Dernier jour ouvrable de février 2026 (28/02/2026).
**Livrables :** Deux livrables principaux sont attendus ce mois-ci (vous pouvez les combiner ou les séparer
selon votre préférence) :

1. **Documentation de méthodologie et organisation du projet** (PDF).
2. **Livrables de conception UX/UI** (maquettes, PDF de présentation, etc.).

Ce jalon correspond principalement aux chapitres **IV. Méthodologie et organisation** et **V. Conception
UI/UX** de votre documentation finale. Voici le détail de ce qui est attendu :

**1. Document Méthodologie et Organisation (Gestion de projet) :**
Ce document doit expliquer comment vous planifiez et pilotez votre projet. Il s’appuie sur les directives
de la section _IV_ du cahier des charges technique. Incluez notamment :

```
Méthode de gestion de projet : Précisez la méthodologie adoptée (Agile Scrum, Kanban, cycle
en V, etc.) et justifiez ce choix par rapport à votre contexte. Par exemple : “Méthode Scrum utilisée
sur 5 sprints mensuels, car elle permet des ajustements continus et correspond bien au découpage en
jalons”. Si vous êtes seul, expliquez comment vous adaptez la méthode (sprints allégés, réunions
Scrum simulées via un journal de bord, etc.).
```
```
Planning (macro-planning) : Fournissez un planning global du projet jusqu’en juin.
Idéalement, insérez un diagramme de Gantt ou un calendrier mentionnant les grandes phases
et les jalons. Chaque jalon (fin Janv, fin Fév, ...) devrait y apparaître avec les livrables
correspondants. Indiquez aussi les principales tâches ou lots de travaux pour chaque phase. Par
exemple, en février : “Design UI/UX”, en mars : “Modélisation BD”, avril : “Développement
backend”, mai : “Intégration et tests”, juin : “Finalisation et déploiement”. Si vous utilisez un
outil (MS Project, TeamGantt, etc.), vous pouvez exporter une image du planning dans le PDF.
```
```
Outils de suivi : Décrivez comment vous suivez l’avancement. Par exemple : “Utilisation d’un
tableau Trello pour gérer les tâches, avec des colonnes À faire/En cours/Fait” , ou “Suivi des tâches via
les issues GitLab”. Mentionnez la fréquence de vos mises à jour (ex: revue hebdomadaire des
progrès, adaptation du planning si retard/priorités changées).
```
```
Gestion du code source (Git) : Présentez la stratégie de versioning Git mise en place.
Décrivez les branches que vous comptez utiliser (ex: “une branche main pour les releases jalons,
une branche develop pour l’intégration continue des features, et des branches individuelles par
fonctionnalité ou correctif” ). Expliquez comment vous gérez les merges et éventuellement les
revues de code (même en solo, s’obliger à relire son code). Si vous avez déjà initialisé le dépôt Git
et fait quelques commits (par exemple, création du projet Symfony, structure de base), c’est très
bien – mentionnez-le et fournissez le lien du dépôt dans le document.
```
```
CI/CD planifié : Décrivez votre plan pour la pipeline CI/CD. Même si l’implémentation effective
interviendra plus tard, indiquez par exemple : “Mise en place d’une intégration continue via GitHub
```
#### •

#### •

```
13
```
#### •

#### •^14

#### •


```
Actions : chaque push lance les tests PHPunit et ESLint. Envisageable d’ajouter un déploiement auto
Docker sur Heroku à partir de mai.” L’objectif est de montrer que vous avez anticipé
l’automatisation. Vous pouvez aussi citer les outils que vous prévoyez d’utiliser (ex: GitHub Actions
pour CI, Docker Hub pour stocker les images, etc.). Cette partie démontre votre compréhension
de la démarche DevOps même si tout n’est pas encore en place.
```
_(Astuce : Vous pouvez structurer ce document méthodo en reprenant les sous-parties 4.a, 4.b, 4.c du CDC
technique afin d’être sûr de tout couvrir : 4.a Gestion de projet (méthode + planning), 4.b Versionning Git
(organisation du repo), 4.c DevOps (CI/CD).)_

**2. Conception UX/UI :**
Parallèlement à la partie organisationnelle, le jalon 2 est consacré à la **conception de l’interface
utilisateur** et de l’expérience utilisateur (UX). C’est le contenu du chapitre _V. Conception UI/UX_ de votre
dossier final. Les livrables attendus sont :

```
Zoning / Sitemap : Fournissez un schéma de zoning qui présente la structure globale de votre
application (disposition des zones principales à l’écran) ou un plan de site indiquant les
différentes pages/écrans envisagés et la navigation entre eux. Cela peut être un dessin ou
schéma simple montrant, par exemple, le header, menu, zone de contenu, footer pour la page
type, ou une carte des écrans (Accueil -> Page X -> Page Y, etc.).
```
```
Wireframes (maquettes fil de fer) : Pour les principales pages de l’application, réalisez des
wireframes basse fidélité. Ces maquettes en noir et blanc définissent l’agencement des
éléments sans le design final. Concentrez-vous sur le fonctionnel : où seront les menus, les
boutons, les champs, comment l’information est structurée. Vous pouvez utiliser des outils
comme Figma, Balsamiq, Adobe XD, ou même dessiner à la main du moment que c’est
proprement numérisé. Les wireframes doivent couvrir les écrans clés (ex : page d’accueil, page
de liste d’un élément, page de détail, formulaires principaux, etc., y compris la version mobile si
l’agencement diffère notablement).
```
```
Charte graphique : Définissez l’identité visuelle de votre application. Présentez dans une courte
section la charte graphique retenue : couleurs principales et secondaires (avec codes
hexadécimaux), polices de caractères utilisées (titres, texte courant), style d’icônes ou
illustrations, éventuellement le ton général (moderne, épuré, fun, professionnel, etc.). Expliquez
en quelques phrases les choix (par ex. “Couleurs bleu et blanc pour inspirer confiance et rappeler le
logo de l’entreprise X” ). Cette charte servira de référence pour la réalisation des maquettes
graphiques et du front-end.
```
```
Maquettes graphiques haute fidélité : Réalisez des mockups ou prototypes graphiques
représentant l’apparence finale de votre application pour au moins 2 écrans : un écran en
version desktop et le même en version mobile (smartphone), afin de démontrer la responsivité.
Vous pouvez en faire pour plusieurs pages si possible (ex: page d’accueil et page de profil
utilisateur). Ces maquettes doivent appliquer la charte graphique définie (couleurs, polices, etc.)
et être le plus proche possible du rendu final prévu. Utilisez Figma, Adobe XD, Sketch ou autre
outil graphique. Intégrez les images de vos maquettes dans le PDF (ou fournissez un lien si
interactif via Figma). On doit pouvoir visualiser à quoi ressemblera l’application une fois
développée.
```
```
Prototype (optionnel) : Si vous le souhaitez et en avez la maîtrise, vous pouvez fournir un
prototype cliquable (par exemple via Figma ou Adobe XD) permettant de simuler quelques
```
#### •

#### •

#### •

#### •

#### •


```
interactions de navigation entre vos écrans. Ceci n’est pas obligatoire, mais serait un plus pour
valider l’ergonomie.
```
```
Considérations UX : Ajoutez quelques notes sur les choix UX : comment vous assurez une
bonne expérience utilisateur (simplicité d’utilisation, accessibilité, parcours utilisateur fluide).
Par exemple, mentionnez si vous appliquez des principes Mobile First, ou si vous avez prévu des
retours visuels clairs (messages de validation/erreur), etc. L’interface doit respecter les standards
pour ne pas dérouter l’utilisateur.
```
Au terme de ce jalon 2, **tous les aspects “design” et “organisation” du projet doivent être validés**
avant d’entamer réellement le développement. En pratique, cela signifie que vous (et votre référent)
avez une vision claire de ce que l’appli fera, à quoi elle ressemblera, et comment vous allez vous
organiser pour la construire. Vous aurez ainsi toutes les clés en main pour démarrer la phase de
conception technique et de développement dès le mois suivant.

_(Conseil : Profitez de ce travail de maquettes pour recueillir des avis – par exemple, montrez vos maquettes à
d’autres étudiants comme de futurs utilisateurs, et intégrez leurs retours si pertinents. Il vaut mieux ajuster
l’UI à ce stade qu’en toute fin de projet.)_

### Jalon 3 – Mars : Modélisation de la Base de Données

**Échéance :** Dernier jour ouvrable de mars 2026 (31/03/2026).
**Livrable :Dossier de conception de la base de données** (PDF, pouvant contenir des schémas importés
+ explications).

Ce jalon correspond au chapitre **VI. Modélisation de la base de données** de votre rapport. L’objectif est
de produire l’ensemble des livrables relatifs à la conception de la base de données, en suivant une
démarche MERISE (ou équivalent UML si vous préférez, mais MERISE est explicitement mentionné dans
le programme).

**Contenu attendu :**

```
Introduction à la méthode (MERISE) : En quelques phrases, rappelez la démarche que vous
suivez pour la modélisation. Par exemple : “Conformément à MERISE, nous abordons la
modélisation en trois étapes : Modèle Conceptuel de Données (MCD), Modèle Logique (MLD) puis
Modèle Physique (MPD). Cette progression du conceptuel vers le physique permet de s’assurer que la
base de données répondra aux besoins fonctionnels identifiés, tout en étant optimisée pour le SGBD
choisi.” (Cette introduction montre votre compréhension, mais reste brève pour ne pas alourdir
inutilement.)
```
```
Dictionnaire des données : Présentez un dictionnaire des données listant l’ensemble des
entités (futures tables) identifiées, avec pour chacune les principaux attributs et leur
signification. Par exemple, pour une entité Utilisateur , lister les attributs : id, nom, prénom, email,
mot_de_passe, date_inscription, etc., avec une description de chacun (et éventuellement le type
de donnée attendu, sans encore aller jusqu’au type SQL précis). Le dictionnaire aide à clarifier le
sens de chaque donnée et à éviter les ambiguïtés. Il peut être fait sous forme de tableau.
```
```
Modèle Conceptuel de Données (MCD) : Fournissez un diagramme Entité-Association
complet correspondant à votre application. Le MCD doit représenter toutes les entités métiers
identifiées (objets principaux du domaine) reliées par des associations. Indiquez bien les
```
#### •

#### •

#### •

#### •


```
cardinalités (0,1,N) de chaque côté de chaque association, les éventuelles entités associatives,
etc. Par exemple, on s’attend dans un projet type bibliothèque à voir des entités comme
Utilisateur , Livre , Emprunt (cette dernière pouvant être une association entre Utilisateur et Livre)
etc., avec leurs attributs clés. Votre MCD peut être réalisé avec un outil (MySQL Workbench,
PowerAMC, Dia, LucidChart, etc.) ou dessiné proprement. Veillez à la lisibilité. Incluez-le dans le
PDF (en bonne résolution). Si le diagramme est trop grand, il est possible de le répartir en sous-
domaines ou de le mettre en annexe, mais en général pour un projet de cette taille il devrait
tenir sur une page.
```
```
Modèle Logique de Données (MLD) : Il s’agit de la traduction du MCD en modèle relationnel
(tables). Présentez le MLD sous une forme structurée, par exemple : pour chaque future table,
donnez son nom, sa clé primaire, ses attributs avec types génériques, et clés étrangères vers
d’autres tables. Vous pouvez présenter cela sous forme textuelle ou par un diagramme
relationnel (type chenille ou UML class diagram stéréotypé table). Par exemple : Table
UTILISATEUR (id_utilisateur PK, nom, prenom, email, mot_de_passe, ...) ; Table LIVRE (id_livre PK, titre,
auteur, ...) ; Table EMPRUNT (id_emprunt PK, date_emprunt, date_retour, id_utilisateur FK ->
UTILISATEUR, id_livre FK -> LIVRE, ...). Assurez-vous que toutes les entités du MCD se retrouvent en
tables, que les associations ont été transformées correctement (tables de liaison si besoin), et
que les cardinalités sont respectées via les clés étrangères (ex: une association 0,n devient une
FK nullable dans la table côté N, etc.). Mentionnez les contraintes d’intégrité : unicités, not null,
etc., découlant du modèle.
```
```
Modèle Physique de Données (MPD) : Ici vous spécifiez le schéma pour le SGBD choisi. Donnez,
pour chaque table, les types de colonnes concrets (types SQL), la taille des champs si applicable,
les index, etc. Vous pouvez présenter le MPD sous forme de script SQL de création de la base
(extraits des commandes CREATE TABLE commentées), ou bien sous forme de tableau listant
les colonnes avec type SQL exact. Par exemple : id_utilisateur : INT(11) AUTO_INCREMENT, PK ;
email : VARCHAR(255), INDEX unique , etc. Si vous avez des triggers, procédures, précisez-les (peu
probable à ce stade). Le MPD doit tenir compte des spécificités du SGBD (par ex. types SERIAL
sur PostgreSQL, moteur InnoDB sur MySQL, etc.).
```
```
Justifications et vérification : Expliquez en quelques lignes comment votre modèle répond aux
besoins fonctionnels du projet. Par exemple : “Le MCD montre qu’un utilisateur peut emprunter
plusieurs livres simultanément (association 0,n), et qu’un livre peut être emprunté plusieurs fois au
cours du temps (plusieurs emprunts distincts) mais pas par deux utilisateurs à la fois (d’où l’attribut
date_retour pour savoir si un emprunt est en cours).” Mentionnez si vous avez fait des choix de
modélisation particuliers : e.g., “Nous avons inclu une table de correspondance pour les catégories de
livres afin de normaliser la base et éviter les redondances”. Assurez-vous d’avoir éliminé les
principales redondances (forme normale 3NF généralement) et que chaque donnée a sa place
logique.
```
Au terme du jalon 3, **la conception de votre base de données doit être finalisée et validée**. Cela
servira de fondation pour le développement back-end (entités, ORM, etc.). Vous devriez idéalement
créer cette base sur votre SGBD à ce stade (voire générer les entités Doctrine si vous êtes dans
Symfony) pour vérifier la cohérence. Toutefois, le livrable attendu reste le document de modélisation.
N’hésitez pas à tester quelques requêtes ou à insérer des données factices pour valider les relations.

_(Note : La qualité de cette modélisation est cruciale – une base mal conçue entraîne de grandes difficultés par
la suite. Prenez le temps de bien la penser en fonction des opérations que devra réaliser votre application.)_

#### •

#### •

#### •


### Jalon 4 – Avril : Conception de l’application & Architecture

**Échéance :** Dernier jour ouvrable d’avril 2026 (30/04/2026).
**Livrable :Dossier de conception technique de l’application** (PDF avec schémas UML, description
d’architecture).

Ce jalon correspond au chapitre **VII. Conception de l’application** et contribue également au chapitre
**VIII. Architecture multi-couches** de la documentation finale. L’objectif est de produire l’ensemble des
**diagrammes UML et descriptions techniques** qui vont guider le développement et documenter la
structure interne de votre application. En parallèle de ce livrable, le **développement du backend et du
frontend va débuter** – idéalement, vous commencerez à coder en suivant ces plans.

**Contenu attendu :**

```
Diagrammes de cas d’utilisation (Use case UML) : Élaborés à partir des exigences
fonctionnelles du CDCF, les use cases UML offrent une vue d’ensemble des interactions
utilisateurs-système. Fournissez un ou des diagrammes de cas d’utilisation couvrant l’ensemble
des fonctionnalités principales. Chaque cas d’utilisation représente un scénario utilisateur (ex:
“Gérer l’emprunt d’un livre” ou “S’inscrire et créer un compte”). Les acteurs (utilisateur, admin,
etc.) doivent être identifiés. Assurez-vous que chaque fonctionnalité mentionnée en Jalon 1 est
représentée par au moins un use case. Montrez éventuellement les relations include/extend s’il y
en a (ce n’est pas obligatoire d’en avoir). Ces diagrammes permettent de vérifier que rien n’a été
omis niveau fonctionnalités et que l’on sait qui fait quoi dans le système.
```
```
Diagrammes de séquence : Choisissez 2 à 3 cas d’utilisation principaux et détaillez-les via des
diagrammes de séquence. Un diagramme de séquence illustre l’enchaînement des messages
entre objets ou composants pour réaliser une fonctionnalité donnée, au fil du temps. Par
exemple, un diagramme de séquence “Emprunter un livre” pourrait impliquer : l’utilisateur
envoie une requête via l’UI, le contrôleur Symfony reçoit la requête HTTP, appelle un service
métier EmpruntManager , qui interagit avec le dépôt LivreRepository pour vérifier la disponibilité,
puis crée un objet Emprunt , le sauvegarde via l’ORM, etc., et retourne une réponse ou vue à
l’utilisateur. Montrez les principaux échanges entre front-end et back-end (si appli séparée,
montrez l’appel API), entre contrôleurs, services métiers, modèles et base de données. Ces
séquences aideront à clarifier la découpe en couches et la logique d’exécution. Respectez la
syntaxe UML (obligation conditionnelle, boucles éventuelles, etc., si nécessaire pour la
compréhension).
```
```
Diagramme de classes : Fournissez un diagramme de classes UML couvrant les principales
classes de votre application côté back-end (et éventuellement côté front si vous voulez montrer
des structures de composants front). Concentrez-vous notamment sur les classes métier et les
relations entre elles. Par exemple, classes Utilisateur, Livre, Emprunt avec leurs attributs et
opérations principales, et relations (association, composition, agrégation, héritage) éventuelles.
Incluez aussi les classes importantes du domaine applicatif ou des design patterns utilisés (par
ex. si vous implémentez un pattern Observateur, montre-le). Il n’est pas nécessaire de détailler
toutes les classes du framework Symfony (vous n’allez pas dessiner la classe Controller du
framework ), mais vous pouvez inclure vos classes contrôleurs spécifiques si vous en avez
plusieurs et que leurs interactions méritent d’être montrées. Mettez l’accent sur la structure de
données et la logique : par ex. “une classe Emprunt est composée d’un Utilisateur et d’un Livre
(composition), la classe Livre peut exister indépendamment (agrégation sur Emprunt)” , etc.
Mentionnez les cardinalités sur les associations si utile (ex: 1 Utilisateur peut avoir N Emprunts).
Vous pouvez également représenter la séparation en couches via des packages UML ou des
```
#### •

#### •

#### •


```
annotations (ex: groupe de classes “Controllers”, groupe “Services”, groupe “Entities/Models”).
Astuce : vous pouvez partir de votre MCD/MLD comme base pour le diagramme de classes côté
données (les entités ORM correspondent aux tables) puis ajouter les classes de logique
applicative.
```
```
Description de l’architecture multi-couches : Rédigez une section expliquant l’ architecture
logicielle de votre application :
```
```
Pattern MVC : Décrivez comment vous implémentez MVC avec Symfony. Par exemple : “Nous
utilisons le pattern MVC : les Contrôleurs Symfony reçoivent les requêtes et préparent les données, la
logique métier est encapulée dans des Services (classes du dossier src/Service), qui font appel
aux Modèles (Entités JPA/Repositories pour la BD). Les vues sont gérées soit par Twig (templates MVC
côté serveur) soit par l’application front React.”
Architecture n-tiers : Exposez la structure physique en n-tier. Typiquement : client (navigateur
web ou appli front JS) – serveur web/app (Symfony sur serveur Apache/Nginx ou PHP interne) –
base de données (MySQL/Postgres). Indiquez si vous prévoyez des séparations supplémentaires
(ex: serveur d’authentification tiers, service externe). Montrez éventuellement un petit schéma
d’architecture déployée (pas obligatoire, une description texte peut suffire). Précisez sur quels
tiers physiques tournent les composants : par exemple, “L’application sera conteneurisée : un
conteneur Docker pour l’application Symfony (comprenant serveur web Apache + PHP + code), un
conteneur séparé pour la base de données MySQL. En production ces conteneurs pourraient tourner
sur un même hôte ou être répartis.” Attention à la distinction entre couche logique et tiers
physique : expliquez que vous comprenez la différence (on peut très bien déployer toutes les
couches logiques sur un même serveur physique, ça reste une archi 3-tiers logique).
Séparation des responsabilités / bonnes pratiques : Indiquez comment vous avez veillé à
garder un code propre et modulaire. Par exemple : “Nous avons suivi le principe SOLID de Single
Responsibility : chaque classe a une responsabilité définie (ex: le service EmpruntService gère la
logique d’emprunt uniquement). La configuration sensible est isolée (fichiers .env pour les secrets). Le
routage Symfony est centralisé dans les controllers, etc.” Mentionnez l’utilisation potentielle de
design patterns spécifiques si c’est le cas (Factory, Singleton, Strategy... seulement si vous en
utilisez).
```
```
Composants externes/bibliothèques : Précisez si vous intégrez des bundles ou librairies
additionnelles dans Symfony (ex: API Platform, LexikJWT for auth, etc.) ou des packages npm
côté front. Expliquez comment ils s’intègrent à l’architecture globale.
```
```
Schémas complémentaires (si nécessaires) : Vous pouvez ajouter tout schéma aidant à
comprendre votre conception technique. Par exemple, un schéma des composants déployables,
un schéma d’ état (state machine) si vous avez des workflows complexes, etc. Ce n’est pas
obligatoire, ajoutez seulement si cela apporte de la valeur à expliquer un aspect particulier.
```
Après ce jalon 4, **la phase de conception s’achève** : vous devriez disposer de toute la documentation
nécessaire pour coder efficacement, et avoir validé l’architecture auprès du formateur. Concrètement, à
l’issue d’avril, **le développement logiciel doit être bien entamé**. Idéalement, vous aurez déjà codé
certains éléments de base : création du projet Symfony, configuration de la base (entités générées),
peut-être implémenté 1 ou 2 fonctionnalités simples en suivant vos diagrammes, et un squelette
d’interface si front séparé. Cela vous permettra de vérifier que votre conception tient la route et
d’ajuster si besoin (il est fréquent de faire évoluer légèrement le modèle ou les classes une fois
confrontés au code réel ; si tel est le cas, pensez à mettre à jour vos diagrammes pour qu’ils restent
cohérents avec l’implémentation finale).

#### • • • • • •


_(Note : Ce jalon 4 est dense car il nécessite une bonne maîtrise d’UML et de l’architecture. Ne le négligez pas –
un investissement sérieux dans la conception fait gagner beaucoup de temps sur le développement et réduit
le nombre de bugs. N’hésitez pas à demander des validations intermédiaires de vos diagrammes.)_

### Jalon 5 – Mai : Développement, Sécurité & Tests (version Bêta)

**Échéance :** Dernier jour ouvrable de mai 2026 (29/05/2026).
**Livrables :** À ce stade, on s’attend à un **premier aboutissement fonctionnel** de votre application,
accompagné de livrables techniques sur la sécurité et les tests. Concrètement, les éléments à remettre
sont :

```
Code source de l’application (version bêta) : Votre référentiel Git doit être à jour avec
l’implémentation de la majorité des fonctionnalités prévues. Fournissez dans votre rendu le lien
vers votre dépôt Git et indiquez le commit/tag de référence correspondant à la version livrée en
mai. Le code sera évalué (qualité, bonnes pratiques, structure). À ce stade, l’application devrait
être déployable et testable par le formateur :
Assurez-vous d’inclure dans le repo tous les fichiers nécessaires (code source Symfony/React,
Dockerfile, docker-compose, documentation d’installation si besoin).
Le docker-compose doit permettre de lancer l’application en local (ou à défaut, fournissez des
instructions claires pour lancer le backend, la base de données, et le front).
Toutes les fonctionnalités principales doivent être implémentées ou en passe de l’être. Il peut
rester quelques ajustements mineurs ou bugs connus, mais l’ensemble doit former une version
cohérente (une bêta proche du produit fini).
```
```
Intégration de l’API externe : Celle-ci doit idéalement être opérationnelle d’ici ce jalon. Par
exemple, si vous utilisez l’API Google Maps pour géolocaliser des bibliothèques, la fonctionnalité
correspondante doit être implémentée et testée.
```
```
Preuve de mise en place de la CI : Montrez que l’ intégration continue est en fonctionnement
sur votre projet. Vous pouvez par exemple inclure une capture d’écran d’une exécution de
pipeline (sur GitHub Actions ou autre) indiquant la réussite des tests. Ou bien un badge dans
votre README “build: passing”. L’essentiel est de prouver que chaque commit est vérifié
automatiquement. Rappel : une bonne pipeline CI compile le code et exécute les tests unitaires et
d’intégration à minima. Si vous avez ajouté des analyses statiques (linters, analyse de
sécurité) dans la CI, mentionnez-le également.
```
```
Rapport de tests automatisés * : Fournissez un document (ou intégrez au rapport principal) qui
décrit votre *politique de tests et en présente les résultats actuels. Ce volet correspond au
chapitre X. Politique de tests. Points à aborder :
```
```
Couverture de tests unitaires : Décrivez quelles parties du code sont couvertes par des tests
unitaires (et éventuellement quel pourcentage du code est couvert si vous avez la métrique via
un outil). Donnez un exemple de cas de test unitaire pertinent que vous avez écrit (par ex, tester
qu’une méthode de calcul renvoie le bon résultat dans telle condition).
Tests fonctionnels : Expliquez comment vous avez testé les cas d’usage de bout en bout. Par
exemple, “Nous avons écrit des tests Behat qui simulent un utilisateur empruntant un livre, du login à
la validation de l’emprunt” , ou “Des tests Postman/Newman vérifient que les endpoints de l’API
renvoient les réponses attendues”. Si c’est une SPA, mentionnez tout test UI (par ex. tests Jest/React
Testing Library, ou Selenium).
Autres tests : Indiquez si vous avez réalisé des tests d’intégration (ex: tester la connexion réelle
à la base de données, ou un appel réel à l’API externe pour voir la réaction du système).
```
#### • • • • • • 5 • • • •


```
Mentionnez aussi d’éventuels tests de performance simples : par ex, “nous avons mesuré le
temps de chargement de la page X avec 1000 entrées en base – résultat : < 2s, ce qui est acceptable”.
Ou “testé avec JMeter 50 requêtes concurrentes sur l’API – pas d’erreurs, temps moyen 500ms”. Ce ne
sont pas obligatoires, mais montrent une démarche qualité.
Outils utilisés : Listez les frameworks de tests que vous avez employés (PHPUnit, Behat,
PHPUnit + Panther, Jest, etc.) et comment ils s’exécutent (via CI ou local).
Résultats actuels : Donnez le statut à date : “Actuellement, 20 tests unitaires passent avec succès
(vert). 2 tests fonctionnels échouent encore concernant la création d’emprunt – ces bugs sont en cours
de correction.” L’honnêteté est importante : si tout n’est pas vert, expliquez le plan d’action d’ici la
fin.
```
```
Exemples de sorties : Vous pouvez inclure un extrait de log de tests ou une capture de rapport
de tests pour illustrer.
```
```
Analyse de sécurité & conformité : Ce volet correspond au chapitre IX. Sécurité. Détaillez les
mesures de sécurité que vous avez implémentées dans le code. Pour chaque point listé dans
les contraintes de sécurité plus haut, montrez comment il est adressé :
```
```
Injection SQL : Expliquez que vous utilisez Doctrine ORM ou des requêtes préparées PDO,
éliminant ainsi les risques d’injections SQL (les entrées utilisateur ne sont jamais insérées
directement dans des requêtes). Si vous avez fait des requêtes DQL/SQL manuelles, assurez-vous
d’avoir utilisé des paramètres.
XSS : Indiquez que toutes les sorties vers l’interface sont échappées via Twig (par défaut Twig
échappe les variables, sauf indication contraire). Mentionnez que vous avez testé en injectant
des <script> dans des formulaires pour vérifier qu’ils ne s’exécutent pas. Rappelez que les
attaques XSS font partie des vulnérabilités majeures à éviter.
CSRF : Notez que vous utilisez les tokens CSRF de Symfony sur les formulaires sensibles (ajout/
suppression de données, actions d’état). Si API REST sans interface server-side, mentionnez
l’utilisation d’un mécanisme de protection (jetons anti-CSRF ou au moins l’utilisation du header
Origin + vérification côté serveur, etc.). L’idée est de montrer que vous en êtes conscient.
Gestion des comptes : Les mots de passe sont stockés hachés (précisez l’algorithme, ex Bcrypt via
la fonction password_hash de PHP ou les outils Symfony). Ajoutez que vous avez éventuellement
mis en place une politique de complexité ou un système de réinitialisation de mot de passe
sécurisé (lien expirant par email, etc.) si c’est dans votre périmètre.
Brute force : Si votre appli a une auth, avez-vous implémenté une limitation des tentatives de
login? Par ex, via le composant Symfony Rate Limiter ou un simple compteur en session après X
échecs, ou Google reCAPTCHA. Si ce n’est pas fait, mentionnez-le comme amélioration possible
mais pas imposée.
Données personnelles & RGPD : Décrivez comment l’utilisateur peut contrôler ses données. Par
exemple : “Conformément au RGPD, l’utilisateur peut supprimer son compte et donc ses données
personnelles de la plateforme. Une politique de confidentialité est rédigée et disponible dans
l’application.” Si votre appli envoie des emails, assurez-vous de respecter opt-in/out. Mentionnez
que les données sensibles (ex: mot de passe) sont chiffrées/hachées , que les
communications sont prévues pour se faire en HTTPS en production (même si en dev c’est du
HTTP). Bref, montrez que le volet légal n’est pas oublié.
```
```
Autres sécurités : Selon votre projet, mentionnez par exemple la désactivation de l’indexation par
robots (fichier robots.txt) si pertinent, la mise en place de rôles et permissions (partie contrôle
d’accès de Symfony, pour qu’un utilisateur normal ne puisse pas accéder à l’admin, etc.), la
validation systématique des données en entrée ( contraintes de validation Symfony sur les
entités/formulaires, empêchant par exemple qu’un champ “numéro de téléphone” accepte autre
chose que des chiffres ). Vous pouvez citer l’utilisation de librairies ou bonnes pratiques pour
```
#### • • • • • •

```
15
```
-

#### •

#### •

#### •

```
16
```
```
11
```
-

```
17
```

```
sécuriser les en-têtes HTTP (CORS configuré correctement, Protection contre le clickjacking via le
header X-Frame-Options, etc., seulement si vous l’avez fait).
```
```
Bilan d’avancement : Enfin, faites un petit point sur l’état global du projet à la fin Mai. Quelles
fonctionnalités sont terminées, lesquelles restent à finaliser en juin? Êtes-vous en avance/retard
sur le planning initial? Ce bilan peut être inclus dans le rapport ou dans le commentaire de
rendu. L’objectif est de préparer le terrain pour le dernier mois et d’anticiper les derniers défis.
```
En résumé, le jalon 5 doit démontrer que votre application **fonctionne déjà dans sa quasi-totalité** ,
qu’elle est de qualité (tests OK, sécurité OK) et qu’elle se rapproche d’une version candidate à la mise en
production. On doit pouvoir lancer votre application et l’utiliser pour la plupart des cas d’usage prévus.
C’est en quelque sorte une **version bêta publique**. Le retour du formateur à ce stade vous permettra
de corriger les ultimes points en juin.

_(Note : Pensez à bien documenter le lancement de votre application dans un README ou dans le rapport – par
exemple, “comment lancer le docker-compose et sur quelle URL accéder à l’appli, comptes de test éventuels”.
Cela facilitera la validation. Aussi, si certains tests ou fonctionnalités ne sont pas encore finalisés, indiquez
clairement vos plans pour les achever en juin.)_

### Jalon 6 – Juin : Déploiement et Mise en Production (Livrable final)

**Échéance :** Dernier jour ouvrable de juin 2026 (30/06/2026).
**Livrables :** C’est le **livrable final** du projet fil rouge, comprenant : - Le **produit logiciel final** (code
complet, paquet déployable, conteneurs Docker finalisés). - La **documentation finale** consolidée. -
Éventuellement une **présentation** (slides) pour la soutenance – ceci sera précisé en temps voulu, mais
en général vous aurez à préparer un support pour le jury, toutefois ce n’est pas à remettre sur Teams,
c’est pour l’oral.

Ce jalon couvre principalement le chapitre **XI. Déploiement et mise en production** de votre rapport,
tout en réunissant et finalisant tous les chapitres précédents. Les attentes sont détaillées ci-dessous.

**Produit final prêt à déployer :**

```
Code source taggé “release” : Sur votre dépôt Git, créez un tag ou une release correspondant à
la version finale 1.0 de votre application. Cette version doit intégrer toutes les modifications
finales, corrections de bugs suite aux tests de la bêta, optimisations éventuelles. Indiquez le tag
dans le rendu. Le code sera gelé à cette version pour l’évaluation finale.
```
```
Conteneurs Docker prêts : Fournissez tous les éléments pour déployer facilement l’application :
```
```
Un fichier docker-compose.yml final (et éventuellement Dockerfiles) permettant de lancer
l’application complète en un coup. Par exemple, un service pour le backend Symfony (contenant
l’application PHP), un service pour la base de données initialisée avec un dump des données de
base (ou volumes), et un service pour le front si application séparée (ou on peut aussi servir le
front statique via un nginx container).
Instructions de déploiement : Dans votre documentation ou README, incluez une section
“Mise en production” détaillant comment passer de l’application telle qu’elle est sur Git à une
application déployée. Si vous avez mis en place du déploiement continu, expliquez le processus
(ex: “Une action GitHub permet de construire l’image Docker et la pousser sur DockerHub, puis sur le
serveur de prod un script pull la nouvelle image et redémarre les containers” ). Sinon, décrivez une
```
#### •

#### •

#### •

#### •

#### •


```
procédure manuelle claire : “Lancer docker-compose up -d sur le serveur avec les fichiers
fournis, configurer les variables d’environnement X, Y, importer le dump SQL fourni, etc.”. L’idée est
que le jury ou un développeur tiers pourrait déployer votre appli à partir de vos instructions sans
avoir à vous poser de questions.
Environnements de déploiement : Mentionnez les différents environnements possibles (dev,
test, prod) et comment vous gérez les différences. Par exemple : fichier .env de Symfony
adapté (APP_ENV=prod en prod, avec debug désactivé), usage de Docker pour simuler la prod en
local, etc. Si vous avez un environnement de démo en ligne, fournissez l’URL (c’est un plus mais
pas obligatoire). Certains étudiants par exemple hébergent leur projet sur un cloud gratuit
(Heroku, Netlify, AWS free tier...) – si vous l’avez fait, indiquez-le et décrivez l’architecture
déployée.
```
```
Stratégie de mise en production : Expliquez (théoriquement) quelle stratégie de déploiement
vous utiliseriez pour minimiser les interruptions de service lors d’une mise à jour du logiciel. Par
exemple : déploiement bleu/vert (blue/green) où une nouvelle version est déployée en parallèle
puis on bascule le routage , ou rolling update (mise à jour progressive conteneur par
conteneur), etc., ou tout simplement déploiement manuel pendant une fenêtre de
maintenance pour ce projet. Montrez que vous connaissez ces concepts, même si dans la
pratique de ce projet pédagogique, une interruption de service n’est pas vraiment un problème.
```
```
Documentation finale (PDF) : Compilez un rapport final complet, à remettre au format PDF,
qui servira de support à l’évaluation par le jury. Celui-ci reprendra l’ensemble des livrables
documentaires produits durant les jalons, mis à jour pour correspondre à l’état final du projet. Ce
document final devrait contenir, dans un format bien structuré (avec table des matières) :
```
```
III. Cahier des charges : votre CDCF initial éventuellement ajusté si le projet a évolué (par
exemple, si vous avez modifié certaines fonctionnalités en cours de route, mettez à jour la liste
pour qu’elle soit cohérente avec ce qui a été effectivement fait).
IV. Méthodologie et organisation : mise à jour du planning réel vs prévisionnel (indiquer ce qui
a changé, le cas échéant), retour d’expérience sur la méthode de projet, etc.
V. Conception UI/UX : inclure les maquettes finales si elles ont évolué, éventuellement des
captures d’écran de l’ interface réelle de votre application mise en œuvre pour montrer le
résultat par rapport aux maquettes.
VI. Modélisation de la BD : le MCD/MLD/MPD final (par ex, si vous avez ajusté le modèle de
données en cours de dev – cela arrive – présentez la version finale réelle).
VII. Conception de l’application (UML) : idem, mettre à jour les diagrammes de classes ou
séquence si votre implémentation finale diffère de ce qui avait été prévu (par ex, des classes en
plus ou en moins, etc.). Le diagramme de classes final doit refléter le code.
VIII. Architecture multi-couches : description de l’architecture finale (vous pouvez y inclure un
schéma d’architecture déployée illustrant votre Docker-compose par exemple, montrant les
conteneurs et leurs interactions).
IX. Sécurité : résumé des mesures de sécurité appliquées, éventuellement résultats de scans de
vulnérabilité si vous en avez fait, etc.
X. Tests : bilan sur les tests (taux de couverture final, résultats finaux – par ex. “100% des tests
passent, couverture 85% des classes métier”).
XI. Déploiement et mise en production : instructions de déploiement (peuvent être résumées
si déjà dans README, mais il faut en parler), et retour d’expérience DevOps (par ex: difficultés
rencontrées lors de la containerisation, etc.).
Annexes : incluez en annexe tout élément trop volumineux pour le corps du doc (ex : code
source de tests clés, extrait du fichier de pipeline CI, etc., captures d’écran de la CI, etc. déjà
fournis séparément mais ici pour trace).
```
#### •

#### •

```
18
```
#### • • • • • • • • • • •


```
Guide utilisateur (si applicable) : il peut être bienvenu d’ajouter une petite section pour
l’utilisateur final (hors jury) expliquant comment utiliser l’application (par ex, “Pour tester
l’application : connectez-vous avec tel compte... voici le parcours pour emprunter un livre... etc.” ). Le
jury jouera le rôle d’un utilisateur durant la démo, donc ce guide peut être utile.
```
```
Conclusion et perspectives : Terminez votre document avec un bilan global : ce que vous avez
appris, les défis surmontés, et quelles améliorations pourraient être apportées si le projet
continuait (ex: nouvelles fonctionnalités envisageables, optimisation possibles, etc.). Cela montre
votre capacité d’analyse critique sur le travail réalisé.
```
```
Soutenance orale (préparation) : Même si cela sort du cadre du document, prévoyez de
préparer une présentation orale (~15 minutes) pour la fin juin/début juillet devant le jury. Celle-ci
consistera généralement à démontrer l’application en live (ou via une vidéo si démonstration
trop risquée) et à présenter les points forts du projet (originalité, difficultés techniques
surmontées, résultats obtenus). Vous pourrez vous appuyer sur le rapport écrit, mais il est
conseillé de faire des slides synthétiques. Entraînez-vous à expliquer votre architecture, vos choix
techniques, etc., de manière pédagogique. Le jury pourrait poser des questions pointues (ex:
“Comment avez-vous implémenté la sécurité contre XSS ?”) – vous serez prêts grâce à tout le
travail documenté précédemment.
```
Au terme du jalon 6, **votre projet doit être 100% fonctionnel et complet**. Cela signifie : **toutes les
fonctionnalités** annoncées dans le cahier des charges fonctionnel sont implémentées et testées,
**toutes les exigences techniques** sont respectées (Docker, tests, CI, sécurité, API externe...), la
documentation est à jour et exhaustive, et l’application peut être déployée/exécutée sans encombre.
C’est cette version finale qui sera évaluée par le jury national.

Félicitations, si vous parvenez à tout mener à bien, vous aurez acquis une expérience précieuse de
conduite de projet de A à Z!

## Modalités de remise des livrables

Chaque jalon donnera lieu à un rendu à déposer sur **Microsoft Teams** , section **Devoirs** de votre
promotion. Respectez bien les dates limites (dernier jour ouvré de chaque mois). Les formats attendus
sont généralement : - **Documents** : en PDF de préférence (pour les rapports, présentations, etc.). Veillez
à une présentation professionnelle (page de titre, sommaire, numérotation...). - **Code source** : pas de
dépôt de code en archive sur Teams sauf indication contraire ; fournissez **l’URL de votre dépôt Git** dans
un document texte ou dans le champ commentaires du devoir. Assurez-vous que le formateur ait accès
(repo public, ou privé avec accès donné). - **Schémas, maquettes** : intégrez-les dans les PDFs ou
fournissez-les en images attachées si nécessaire, en veillant à la qualité. Les maquettes interactives
peuvent être partagées via un lien (Figma etc.). - **Docker images** : si vous avez publié des images
Docker (sur DockerHub par ex), vous pouvez l’indiquer mais ce n’est pas obligatoire de le remettre à
part. - **Autres** : tout élément non-textuel important (par ex, une vidéo de démonstration si vous en
faites une) peut être remis en annexe également.

Chaque rendu fera l’objet d’une évaluation et de feedback de la part de l’équipe pédagogique, afin que
vous puissiez vous améliorer pour le jalon suivant. En cas de difficulté majeure vous empêchant de
remettre un jalon dans les temps, prévenez **en amont** – un léger aménagement pourra être envisagé
au cas par cas, mais n’en abusez pas (les délais du projet final sont serrés).

Enfin, n’oubliez pas que **l’originalité** de votre travail est importante : vous avez tous un socle technique
commun, mais le sujet fonctionnel, l’approche, la créativité dans l’UX, etc., sont libres. Deux projets ne

#### •

#### •

#### •


doivent pas être identiques. Inspirez-vous éventuellement de ressources ou de projets existants, mais
**pas de plagiat** – le code écrit doit être le vôtre, et vous devez être capable de l’expliquer.

**Bon courage à tous!** Ce projet fil rouge est exigeant, mais c’est une occasion unique de synthétiser
tout votre apprentissage. En suivant ce cahier des charges technique et en respectant les jalons, vous
mettrez toutes les chances de votre côté pour délivrer un projet abouti et réussir votre passage devant
le jury. Nous sommes impatients de découvrir vos réalisations.

Cahier des charges technique : modèle & conseils
https://axonesconsulting.fr/cahier-des-charges-technique/

Cahier de charges fonctionnel : guide complet - Softyflow
https://www.softyflow.io/cahier-de-charges-fonctionnel/

Stratégies de Déploiement pour Symfony avec Docker - W3r.one Magazine
https://w3r.one/fr/blog/web/symfony/deploiement-integration-continue-symfony/strategies-deploiement-symfony-docker

L'approche CI/CD, qu'est-ce que c'est ?
https://www.redhat.com/fr/topics/devops/what-is-ci-cd

What is OWASP? Intro to OWASP Top 10 Vulnerabilities and Risks | F
https://www.f5.com/glossary/owasp

Cross site request forgery (CSRF) attack - Imperva
https://www.imperva.com/learn/application-security/csrf-cross-site-request-forgery/

Cross Site Request Forgery | Kontra Application Security Training
https://application.security/free-application-security-training/owasp-top-10-cross-site-request-forgery

```
CORS, XSS and CSRF with examples in 10 minutes - DEV Community
```
```
1 11 12 13 14
```
```
2
```
```
3 4
```
```
5 6 18
```
```
7 8 16
```
```
9
```
```
10
```
15
https://dev.to/maleta/cors-xss-and-csrf-with-examples-in-10-minutes-35k


