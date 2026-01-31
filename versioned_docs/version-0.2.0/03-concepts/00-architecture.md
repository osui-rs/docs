---
sidebar_position: 0
title: Core Architecture
---

# Core Architecture

OSUI is designed with a clear separation of concerns, drawing inspiration from modern GUI frameworks like React. This modular architecture aims for flexibility, testability, and scalability. Here's a high-level overview of how the different parts of OSUI interact to form a functional TUI application.

```mermaid
graph TD
    A[Application Root (main.rs)] --> B(Engine::run(RootComponent))
    B --> C(Engine)
    C -- init --> D(Root Component Context)
    D -- refresh --> E(Root Component View)
    E -- generate_children --> F(Frontend::Rsx)
    F -- create Scopes & Contexts --> D
    D -- draw_children --> G(Render::DrawContext)
    G -- execute DrawInstructions --> H(Engine::draw_context)
    H -- actual terminal output --> I(crossterm)

    subgraph State & Events
        J[Component Context] -- manage state via hooks --> K(State<T>)
        K -- notify dependents --> L(HookEffect)
        L -- trigger callbacks --> J
        J -- emit events --> M(Event Handlers)
        M -- propagate to children --> J
    end

    subgraph User Interaction
        N[Input Polling Thread] --> O(Engine::CommandExecutor)
        O -- execute commands --> C
        O -- emit events --> J
    end

    C -- continuous loop --> E
    D --> J
    J --> E
```

## Key Architectural Components

### 1. **Component System (`osui::component`)**

*   **`ComponentImpl`**: The fundamental trait defining a renderable UI unit. Any type implementing this can be an OSUI component.
*   **`Context`**: Each active component instance has its own `Context`. This is the central hub for:
    *   Holding the component's `View` (its rendered output).
    *   Managing its local state using hooks (e.g., `use_state`).
    *   Registering and emitting events (`on_event`, `emit_event`).
    *   Managing its children components and their `Scope`s.
    *   Accessing the `CommandExecutor` to interact with the engine.
*   **`Scope`**: A `Context` can contain multiple child `Scope`s. A `Scope` is primarily a container that groups a set of child components (`Context`s) and their optional `ViewWrapper`s. `Rsx` fragments generate `Scope`s to manage their children.

**Why it works this way**: This component-based approach promotes modularity and reusability. `Context` provides a stable identity and state for each component instance, enabling independent updates and event handling. The tree structure formed by `Context`s and `Scope`s mirrors the UI hierarchy.

### 2. **State Management (`osui::state`)**

*   **`State<T>`**: A reactive wrapper for any data `T`. When `State<T>` is updated, it automatically notifies all its registered "dependents".
*   **`use_state`**: The primary hook to create and manage `State<T>` within a component.
*   **`use_effect`**: A hook for performing side effects (e.g., logging, network requests) in response to `State<T>` changes or component mounting.
*   **`HookDependency`**: A trait that `State<T>` and `Mount` implement, allowing them to be tracked by `use_effect` and dynamic `rsx!` blocks.

**Why it works this way**: Inspired by React hooks, this system provides a predictable and efficient way to manage mutable state. By declaring explicit dependencies for effects and dynamic `rsx!` blocks, OSUI can minimize re-renders and computations, only updating parts of the UI that are truly affected by state changes.

### 3. **Frontend / Declarative UI (`osui::frontend` & `osui-macros`)**

*   **`rsx!` macro**: A procedural macro that allows you to write UI using a declarative, XML-like syntax directly in Rust.
*   **`#[component]` macro**: A procedural macro that transforms a Rust function into an OSUI component, automatically handling prop parsing and `ComponentImpl` implementation.
*   **`Rsx`**: An internal representation (produced by `rsx!`) of a UI fragment, consisting of a vector of `RsxScope`s.
*   **`RsxScope`**: An enum defining different types of UI nodes (static text, components, dynamic conditional/loop blocks).

**Why it works this way**: Declarative UI is generally easier to reason about than imperative drawing commands. The `rsx!` macro provides a high-level abstraction that maps directly to the component tree and state management, significantly improving developer experience. The macro-generated `Rsx` object then serves as a blueprint for `Context` to build its children.

### 4. **Rendering Pipeline (`osui::render`)**

*   **`View`**: The ultimate output of a component's rendering logic. It's a closure that, when called, populates a `DrawContext` with drawing instructions.
*   **`DrawContext`**: A mutable accumulator for `DrawInstruction`s. Components add text, child views, or custom drawing commands to this context. It also tracks the available `Area` and `allocated` space.
*   **`DrawInstruction`**: An enum representing atomic drawing operations (e.g., `Text`, `View`, `Child`).
*   **Geometric Primitives**: `Point`, `Size`, `Area` define positions and dimensions.

**Why it works this way**: This separation allows the rendering logic to be independent of the actual display medium. Components declare *what* to draw using high-level instructions, and the `Engine` then decides *how* to execute them on the specific backend (e.g., terminal).

### 5. **Engine (`osui::engine`)**

*   **`Engine` trait**: Defines the interface for running an OSUI application, including initialization, continuous rendering, and managing the render loop.
*   **`Console`**: The default implementation of `Engine`, which uses `crossterm` to interact with the terminal.
*   **`CommandExecutor` trait**: An interface for executing system-level commands (e.g., `Stop`).
*   **`Benchmark`**: A wrapper `Engine` that measures and reports performance statistics.

**Why it works this way**: The `Engine` trait makes OSUI extensible. You can swap out the `Console` engine for a different backend (e.g., a web renderer, a headless testing engine) without changing your core component logic. The `CommandExecutor` provides a standardized way for components to request actions from the environment.

This interconnected architecture allows OSUI to offer a powerful, flexible, and developer-friendly experience for building sophisticated Terminal User Interfaces.

**Next:** Delve deeper into [The Component Model](./01-the-component-model.md).
