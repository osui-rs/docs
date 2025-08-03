# Reactive Updates

OSUI incorporates a reactive programming model to automatically update parts of the UI in response to changes in application state. This system is built around `State<T>`, the `DependencyHandler` trait, and the `DynWidget` type, all orchestrated by the `Screen`'s rendering loop.

## The Problem: Manual UI Updates

In traditional UI frameworks without reactivity, when data changes, you would manually:

1.  Identify which UI elements depend on that data.
2.  Retrieve those elements.
3.  Update their properties or re-render them explicitly.

This can quickly become complex and error-prone in dynamic applications.

## The Solution: OSUI's Reactivity

OSUI automates this process. When a `State<T>` value is modified, any `DynWidget` that has declared that `State<T>` as a *dependency* is automatically flagged for a rebuild. During the next render cycle, these flagged widgets are re-evaluated, reflecting the new data.

## Key Components

### 1. `State<T>`: The Reactive Data Holder

`State<T>` is a generic struct that wraps your application data (`T`) and provides mechanisms for thread-safe access and change tracking.

*   **Internal Structure**: `Arc<Mutex<Inner<T>>>`
    *   `Arc`: Allows `State` instances to be cheaply cloned and shared across multiple threads and widgets without ownership issues.
    *   `Mutex`: Ensures thread-safe access to the underlying `value` and internal counters.
    *   `Inner<T>`: Contains `value: T`, `dependencies: usize` (how many widgets listen), and `changed: usize` (how many dependents need a refresh).
*   **Modification**:
    *   `my_state.set(new_value)`: Replaces the value and marks it as changed.
    *   `**my_state.get() = new_value` (or `my_state.get().deref_mut().field = new_value`): Mutates the value directly through a `MutexGuard`. The `DerefMut` implementation automatically marks the state as changed by setting `inner.changed = inner.dependencies`.
*   **Dependency Tracking**: Implements the `DependencyHandler` trait, allowing `DynWidget`s to register themselves.

(See [Reference: State API](/docs/reference/state_api.md) for more details)

### 2. `DependencyHandler` Trait

A trait that `State<T>` (and potentially other future reactive types) implements. It defines two crucial methods:

*   `add()`: Called when a `DynWidget` first registers itself as a listener to this dependency. It increments an internal counter of listeners.
*   `check()`: Called by `DynWidget` during its `auto_refresh` cycle. It decrements the `changed` counter and returns `true` if there are still pending changes to be processed by a listener. This ensures each listener processes a change only once per update cycle.

(See [Reference: State API - DependencyHandler Trait](/docs/reference/state_api.md#dependencyhandler-trait) for more details)

### 3. `DynWidget`: The Reactive Widget Wrapper

`DynWidget` is one of the two variants of the `Widget` enum (the other being `StaticWidget`). It is designed to be rebuilt when its dependencies change.

*   **Internal Structure**: Holds:
    *   A `Mutex<Box<dyn FnMut() -> WidgetLoad>>`: This is the *original closure* that built the widget. When a refresh is needed, this closure is re-executed to generate a new `WidgetLoad`.
    *   A `Mutex<Vec<Box<dyn DependencyHandler>>>`: A list of all `State<T>` instances (or other `DependencyHandler`s) this `DynWidget` is listening to.
*   **Key Methods**:
    *   `dependency(d: D)`: Registers a `DependencyHandler` with this widget. This also calls `d.add()`.
    *   `refresh()`: Forces the widget to rebuild immediately by re-executing its creation closure.
    *   `auto_refresh()`: The core of reactivity. It iterates through all registered `DependencyHandler`s. If `handler.check()` returns `true` for any of them, it calls `refresh()` to rebuild the widget.

(See [Reference: Widget API - DynWidget Struct](/docs/reference/widget_api.md#dynwidget-struct) for more details)

## How Reactive Updates Work in Practice

Let's trace the flow with a simple counter example:

1.  **Define State**:
    ```rust
    let count = use_state(0);
    ```
    This creates an `Arc<Mutex<Inner<i32>>>` where `dependencies` and `changed` are initially `0`.

2.  **Define Reactive UI (`rsx!`):**
    ```rust
    rsx! {
        %count // Declare dependency on `count` state
        Div {
            "Current count: {count}" // `State<T>` implements `Display`
        }
    }.draw(&screen);
    ```
    *   The `rsx!` macro sees `%count`. This tells it to create a `DynWidget` for the `Div`.
    *   It clones `Arc<State<i32>>` (the `count` variable) and captures it in the `DynWidget`'s creation closure.
    *   It calls `dyn_widget.dependency(count.clone())`. This calls `count.add()`, incrementing `count.inner.dependencies` to `1`.

3.  **Modify State**:
    ```rust
    // In a separate thread or event handler:
    **count.get() += 1;
    ```
    *   `count.get()` locks the `Mutex` and returns a `MutexGuard<Inner<i32>>`.
    *   `**count.get()` performs a mutable dereference to `value: i32`.
    *   Crucially, `Inner<T>::deref_mut()` is called, which then sets `count.inner.changed = count.inner.dependencies` (which is `1` in this case).
    *   When the `MutexGuard` is dropped, the `Mutex` is released.

4.  **Render Loop (`Screen::render`):**
    *   During the next animation frame, `Screen::render` iterates through its top-level widgets.
    *   It encounters our `DynWidget` for the `Div`.
    *   It calls `dyn_widget.auto_refresh()`.
    *   `auto_refresh()` iterates through its registered dependencies (only `count` in this case).
    *   It calls `count.check()`.
        *   `count.inner.changed` is `1`.
        *   `count.check()` decrements `count.inner.changed` to `0` and returns `true`.
    *   Since `check()` returned `true`, `dyn_widget.refresh()` is called.
    *   `refresh()` re-executes the `DynWidget`'s original creation closure.
        *   The closure captures the `count` state (which now has the incremented value).
        *   A *new* `Div` `Element` instance is created with the updated string: `"Current count: 1"`.
        *   This new `Element` and its initial components replace the old ones inside the `DynWidget`'s `Mutex`es.
    *   The `Screen` then proceeds to render the updated `Div` with the correct text.

This cycle of state modification, dependency tracking, and automatic widget rebuilding forms the core of OSUI's reactivity, allowing you to focus on defining your UI's structure and behavior without constantly managing manual updates.

## Performance Considerations

*   **Granularity**: OSUI re-renders the *entire widget* (and its children) when any of its dependencies change. For large widgets with many children, consider breaking them into smaller, more granular `DynWidget`s to minimize re-renders to only the affected parts of the UI tree.
*   **Frequent Updates**: If a `State` is updated extremely frequently (e.g., every millisecond), it will trigger a refresh on every frame that `auto_refresh` is called, which might be acceptable depending on complexity.
*   **`get_dl()` vs. `get()`**: Use `get_dl()` when you only need to read a cloned value and do not intend to modify the state or hold the lock for an extended period. Use `get()` (and `deref_mut()`) when you need to modify the state.



