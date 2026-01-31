---
sidebar_position: 0
title: Introduction
slug: /
---

# Introduction to OSUI

OSUI is a powerful and flexible Rust library for building advanced Terminal User Interfaces (TUIs). It provides a component-based architecture inspired by modern web frameworks, offering a familiar and ergonomic development experience for crafting interactive command-line applications.

## What is OSUI?

OSUI stands for "Operating System User Interface" in the terminal context. It aims to bridge the gap between simple text-based applications and rich graphical user interfaces by offering a robust framework for complex TUI development.

### Key Features

*   **Component System**: Build UIs using reusable, composable components that manage their own state and lifecycle.
*   **Reactive State Management**: Leverage React-like hooks (`useState`, `useEffect`) for efficient and predictable state handling.
*   **Declarative UI with RSX**: Define your UI structure using an intuitive, macro-based RSX (React-like Syntax) similar to JSX.
*   **Event Handling**: A type-safe event system allows components to communicate and respond to user input and internal changes.
*   **Pluggable Rendering Engine**: Ships with a `Console` engine for `crossterm`-based terminal rendering, and an extensible `Engine` trait for custom backends.
*   **Benchmark Tooling**: Built-in benchmarking capabilities to measure and optimize rendering performance.

## Why OSUI?

Traditional TUI libraries often require imperative manipulation of the terminal buffer, which can become cumbersome for complex applications. OSUI addresses this by:

*   **Promoting Modularity**: Components encapsulate UI logic and appearance, making code easier to organize, test, and maintain.
*   **Simplifying State Logic**: The hook-based state management system ensures that your UI automatically reacts to data changes, reducing boilerplate and potential bugs.
*   **Enhancing Developer Experience**: The `rsx!` macro and `#[component]` attribute provide a declarative way to define your UI, allowing you to focus on *what* your UI should look like, rather than *how* to draw it.
*   **Encouraging Scalability**: The clear separation of concerns (components, state, rendering engine) makes OSUI suitable for applications ranging from simple utilities to complex interactive dashboards.

Whether you're building a CLI dashboard, an interactive configuration tool, or a text-based game, OSUI provides the tools to create engaging and performant terminal experiences.
