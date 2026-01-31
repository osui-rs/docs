---
sidebar_position: 1
title: Component API
---

# Component Module API Reference

The `component` module is the heart of OSUI's UI system, defining how reusable UI units are structured, manage their state, and interact.

## `ComponentImpl` Trait

```rust
pub trait ComponentImpl: Send + Sync {
    fn call(&self, cx: &Arc<Context>) -> View;
}
```

The `ComponentImpl` trait is implemented by all types that can act as an OSUI component.
*   **`call(&self, cx: &Arc<Context>) -> View`**: The core method that renders the component. It takes a reference to the component itself (`self`) and the component's `Context` (`cx`), and returns a `View` which contains the drawing instructions.

**Implementations:**
*   **`View`**: A bare `View` (an `Arc<dyn Fn(&mut DrawContext) + Send + Sync>`) can itself be a `ComponentImpl`, simply returning itself.
*   **`Fn(&Arc<Context>) -> View`**: Any closure with this signature can also be a `ComponentImpl`.
*   **`#[component]` macro**: The `#[component]` macro automatically generates a struct and implements `ComponentImpl` for it, wrapping your component function.

## `Component` Type Alias

```rust
pub type Component = Arc<dyn ComponentImpl>;
```

A convenience type alias for a `ComponentImpl` wrapped in an `Arc`, allowing for shared, thread-safe ownership.

## `EventHandler` Type Alias

```rust
pub type EventHandler = Arc<Mutex<dyn FnMut(&Arc<Context>, &dyn Any) + Send + Sync>>;
```

A type alias for a mutex-protected, thread-safe, mutable closure that handles events. Event handlers receive the component's `Context` and a reference to the event data (as `&dyn Any`).

## `context` Module

Contains the `Context` struct, which is central to each component instance.

### `Context` Struct

```rust
pub struct Context {
    component: AccessCell<Component>,
    view: AccessCell<View>,
    event_handlers: AccessCell<HashMap<TypeId, Vec<EventHandler>>>,
    pub(crate) scopes: Mutex<Vec<Arc<Scope>>>,
    executor: Arc<dyn CommandExecutor>,
}
```

The `Context` holds the runtime state and behavior for a specific component instance. It manages the component's `View`, its registered event handlers, and its child `Scope`s.

#### Methods:

*   **`fn new<F: ComponentImpl + 'static>(component: F, executor: Arc<dyn CommandExecutor>) -> Arc<Self>`**
    *   Creates a new `Arc` wrapped `Context` for the given component and command executor.
*   **`fn refresh(self: &Arc<Self>)`**
    *   Re-renders the component by clearing existing event handlers and calling the component's `call` method to produce a new `View`. This is typically called automatically by the engine or `Rsx`.
*   **`fn refresh_sync(self: &Arc<Self>)`**
    *   Synchronously re-renders the component, blocking until the view closure has finished executing.
*   **`fn get_view(self: &Arc<Self>) -> View`**
    *   Returns a clone of the component's current `View`.
*   **`fn on_event<T: Any + 'static, F: Fn(&Arc<Self>, &T) + Send + Sync + 'static>(self: &Arc<Self>, handler: F)`**
    *   Registers an event handler `F` for events of type `T`. When an event of type `T` is `emit`ted to this `Context`, the handler `F` will be invoked.
*   **`fn emit_event<E: Send + Sync + Any + 'static>(self: &Arc<Self>, event: E)`**
    *   Emits an event `E`. All registered handlers for type `E` on this `Context` are called synchronously, and then the event is propagated to all child components.
*   **`fn emit_event_threaded<E: Any + Send + Sync + Clone + 'static>(self: &Arc<Self>, event: &E)`**
    *   Emits an event `E`. Each registered handler for type `E` on this `Context` is called in a *newly spawned thread*. The event is then propagated to all child components (also using `emit_event_threaded`). Requires `E` to be `Clone`.
*   **`fn scope(self: &Arc<Self>) -> Arc<Scope>`**
    *   Creates a new, empty child `Scope` and adds it to this `Context`. Returns the new `Scope`.
*   **`fn dyn_scope<F: Fn(&Arc<Scope>) + Send + Sync + 'static>(self: &Arc<Self>, drawer: F, dependencies: &[&dyn HookDependency]) -> Arc<Scope>`**
    *   Creates a new *dynamic* child `Scope` that re-renders (by calling `drawer`) whenever any of its `dependencies` change. `drawer` is also called immediately. Returns the new `Scope`.
*   **`fn add_scope(self: &Arc<Self>, scope: Arc<Scope>)`**
    *   Adds an already constructed `Scope` as a child to this `Context`.
*   **`fn draw_children(self: &Arc<Self>, ctx: &mut DrawContext)`**
    *   Iterates through all child `Scope`s and their components, rendering them into the provided `DrawContext`. Handles `ViewWrapper`s if present.
*   **`fn get_executor(self: &Arc<Self>) -> Arc<dyn CommandExecutor>`**
    *   Returns a clone of the `CommandExecutor` associated with this `Context`.
*   **`fn execute<T: Command + 'static>(self: &Arc<Self>, command: T) -> crate::Result<()>`**
    *   Executes a given `Command` using the associated `CommandExecutor`.
*   **`fn stop(self: &Arc<Self>) -> crate::Result<()>`**
    *   A convenience method to execute the `Stop` command, terminating the application.

## `scope` Module

Contains the `Scope` struct, which organizes child components within a `Context`.

### `Scope` Struct

```rust
pub struct Scope {
    pub children: Mutex<Vec<(Arc<Context>, Option<ViewWrapper>)>>,
    executor: Arc<dyn CommandExecutor>,
}
```

A `Scope` groups child components. Each entry in `children` consists of a child `Context` and an optional `ViewWrapper` that can modify its rendering.

#### Methods:

*   **`fn new(executor: Arc<dyn CommandExecutor>) -> Arc<Self>`**
    *   Creates a new `Arc` wrapped `Scope` with the given `CommandExecutor`.
*   **`fn child<F: ComponentImpl + 'static>(self: &Arc<Self>, child: F, view_wrapper: Option<ViewWrapper>)`**
    *   Creates a new `Context` for the provided `child` component, refreshes it, and adds it to this `Scope`'s children, optionally with a `ViewWrapper`.
*   **`fn view(self: &Arc<Self>, view: View)`**
    *   Creates a new `Context` directly from a `View` (without an explicit `ComponentImpl`), refreshes it, and adds it to this `Scope`'s children.

This module forms the backbone of how component trees are constructed and managed in OSUI.

**Next:** Explore the [Engine API](./engine-api.md).
