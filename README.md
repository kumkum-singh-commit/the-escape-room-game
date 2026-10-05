# NovaTech Escape Room: Cyber Security Awareness Game

A story-driven web game where employees first play the social engineer (Act 1),
then defend against the same attacks (Act 2). Fully simulated; no real data is collected.

## Features
- 12 rooms, with pre/post knowledge quiz measuring learning gain
- Timed inbox triage, hint system, scoring and ranks
- Levels stored in JSON, so new scenarios need no code changes
- Express backend + admin dashboard (average scores, most-missed red flags)

## Tech stack
HTML, CSS, JavaScript, Node.js, Express

## Run locally
npm install
node server.js
Open http://localhost:3000 (admin: /admin.html)

## Framework mapping
| Room | Topic | Reference |
|---|---|---|
| Recon | OSINT | MITRE ATT&CK T1589, T1591 |
| Phishing Builder | Phishing | T1566 |
| Phone Pretext | Impersonation | T1598, T1656 |
| Inbox Triage | Phishing detection | T1566 |
| Vishing | Voice phishing | T1566.004 |
| USB Drop | Baiting | T1091 |
| Tailgating | Physical security | NIST SP 800-53 PE-3 |
| MFA Fatigue | MFA bombing | T1621 |

## Security measures
Input validation, payload size limit, rate limiting, security headers,
anonymous results only, static file access restricted.

## Results
(Add your numbers, e.g. "5 testers: average quiz score improved from 2.4/5 to 4.2/5")

## Future work
Multiplayer mode, more scenarios, authentication for the admin page.