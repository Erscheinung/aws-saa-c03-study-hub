# Future Game Ideas & Claude Prompts

## 1. AWS Architect Simulator
**Concept**: A drag-and-drop architecture builder where you receive client requirements and must build the correct AWS architecture by selecting and connecting services on a canvas.

**Claude Prompt**:
> Build a React component "ArchitectSimulator" - a drag-and-drop game where players receive scenario cards (e.g., "Build a highly available web app with <1ms database reads") and must drag AWS service blocks onto a canvas, connecting them with arrows to form a valid architecture. Score based on correctness, cost efficiency, and meeting requirements. Include 15+ scenarios ranging from simple (static website hosting) to complex (multi-region active-active with DR). Use HTML5 drag-and-drop API. Services are blocks with icons. Connections are drawn as SVG arrows. Validate architectures against a rules engine (e.g., "web tier needs load balancer", "database needs multi-AZ for HA requirement"). Show a green checkmark or red X with explanation after submission.

---

## 2. AWS Cost Calculator Challenge
**Concept**: Time-attack game where you estimate monthly costs for given architectures. Closer to the real cost = more points.

**Claude Prompt**:
> Create a React game "CostChallenger" where players see an AWS architecture diagram (rendered as a simple block diagram) and must estimate the monthly cost. Show the architecture with specific specs (e.g., "2x m5.large EC2 running 24/7 in us-east-1 + 500GB gp3 EBS + 1TB S3 Standard + CloudFront 10TB transfer"). Player enters their estimate. Score based on how close they are to the actual cost (calculate from AWS pricing). Include 20 scenarios with increasing complexity. Timer adds pressure. Leaderboard with localStorage. Each round reveals the actual cost breakdown after guessing.

---

## 3. Incident Response RPG
**Concept**: A text-based RPG where you're an on-call AWS engineer. Incidents happen and you must choose the right debugging steps and fixes.

**Claude Prompt**:
> Build a React text-adventure RPG "CloudOps Hero". The player is an AWS engineer on-call. Scenarios unfold as text with choices: "Your ALB is returning 503 errors. What do you check first? A) CloudWatch metrics B) Target group health C) Security groups D) DNS records". Each choice leads to different outcomes and more choices. Build a branching story engine with 10+ incident scenarios (DDoS attack, database failover, Lambda throttling, S3 bucket policy lockout, VPC connectivity issues). Track player "reputation" score. Use pixel-art character portraits. Include a terminal-style UI with green-on-black text for the "investigation" phases. Save progress to localStorage.

---

## 4. AWS Service Timeline
**Concept**: A speed quiz where services flash on screen and you must place them in the correct category as fast as possible - like a conveyor belt sorting game.

**Claude Prompt**:
> Create a React game "ServiceSorter" - a conveyor belt style sorting game. AWS services appear on a moving belt (scrolling left to right) as cards with the service name. Below are 5 category bins (Compute, Storage, Database, Network, Security). Player must drag/click each service into the correct bin before it falls off the edge. Speed increases every 10 services. Lives system (3 misses = game over). Combo multiplier for consecutive correct sorts. Power-ups: "Slow Time" (slows belt), "Auto-Sort" (sorts next 3 automatically). Include 60+ services. Pixel-art factory theme. High score leaderboard.

---

## 5. Encryption Key Quest
**Concept**: A puzzle game focused on AWS encryption and security concepts. Navigate through rooms by correctly applying encryption, key management, and access policies.

**Claude Prompt**:
> Build a React puzzle game "KeyQuest". The player navigates through 10 themed rooms in an AWS data center. Each room has a locked door requiring correct security knowledge to pass. Room examples: 1) "Choose the right encryption" (SSE-S3 vs SSE-KMS vs SSE-C for the given scenario), 2) "Write the IAM policy" (drag policy elements to grant least-privilege access), 3) "Configure the VPC" (set up security groups and NACLs to allow specific traffic), 4) "Key rotation chamber" (arrange KMS key rotation steps correctly). Pixel-art dungeon aesthetic. Each correct answer opens the door with an animation. Timer per room. Collectible "security badges" for perfect scores.

---

## 6. AWS Jeopardy
**Concept**: Classic Jeopardy-style quiz game with AWS categories and point values.

**Claude Prompt**:
> Create a React "AWSJeopardy" game with a classic Jeopardy board. 6 categories (Compute, Storage, Database, Networking, Security, Serverless) x 5 point values (100-500). Each cell reveals a Jeopardy-style answer and the player must identify the service/concept. Example: Category "Storage", 300 points: "This storage class offers the lowest cost but has a 12-hour retrieval time" → "What is S3 Glacier Deep Archive?". Daily Double mechanic on random cells. Score tracking. Final Jeopardy round with a wager system. Include 30 unique clues. Blue Jeopardy board aesthetic with golden text. Sound effects for correct/wrong answers (Web Audio API beeps).

---

## 7. Multi-Region Defender (Tower Defense)
**Concept**: A tower defense game where you place AWS services to defend against "bad traffic" (DDoS, unauthorized access, data breaches).

**Claude Prompt**:
> Build a React tower defense game "RegionDefender". Enemies (red packets representing DDoS traffic, SQL injection attempts, unauthorized API calls) travel along a path toward your application. Place AWS security services as towers: WAF (blocks injection, medium range), Shield (blocks DDoS, wide range), GuardDuty (detects threats, reveals hidden enemies), CloudFront (slows enemies at edge), NACLs (blocks at VPC boundary), Security Groups (last line of defense). Each tower has upgrade levels. Waves increase in difficulty. Currency is "security credits" earned from blocked threats. 15 waves. Pixel-art top-down view. Grid-based placement. Path goes through Edge → CloudFront → VPC → Subnet → App. Boss waves: "Advanced Persistent Threat" (requires multiple tower types).

---

## 8. Flashcard Duel
**Concept**: Competitive (vs AI) flashcard game where speed and accuracy matter. Like a card game battle.

**Claude Prompt**:
> Create a React card battle game "FlashDuel". Player vs AI opponent. Both receive the same AWS question. First to answer correctly "attacks" the opponent. Wrong answer = take damage. Health bars for both players. 20 rounds. AI has variable difficulty (sometimes answers fast, sometimes slow, sometimes wrong). Cards have categories with type advantages (answering a Security question after a Network question gives bonus damage). Visual: card game aesthetics with health bars, attack animations (screen shake, flash effects). Questions cover all SAA-C03 domains. Power-up cards: "Skip" (avoid a hard question), "Double Damage" (next correct answer does 2x), "Heal" (recover health). Victory/defeat screens with stats.

---

## 9. AWS Service Network Graph Explorer
**Concept**: An interactive force-directed graph showing how AWS services connect and depend on each other. Click to explore relationships.

**Claude Prompt**:
> Build a React interactive network graph "ServiceGraph". Use canvas to render a force-directed graph where nodes are AWS services and edges show relationships (e.g., "EC2 uses EBS for storage", "Lambda triggered by SQS", "CloudFront serves S3 content"). Nodes are draggable and the graph rebalances with physics simulation. Click a node to highlight all its connections. Filter by relationship type (uses, triggers, secures, monitors). Search to find and focus on a service. Color nodes by category. Edge labels show relationship type. Include 40+ services and 80+ relationships. Zoom and pan controls. Export graph as image.

---

## 10. Well-Architected Review Game
**Concept**: Review AWS architectures against the 6 pillars of the Well-Architected Framework. Find the violations!

**Claude Prompt**:
> Create a React game "WellArchitected". Show architecture diagrams (rendered as block diagrams with service icons and connections) that intentionally violate AWS Well-Architected pillars. Player must identify ALL violations. 6 pillars: Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, Sustainability. Example architecture: "Single AZ RDS with no backups, public S3 bucket, no CloudWatch alarms, oversized EC2 instances" → violations: Reliability (single AZ), Security (public bucket), Operational Excellence (no monitoring), Cost Optimization (oversized instances). 10 architectures with increasing complexity. Checklist UI for each pillar. Score based on violations found vs total. Detailed explanations after each round.
