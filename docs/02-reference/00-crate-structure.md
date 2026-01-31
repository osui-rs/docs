---
sidebar_position: 0
title: Crate Structure
---

# OSUI Crate Structure

The `osui` library is organized into several modules, each responsible for a distinct aspect of TUI development. Understanding this structure helps in navigating the codebase and locating relevant functionalities.

## Top-Level Modules

The `osui` crate is composed of the following main modules:

*   **`component`**: Defines the core component system, including `Context` (for component state and lifecycle), `Scope` (for child management), and the `ComponentImpl` trait.
*   **`engine`**: Provides the rendering engine trait (`Engine`), command execution system (`CommandExecutor`), and concrete engine implementations like `Console` (for `crossterm`) and `Benchmark`.
*   **`frontend`**: Implements the RSX (React-like Syntax) system, including the `Rsx` struct and `ToRsx` trait, which bridges the `rsx!` macro output to the rendering pipeline.
*   **`render`**: Contains low-level rendering primitives such as `DrawContext`, `DrawInstruction`, `Point`, `Area`, and `Size`. This module defines *what* gets drawn.
*   **`state`**: Offers React-like hooks for managing component state (`use_state`), side effects (`use_effect`), and component lifecycle (`use_mount`, `use_mount_manual`).

## `prelude` Module

The `osui::prelude` module re-exports the most commonly used items from all sub-modules. It's recommended to `use osui::prelude::*;` in your application to easily access essential types and macros without verbose imports.

```rust
pub mod prelude {
    pub use crate::component::{context::*, scope::*, *};
    pub use crate::engine::*;
    pub use crate::frontend::*;
    pub use crate::render::*;
    pub use crate::state::*;
    pub use crate::{sleep, Error, Result, View, ViewWrapper};
    pub use crossterm;
    pub use osui_macros::{component, rsx};
    pub use std::sync::{Arc, Mutex};
}
```

## OSUI Core Types

Beyond the modules, `lib.rs` also defines some fundamental type aliases and error handling:

*   **`View`**: `Arc<dyn Fn(&mut DrawContext) + Send + Sync>`. Represents a renderable unit, essentially a closure that takes a `DrawContext` and adds drawing instructions.
*   **`ViewWrapper`**: `Arc<dyn Fn(&mut DrawContext, View) + Send + Sync>`. A higher-order view that can wrap and modify how another `View` is rendered (e.g., for applying layout or styling).
*   **`Result<T>`**: `std::result::Result<T, Error>`. The standard result type for OSUI operations.
*   **`Error`**: An enum defining OSUI-specific errors, currently including `PoisonError` for mutex poisoning.
*   **`sleep(delay_ms: u64)`**: A utility function for pausing execution for a specified duration.

This structured approach helps keep the library organized and maintainable, allowing developers to quickly understand where to find the tools they need.

**Next:** Dive into the details of the [Component API](./component-api.md).
