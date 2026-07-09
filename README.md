# Expense & Budget Visualizer

A mobile-friendly expense tracker built with vanilla HTML, CSS, and JavaScript.
Data is stored entirely in the browser's `localStorage` — no backend needed.

## Features
- Add transactions (name, amount, category) with validation
- Delete transactions from a scrollable list
- Auto-updating total balance
- Pie chart of spending by category (Chart.js)
- **Custom categories** — add your own beyond Food / Transport / Fun
- **Sort transactions** — by newest, amount, or category
- **Over-limit highlighting** — flag any transaction above a set amount

## Run it locally
Just open `index.html` in a browser — no build step or server required.

## Deploy
1. Push this folder to a GitHub repository.
2. Enable **GitHub Pages** in the repo settings (deploy from the `main` branch, root folder).
3. Your site will be live at `https://<username>.github.io/<repo-name>/`.

## Folder structure
```
index.html
css/
  style.css
js/
  script.js
.kiro/
  (Kiro spec/session files — generated when you build this with Kiro)
```

## Notes
- Built to satisfy the "Only 1 CSS file / Only 1 JS file" constraint.
- No frameworks — pure HTML/CSS/JS as required by TC-1.