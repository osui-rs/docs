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
![Dot](https://github.com/user-attachments/assets/d046d537-2feb-4f61-9d44-58e2e3bd9ded)
![Scatter](https://github.com/user-attachments/assets/148b4b29-70f5-42a2-8fa5-19198bbf8e11)

## Scoping
Scoping allows for the separation of dynamic and static DOM, for a more flexible UI, this makes `for` loops and `if` statements work perfectly without any bugs.

![Scoping](https://github.com/user-attachments/assets/fe705306-260f-4443-b31f-17ecb9401ef8)

## What's missing
I've only worked on this version for about 2-3 weeks, so it's not fully featured, here are the features that will be added on future versions:

- Positioning and sizing API, Position::Center, etc.
- Styling API, fg: #fff, etc.
- RSX string dependencies (or ref cloning) (`%state "{state}"`).