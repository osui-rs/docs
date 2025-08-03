---
title: OSUI v0.0.9 alpha, what's new and should you update
description: OSUI v0.0.9 is just on the edge of development, alpha is just the beginning.
slug: osui-0.0.9-alpha
authors:
  - kleo-dev
---

Greetings to everyone, i haven't been working on OSUI for the past 6 months, i have been busy with other projects and haven't found myself motivated enough for OSUI, now i'm ready to go back to OSUI and make major changes.

<!-- truncate -->

## ⚡️ Changes

- ⚙️ Rewrite the entire codebase
- ⚙️ OSUI engine is now OSUI itself, frontend parts like `rsx!` and `css` will be included in future versions with more advanced features.
- 📌 Modularity and reliability improvements, due to the new design we now have a dramatic increase in reliability and modularity

## ⚛️ OSUI Components and extensions

OSUI Components and Extensions are a important design choice for OSUI, They store specific data to a element that a Extension can use for a specific purpose.

### Extensions

A OSUI extension extends the functionality of the current elements and program, a good example is in our [Hello World App With Velocity](/docs/0.0.9/#hello-world-app-with-velocity) example, where we use the built in `VelocityExtension` as well as the `Velocity(x, y)` component, by design it is required for a extension to have the components be optional for the elements, unless there is a very specific reason not to make it optional.

### Components

A OSUI component is simply data that a extension or the default OSUI runtime may find useful, A good example is `Transform` which like the name suggests, it transforms the element into it's parameters

## Conclusion

While we have exciting changes on the way, we are far from done and we need support from everyone reading this, thank you for reading it, if you'd like to support us and our projects please star our GitHub repository and follow our github Org for the latest updates.
