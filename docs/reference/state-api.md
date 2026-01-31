markdown
---
sidebar_position: 5
title: State API
---

# State Module API Reference

The `state` module provides OSUI's powerful, React-like hook system for managing component state and side effects. These hooks enable reactivity, allowing your UI to automatically update in response to data changes.

## `State<T>` Struct

```rust
#[derive(Debug)]
pub struct State<T> {
    value: Arc<Mutex<T>>,
    dependents: Arc<Mutex<Vec<HookEffect>>>,
}
```

`State<T>` is the primary type for holding reactive, component-local state. It wraps a value `T` in an `Arc<Mutex<T>>` for thread-safe access and includes a list of `HookEffect`s that should be triggered when its value changes.

#### Methods:

*   **`fn get(&self) -> Inner<'_, T>`**
    *   Acquires a lock on the internal `Mutex` and returns an `Inner<'_, T>` guard. This guard provides mutable (`DerefMut`) access to the state value. When the `Inner` guard is dropped, if the value was mutated, all `dependents` (registered `HookEffect`s) are notified.
*   **`fn get_dl(&self) -> T`**
    *   "Deadlock-less" getter. Acquires a lock, clones the internal value `T`, releases the lock, and returns the cloned value. Useful for reading the state when cloning `T` is cheap and you don't need mutable access, preventing potential deadlocks from holding a `MutexGuard` across `await` points or other blocking operations. Requires `T: Clone`.
*   **`fn set(&self, v: T)`**
    *   Replaces the current state value with `v` and then explicitly notifies all `dependents`.
*   **`fn update(&self)`**
    *   Manually triggers all registered `dependents`. Useful if you've modified the internal value without using `get()` (e.g., via `Arc::get_mut` if the `Arc` is uniquely owned, which is rare for `State<T>`).
*   **`fn clone(&self) -> Self`**
    *   Clones the `State<T>` handle (not the internal value). This creates a new `Arc` reference to the same underlying `value` and `dependents`. Essential for moving `State<T>` into closures or passing to child components without moving the actual state.

#### `Display` Implementation:
If `T` implements `std::fmt::Display`, `State<T>` also implements `std::fmt::Display`, allowing it to be directly formatted (e.g., in `format!`) by implicitly calling `get_dl()`.

### `Inner<'a, T>` Struct

```rust
pub struct Inner<'a, T> {
    value: MutexGuard<'a, T>,
    dependents: Arc<Mutex<Vec<HookEffect>>>,
    updated: bool,
}
```

A guard type returned by `State<T>::get()`. It provides scoped, mutable access to the internal state value.

#### `Deref` and `DerefMut` Implementations:
*   Allows `Inner<'a, T>` to be treated as a `&T` or `&mut T`, giving direct access to the underlying state.
*   The `DerefMut` implementation sets an internal `updated` flag.

#### `Drop` Implementation:
*   When `Inner<'a, T>` is dropped, if the `updated` flag is `true`, it automatically iterates through `dependents` and calls their `call()` method, ensuring reactivity.

## `HookEffect` Struct

```rust
#[derive(Clone)]
pub struct HookEffect(Arc<Mutex<dyn FnMut() + Send + Sync>>);
```

A wrapper around a mutex-protected closure that represents a side effect. These are registered as dependents of `State<T>` or `Mount` and are triggered when dependencies change.

#### Methods:

*   **`fn new<F: Fn() + Send + Sync + 'static>(f: F) -> Self`**
    *   Creates a new `HookEffect` from a given closure.
*   **`fn call(&self)`**
    *   Executes the wrapped closure by acquiring its mutex.

## `HookDependency` Trait

```rust
pub trait HookDependency: Send + Sync {
    fn on_update(&self, hook: HookEffect);
}
```

The `HookDependency` trait defines how an object can register an effect (`HookEffect`) to be triggered when it updates.

**Implementations:**
*   **`State<T>`**: Registers the `HookEffect` to be called when `State<T>`'s value changes (via `set()`, `get()` and subsequent drop, or `update()`).
*   **`Mount`**: Registers the `HookEffect` to be called when `mount()` is invoked, or immediately if already mounted.

## `Mount` Struct

```rust
#[derive(Debug, Clone)]
pub struct Mount(Arc<Mutex<bool>>, Arc<Mutex<Vec<HookEffect>>>);
```

A specialized hook for managing component lifecycle (specifically, the "mounted" state). It tracks whether a component has been mounted and queues `HookEffect`s to be run upon mounting.

#### Methods:

*   **`fn mount(&self)`**
    *   Sets the internal flag to `true`, indicating the component is now mounted.
    *   Executes all currently queued `HookEffect`s and clears the queue.
    *   Any `HookEffect` registered after `mount()` has been called will execute immediately.

## Hooks Functions

These functions are the primary way to interact with the state management system within your components.

### `fn use_state<T>(v: T) -> State<T>`

*   **Purpose**: Creates and initializes a new `State<T>` instance.
*   **Usage**: `let count = use_state(0);`

### `fn use_effect<F: FnMut() + Send + Sync + 'static>(f: F, dependencies: &[&dyn HookDependency])`

*   **Purpose**: Registers a side effect `f` that will run when any of the `dependencies` change, and also once initially. The effect closure is run in a `std::thread::spawn`.
*   **Usage**:
    ```rust
    let counter = use_state(0);
    use_effect(
        { let counter = counter.clone(); move || println!("Counter changed: {}", counter.get_dl()) },
        &[&counter] // Dependencies
    );
    ```
*   **Empty Dependencies**: If `dependencies` is `&[]`, the effect runs once on initial render and never again.

### `fn use_mount() -> Mount`

*   **Purpose**: Creates a `Mount` instance that is immediately marked as "mounted". Effects registered with this `Mount` (via `use_effect`) will run once, immediately.
*   **Usage**: `let mount_hook = use_mount();`

### `fn use_mount_manual() -> Mount`

*   **Purpose**: Creates a `Mount` instance that starts in an "unmounted" state. Effects registered with this `Mount` will *only* run when its `.mount()` method is explicitly called (either programmatically or via `!mount_hook_instance` in `rsx!`).
*   **Usage**: `let manual_mount_hook = use_mount_manual();`

### `fn use_sync_state<T, E, D>(cx: &Arc<Context>, v: T, decoder: D) -> State<T>`

*   **Purpose**: Creates a `State<T>` that automatically updates its value whenever an event of type `E` is emitted to the given `Context`. The `decoder` function converts `&E` into a new `T`.
*   **Usage**:
    ```rust
    // Assume MessageChangeEvent is defined
    let message_state = use_sync_state(
        cx,
        "Default message".to_string(),
        |event: &MessageChangeEvent| event.0.clone()
    );
    ```

### `fn use_sync_effect<T, Ev, E>(cx: &Arc<Context>, state: &State<T>, encoder: E, deps: &[&dyn HookDependency])`

*   **Purpose**: Registers an effect that emits an event `Ev` to the given `Context` whenever the monitored `state` changes (or any other specified `deps`). The `encoder` function converts `&State<T>` into an `Ev`.
*   **Usage**:
    ```rust
    let count_state = use_state(0);
    // Assume CounterUpdatedEvent is defined
    use_sync_effect(
        cx,
        &count_state,
        |s: &State<i32>| CounterUpdatedEvent { new_value: s.get_dl() },
        &[&count_state]
    );
    ```

These hooks provide a complete and reactive state management solution, enabling dynamic and interactive TUI applications in OSUI.

**Next:** Delve into the details of the [Macros API](./macros-api.md).
