# vanhieu-dashboard

Scaffold for a realtime dashboard to show telesales results (from CRM) and Google Ads linkage.

This repository contains two folders:

- backend: Node.js + Express + Socket.IO webhook stub
- frontend: simple static page connecting via Socket.IO to display incoming CRM events

Local dev (quick):

1. Backend
   - cd backend
   - npm install
   - npm start
   - POST JSON to http://localhost:3000/webhook/crm to simulate CRM webhook

2. Frontend
   - cd frontend
   - npm install
   - npm start
   - open http://localhost:8080 (default) to view events

Next steps:
- Create a feature branch `feature/dashboard-skeleton` with the full scaffold (backend + frontend).
## Claude Code skills

- `.claude/skills/humanizer`: [Humanizer](https://github.com/blader/humanizer) skill (MIT). Rewrites AI-sounding text so it reads naturally. Use `/humanizer` in Claude Code sessions on this repo.

## Đăng sản phẩm tự động (Haravan)

- `product-poster/`: nhập tên + giá, AI viết bài sản phẩm chuẩn SEO và lưu nháp lên Haravan. Xem `product-poster/README.md`.
