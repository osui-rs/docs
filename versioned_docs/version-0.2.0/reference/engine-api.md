markdown
---
sidebar_position: 2
title: Engine API
---

# Engine Module API Reference

The `engine` module defines the core interfaces for how OSUI applications run, render, and execute commands. It provides abstractions for different rendering backends and includes a default console implementation.

## `Engine` Trait

```rust
pub trait Engine<Output = ()> {
    fn run<C: ComponentImpl + 'static>(&self, component: C) -> crate::Result<Output>;
    fn init<C: ComponentImpl + 'static>(&self, component: C) -> Arc<Context>;
    fn render(&self, cx: &Arc<Context>);
    fn render_delay(&self);
    fn render_view(&self, area: &Area, view: &View) -> DrawContext;
    fn draw_context(&self, ctx: &DrawContext);
    fn executor(&self) -> Arc<dyn CommandExecutor>;
}
```

The `Engine` trait is the primary interface for running an OSUI application. It abstracts away the specifics of how components are initialized, rendered, and how the application loop is managed.

#### Associated Types / Generics:

*   **`Output`**: A generic type that allows `run` to return different results. By default, it's `()`, but for specialized engines (like `Benchmark`), it can return custom data.

#### Methods:

*   **`fn run<C: ComponentImpl + 'static>(&self, component: C) -> crate::Result<Output>`**
    *   The main entry point to start the OSUI application loop. It takes the root component `C`, initializes it, and continuously renders until a stop command is issued. Returns `Ok(())` by default, or a custom `Output` for specialized engines.
*   **`fn init<C: ComponentImpl + 'static>(&self, component: C) -> Arc<Context>`**
    *   Initializes the rendering environment and creates the root `Context` for the application's top-level component. This is typically called by `run`.
*   **`fn render(&self, cx: &Arc<Context>)`**
    *   Performs a full render cycle for the given `Context`. This usually involves clearing the screen, calling `render_view` for the root, and then `draw_context`.
*   **`fn render_delay(&self)`**
    *   A hook for introducing a delay between render frames. The default implementation calls `crate::sleep(16)` for approximately 60 frames per second.
*   **`fn render_view(&self, area: &Area, view: &View) -> DrawContext`**
    *   Takes a `View` and the `Area` it should render within, executing the `View`'s closure to produce a `DrawContext` filled with `DrawInstruction`s.
*   **`fn draw_context(&self, ctx: &DrawContext)`**
    *   Executes the drawing instructions contained within a `DrawContext` to actually draw content to the rendering target (e.g., the terminal).
*   **`fn executor(&self) -> Arc<dyn CommandExecutor>`**
    *   Returns the `CommandExecutor` instance used by this engine.

## `Command` Trait

```rust
pub trait Command {
    fn as_any(&self) -> &dyn Any;
}
```

The `Command` trait is implemented by types that represent actions or instructions that can be executed by the `CommandExecutor`. This trait enables a type-safe way to send commands between components and the engine.

*   **`fn as_any(&self) -> &dyn Any`**: Allows downcasting the command to its concrete type for pattern matching and execution.

## `CommandExecutor` Trait

```rust
pub trait CommandExecutor: Send + Sync {
    fn execute_command(&self, command: &Arc<dyn Command>) -> crate::Result<()>;
}
```

The `CommandExecutor` trait defines how commands are processed within the OSUI application. Engines provide their own implementations of this trait to handle system-level operations.

*   **`fn execute_command(&self, command: &Arc<dyn Command>) -> crate::Result<()>`**: Takes an `Arc` wrapped `Command` and executes it. Implementations typically use `command.as_any().downcast_ref()` to identify and process specific commands.

## `console` Module: `Console` Engine and `ConsoleExecutor`

The `console` module provides OSUI's default, `crossterm`-based rendering engine.

### `Console` Struct

```rust
pub struct Console {
    threads: Mutex<Vec<Arc<dyn Fn(Arc<Context>) + Send + Sync>>>,
    executor: Arc<ConsoleExecutor>,
}
```

The `Console` struct implements the `Engine` trait, specifically designed to render to a terminal using `crossterm`.

#### Methods:

*   **`fn new() -> Self`**: Creates a new `Console` engine.
*   **`fn thread<F: Fn(Arc<Context>) + Send + Sync + 'static>(&self, run: F)`**: Registers a closure to be run in a separate thread when the engine initializes. This is useful for background tasks or input polling that needs access to the main `Context`.

#### `Engine` Trait Implementation:
The `Console` implements all methods of the `Engine` trait, handling terminal setup (raw mode, cursor hiding), screen clearing, `crossterm` cursor movements, and text output.

### `ConsoleExecutor` Struct

```rust
pub struct ConsoleExecutor {
    running: Mutex<bool>,
}
```

The `ConsoleExecutor` implements the `CommandExecutor` trait for the `Console` engine. It manages the `running` state of the application.

#### Methods:

*   **`fn is_running(self: &Arc<ConsoleExecutor>) -> bool`**: Checks if the application is currently running.
*   **`fn stop(&self) -> crate::Result<()>`**: Sets the internal `running` flag to `false`, signaling the `Console` engine to terminate its `run` loop.

#### `CommandExecutor` Trait Implementation:
The `ConsoleExecutor` currently supports handling the `commands::Stop` command.

## `commands` Module: Built-in Commands

The `commands` module defines simple, built-in commands for the engine.

### `Stop` Command

```rust
pub struct Stop;

impl Command for Stop {
    fn as_any(&self) -> &dyn std::any::Any;
}
```

A basic command used to signal the `Engine` to stop its main loop and exit the application.

## `benchmark` Module: `Benchmark` Engine

The `benchmark` module provides a wrapper engine for performance testing.

### `BenchmarkResult` Struct

```rust
pub struct BenchmarkResult {
    pub average: u128,
    pub min: u128,
    pub max: u128,
    pub total_render: u128,
    pub total: u128,
}
```

Holds the statistical results of a benchmark run, including average, minimum, maximum, total render time, and total overall time in microseconds.

### `Benchmark<T: Engine>` Struct

```rust
pub struct Benchmark<T: Engine>(T);
```

A wrapper around any other `Engine` that measures its rendering performance.

#### Methods:

*   **`fn new(engine: T) -> Self`**: Creates a new `Benchmark` wrapper around an existing `Engine` instance.

#### `Engine<BenchmarkResult>` Trait Implementation:
The `Benchmark` engine implements the `Engine` trait, but its `run` method performs multiple render cycles (e.g., 40 times), measures the duration of each, and returns a `BenchmarkResult` instead of `()`. It delegates all other `Engine` methods to the wrapped engine.

This comprehensive set of traits and implementations allows OSUI to be flexible regarding its rendering backend and extensible with custom command handling.

**Next:** Explore the [Frontend API](./frontend-api.md).
