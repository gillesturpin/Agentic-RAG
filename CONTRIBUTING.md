# Guide de Contribution - Agentic RAG

## Workflow de collaboration

### 1. Cloner le repository

```bash
git clone https://github.com/gillesturpin/Agentic-RAG.git
cd Agentic-RAG
```

### 2. Créer une branche pour vos modifications

**IMPORTANT : Ne jamais travailler directement sur `main` !**

```bash
# Créer une nouvelle branche
git checkout -b feature/nom-de-votre-feature

# Exemples de noms de branches :
# - feature/improve-rag-prompt
# - fix/upload-timeout
# - docs/update-readme
```

### 3. Faire vos modifications

```bash
# Vérifier les fichiers modifiés
git status

# Ajouter vos modifications
git add .

# Créer un commit avec un message clair
git commit -m "Description claire de vos changements"
```

### 4. Pousser votre branche sur GitHub

```bash
git push origin feature/nom-de-votre-feature
```

### 5. Créer une Pull Request (PR)

1. Allez sur : https://github.com/gillesturpin/Agentic-RAG
2. GitHub vous proposera automatiquement de créer une Pull Request
3. Cliquez sur "Compare & pull request"
4. Remplissez :
   - **Titre** : Description courte de votre changement
   - **Description** : Expliquez ce que vous avez modifié et pourquoi
5. Cliquez sur "Create Pull Request"

### 6. Attendre la review

- Gilles (ou un autre mainteneur) va review votre code
- Il peut demander des modifications
- Une fois approuvé, votre code sera mergé dans `main`

## Règles importantes

1. **Ne jamais push directement sur `main`**
2. **Toujours créer une branche pour chaque feature/fix**
3. **Faire des commits avec des messages clairs**
4. **Tester votre code avant de faire une PR**

## Synchroniser votre fork avec main

Si `main` a été mis à jour pendant que vous travaillez :

```bash
# Se mettre sur main
git checkout main

# Récupérer les derniers changements
git pull origin main

# Retourner sur votre branche
git checkout feature/nom-de-votre-feature

# Rebaser votre branche sur main
git rebase main
```

## Besoin d'aide ?

Contactez Gilles ou posez vos questions dans les Pull Requests !
