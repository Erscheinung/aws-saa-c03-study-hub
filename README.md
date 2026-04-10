# 🚀 AWS SAA-C03 Study Hub

> **ADHD-Optimized, Visual Learning Platform for AWS Solutions Architect Associate Exam**

![Exam](https://img.shields.io/badge/Exam-SAA--C03-orange)
![Pass Score](https://img.shields.io/badge/Pass%20Score-720%2F1000-blue)
![Questions](https://img.shields.io/badge/Questions-65-green)
![Time](https://img.shields.io/badge/Time-130%20min-red)

---

## 📊 Exam Domain Breakdown

| Domain | Weight | Focus |
|--------|--------|-------|
| 🔐 **Security** | 30% | IAM, KMS, WAF, Shield, Secrets Manager |
| 🏗️ **Resilient Architectures** | 26% | Multi-AZ, Auto Scaling, ELB, DR |
| ⚡ **High-Performance** | 24% | ElastiCache, CloudFront, EBS IOPS |
| 💰 **Cost-Optimized** | 20% | Spot, Reserved, S3 classes |

---

## 🧠 Study Tools

### 🗺️ Kurzgesagt-Style Orbital Mind Map
- 50+ AWS services arranged as planets on category orbits around a central AWS hub
- Single-row category filter (Compute, Storage, Networking, Security, …)
- Starfield background + slow orbital animation
- Click a service to slide in a detail panel

### ✏️ Fill-in-the-Blank
- 30+ active recall questions with instant feedback
- Category filters + streak tracking

### 🔗 Connection Game
- Match Pairs: Service ↔ Limit
- Find the Link: what connects services?
- Category Sort: classify by domain

### 🎯 Deduction Trainer
- Real exam-style scenarios with 4 elimination strategies (impossible specs,
  keyword matching, service fit, complexity check), step-by-step explanations

### 🎮 Cloud Walker 2D
- Retro pixel side-scroller where you jump between AWS “clouds” and collect
  fact tokens

### 🏯 Cloud Walker 3D — Memory Palace (beta)
- First-person, pointer-locked walkthrough of a chunky low-poly pixel world
- Each AWS service is a literal building: S3 warehouse with crates, Glacier
  ice cave, EC2 server rack room, Lambda floating orbs, RDS sunken vault,
  Aurora ribbon dome, CloudFront edge beams, VPC walled city, IAM guarded
  gate, Route 53 signpost
- Scene is rendered through a low-resolution render target for a PS1/N64
  pixel aesthetic
- WASD/arrows + mouse-look, space to jump, click/E to read a service,
  compass pointing to the nearest unvisited structure, progress persists

### 🧩 Service Sorter & 🎰 Jeopardy
- Drag-and-drop category sorter and a Jeopardy board for rapid review

---

## ⏱️ ADHD Optimization Features

- **15-min Pomodoro** option (short bursts!)
- **Visual learning** throughout
- **Immediate feedback** on every answer
- **Gamification** with streaks & progress
- **Chunked content** by category
- **Variety** to prevent boredom

---

## 🔢 Critical Limits to Memorize

```
Service             Limit
─────────────────────────────────────
Lambda              15 min timeout, 10 GB memory
API Gateway         29 sec timeout, 10 MB payload
S3                  5 TB object max
SQS                 256 KB message, 14 days retention
DynamoDB            400 KB item
Aurora              15 replicas, 128 TB storage
RDS                 5 replicas
EBS                 64 TB volume, io2: 64K IOPS
KMS                 4 KB direct encryption
VPC CIDR            /16 to /28
```

---

## 🏃 Quick Start

### React app (primary)
```bash
cd react-app
npm install
npm run dev       # http://localhost:5173/aws-saa-c03-study-hub
npm run build     # production build → dist/
npm run deploy    # publish to GitHub Pages
```

### Legacy static site
```bash
python3 -m http.server 8000
# Open http://localhost:8000
```

---

## 📁 File Structure

```
aws-saa-c03-study-hub/
├── index.html              # Legacy static hub
├── maps/                   # Legacy mind map
├── exercises/              # Legacy exercises
└── react-app/              # Primary React + Vite app
    ├── src/
    │   ├── App.jsx         # Router
    │   ├── pages/          # Home, MindMap, CloudWalker, CloudWalker3D, …
    │   ├── components/     # Layout, navbar, AwsLogo, PageTransition
    │   ├── data/           # services.json, cloudWalker3DScene.js, etc.
    │   └── three/          # pixelTexture + per-kind builders for 3D scene
    └── package.json
```

---

## 🎯 Exam Strategy Tips

1. **⏱️ Pace yourself**: ~2 min/question
2. **🚫 Eliminate impossible specs**: Wrong limits = wrong answer
3. **🔑 Keywords matter**: "Cost-effective" → Spot/Reserved
4. **🎯 "Least operational effort"** → AWS Managed Services
5. **⚠️ Flag & move**: Stuck >60s? Come back later
6. **📖 Read ALL options**: First "correct" answer may not be best

---

## 💪 You've Got This!

```
┌─────────────────────────────────────────────┐
│  🏆 EXAM DAY CHECKLIST                      │
├─────────────────────────────────────────────┤
│  □ Get 8 hours sleep                        │
│  □ Eat a good breakfast                     │
│  □ Arrive 15 min early                      │
│  □ Bring 2 forms of ID                      │
│  □ Deep breaths before starting             │
│  □ Trust your preparation                   │
│  □ Flag difficult questions, don't dwell    │
│  □ Review flagged questions with fresh eyes │
└─────────────────────────────────────────────┘
```

**Remember**: You're not just memorizing — you're building intuition for how AWS services fit together. That's what makes a real Solutions Architect! 🌟

---

## 📚 Resources

- [AWS Exam Guide](https://aws.amazon.com/certification/certified-solutions-architect-associate/)
- [Stephane Maarek's Course](https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

---

*Built with 💙 for visual learners. No dependencies. Just HTML/CSS/JS.*
