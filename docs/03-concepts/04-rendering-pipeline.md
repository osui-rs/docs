---
sidebar_position: 4
title: The Rendering Pipeline
---

# The Rendering Pipeline

The OSUI rendering pipeline is the process by which your declarative component hierarchy is transformed into concrete drawing operations on the terminal. It's an abstraction layer that allows components to describe *what* to draw, while the `Engine` handles *how* to draw it.

## Stages of the Pipeline

The pipeline can be broken down into several distinct stages:

### 1. Component `call` and `View` Generation

*   **`Engine::run`**: The main application loop starts by calling `Engine::run` with your root component.
*   **`Context::refresh`**: The engine initializes the root component's `Context` and calls `Context::refresh`.
*   **`ComponentImpl::call`**: Inside `refresh`, the component's `ComponentImpl::call` method is invoked. This is where your component function (decorated with `#[component]`) executes.
*   **`rsx!` Macro Expansion**: Within your component function, the `rsx!` macro generates an `osui::frontend::Rsx` object.
*   **`Rsx::view(&cx)`**: This method converts the `Rsx` object into a `View`. Critically, `Rsx::view` also triggers `Rsx::generate_children`.
*   **`Rsx::generate_children`**: This recursively processes the `Rsx` object, creating new child `Context`s and `Scope`s within the current `Context`. For `dynamic_scope`s (`@if`, `@for`), it also registers `use_effect` hooks to trigger re-evaluation when dependencies change.
*   **Result**: The component function ultimately returns a `View`. This `View` is a closure that, when executed, will populate a `DrawContext` by calling `context.draw_children()`.

### 2. `DrawContext` Construction (`render_view`)

*   **`Engine::render`**: In the main rendering loop, the `Engine` calls `render` for the current `Context`.
*   **`Engine::render_view`**: The `Engine` creates a fresh, empty `DrawContext` for the entire screen `Area`. It then executes the root component's `View` (the closure generated in Stage 1) against this `DrawContext`.
*   **`Context::draw_children`**: The root `View`'s closure invokes `context.draw_children()`. This method iterates through all child `Scope`s and their contained `Context`s. For each child `Context`, it retrieves its `View` and adds a `DrawInstruction::View` to the current `DrawContext`, recursively starting the `render_view` process for children within their allocated `Area`.
*   **`DrawContext::draw_text`, `DrawContext::draw_view`, `DrawContext::allocate`**: As `View`s are executed, they add `DrawInstruction`s to the `DrawContext` using methods like `draw_text` for text, `draw_view` for child components, and `allocate` to mark used screen regions.
*   **Result**: A fully populated `DrawContext` containing a flat list of `DrawInstruction`s, ready for rendering.

### 3. `DrawInstruction` Execution (`draw_context`)

*   **`Engine::draw_context`**: After `render_view` has produced a complete `DrawContext`, the `Engine`'s `draw_context` method is called. This is the stage where the actual terminal output happens.
*   **Instruction Iteration**: `draw_context` iterates through the `Vec<DrawInstruction>` inside the `DrawContext`.
*   **`Text`**: For `DrawInstruction::Text(point, text)`, the engine translates `point` (which is relative to the `DrawContext`'s `area`) into absolute terminal coordinates and uses `crossterm` to move the cursor and print the `text`.
*   **`View`**: For `DrawInstruction::View(area, view)`, the engine recursively calls `render_view` for the child `view` within its specific `area`, then processes the resulting `DrawContext`.
*   **`Child`**: For `DrawInstruction::Child(point, child_ctx)`, the engine recursively calls `draw_context` for the `child_ctx`, applying the `point` offset.
*   **Terminal Output**: The `Console` engine uses `crossterm` functions (like `MoveTo`, `Print`, `Clear`) to modify the terminal buffer.
*   **Result**: The visible TUI on the user's screen.

## `render_delay` and Loop

After `draw_context` completes, the `Engine` typically calls `render_delay()` (defaulting to 16ms for ~60 FPS) before the entire loop restarts with the next `Engine::render` call. This continuous loop maintains a responsive and updated UI.

```mermaid
graph TD
    A[Component Function (`#[component]`)] --> B(Generates `Rsx` object)
    B --> C(Rsx::view(&cx))
    C -- calls Rsx::generate_children --> D(Builds child Contexts & Scopes)
    D --> E(Returns a `View` closure)

    subgraph Engine Loop
        F[Engine::render(root_cx)] --> G(Engine::render_view(full_screen_area, root_view))
        G -- creates empty DrawContext --> H(Executes root_view closure)
        H -- root_view calls Context::draw_children --> I(Recursively adds DrawInstruction::View for children)
        I -- children's Views populate DrawContext --> J(Result: Full DrawContext with instructions)
        J --> K(Engine::draw_context(full_DrawContext))
        K -- iterates DrawInstructions --> L(Executes terminal ops via crossterm)
        L --> M[Visible TUI]
        M -- optional delay --> N(Engine::render_delay)
        N --> F
    end
```

## Key Principles

*   **Declarative vs. Imperative**: Components declare *what* to draw (`View`, `DrawInstruction`), not *how* to directly manipulate the terminal. The engine handles the imperative *how*.
*   **Separation of Concerns**: Each stage focuses on a specific responsibility: component logic, state management, UI tree construction, and final rendering.
*   **Reactivity Integration**: Dynamic `rsx!` blocks and `use_effect` ensure that only affected parts of the `View` or `DrawContext` are re-generated efficiently when state changes, minimizing redundant work.
*   **Extensibility**: The `Engine` trait allows for different rendering backends (e.g., to a file, to a graphical window, or for benchmarking) without modifying component logic.

Understanding this pipeline helps in debugging rendering issues, optimizing performance, and building custom rendering logic within your OSUI applications.

**Next:** Explore advanced topics like [Performance Benchmarking](../advanced/00-performance-benchmarking.md).
