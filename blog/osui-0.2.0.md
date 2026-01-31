---
title: OSUI v0.2.0 is here!
description: New codebase, new strucutre, new everything.
date: 2026-01-31 18:52
slug: osui-0.2.0
authors:
  - kleo-dev
---

Wow, 2 years into this project, i was 14 years old when i started this project, aside from my first [Rust project](https://github.com/wyst-lang/wyst/tree/legacy) This was my second project and my most important for learning how rust actually works.
<!-- truncate -->
I'll be honest, i wasn't the best developer back then, but i've learned so much, and i'm excited for a new era, i want to get back into this project to thank it for placing me where i'm at.

Enough said though, let's get into the changes.

## Rewrite
This rewrite has been one of the best yet, while not fully frontend featured, the engine and structure matters a lot, this is a much more resilient architecture than any other OSUI structure.

## Performance
The performance is much better and it's more predictable, however i do not have a clue on why the spikes appear on those specific iterations.

## Scoping
Scoping allows for the separation of dynamic and static DOM, for a more flexible UI, this makes `for` loops and `if` statements work perfectly without any bugs.

![Scoping](https://private-user-images.githubusercontent.com/103524696/540255465-fe705306-260f-4443-b31f-17ecb9401ef8.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Njk4OTMxOTMsIm5iZiI6MTc2OTg5Mjg5MywicGF0aCI6Ii8xMDM1MjQ2OTYvNTQwMjU1NDY1LWZlNzA1MzA2LTI2MGYtNDQ0My1iMzFmLTE3ZWNiOTQwMWVmOC5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjYwMTMxJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI2MDEzMVQyMDU0NTNaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1jM2FjY2ZmMjQzMmRhZGVhZjFjZmMxMjg2YzFlZTFkNzdhNGM4OTA2MWU2MWM3ZjliNDY1YzE3ZGFjMmRiMTQ1JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.zuJ_ZkgzhP0Ww2Z3-zu12fQPQVRxl_kr5VQwHbDD5sQ)

## What's missing
I've only worked on this version for about 2-3 weeks, so it's not fully featured, here are the features that will be added on future versions:

- Positioning and sizing API, Position::Center, etc.
- Styling API, fg: #fff, etc.
- RSX string dependencies (or ref cloning) (`%state "{state}"`).