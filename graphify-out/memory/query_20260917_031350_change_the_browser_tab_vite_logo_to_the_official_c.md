---
type: "query"
date: "2026-09-17T03:13:50.454461+00:00"
question: "Change the browser tab Vite logo to the official CPSU logo"
contributor: "graphify"
outcome: "useful"
source_nodes: ["Application favicon", "Central Philippines State University Seal", "CPSU Information Hub HTML Application Shell"]
---

# Q: Change the browser tab Vite logo to the official CPSU logo

## Answer

Expanded from original query via graph vocab: [favicon, logo, cpsu, html]. Updated index.html so rel=icon uses the existing official src/assets/CPSU_Logo-transparent.png as image/png and added the same asset as apple-touch-icon. The production build passed and Vite rewrote both declarations to the hashed CPSU logo asset.

## Outcome

- Signal: useful

## Source Nodes

- Application favicon
- Central Philippines State University Seal
- CPSU Information Hub HTML Application Shell