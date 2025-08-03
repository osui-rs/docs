# `State` API Reference

OSUI provides a reactive state management system built around the `State<T>` struct and the `DependencyHandler` trait. This system allows your UI to automatically re-render when underlying data changes, eliminating the need for manual update calls in most cases.

## Core Concepts

### `DependencyHandler` Trait

This trait is implemented by types that can act as dependencies for dynamic widgets.

```rust
pub trait DependencyHandler: std::fmt::Debug + Send + Sync {
    /// Called when a dependent (e.g., a `DynWidget`) is registered with this handler.
    fn add(&self);
    /// Returns `true` if the state has changed since the last check.
    fn check(&self) -> bool;
}
```

*   `add()`: Increments an internal counter, indicating that another `DynWidget` is listening to this state.
*   `check()`: Decrements an internal counter and returns `true` if the state was marked as changed *and* there are still dependents that haven't processed the change.

## `State<T>` Struct

`State<T>` is the primary type for managing reactive data in OSUI. It wraps your data `T` in an `Arc<Mutex<Inner<T>>>`, allowing for shared, thread-safe access and change tracking.

```rust
#[derive(Debug, Clone)]
pub struct State<T> {
    inner: Arc<Mutex<Inner<T>>>,
}

#[derive(Debug)]
pub struct Inner<T> {
    value: T,
    dependencies: usize, // Number of widgets/handlers listening
    changed: usize,      // Number of dependents that need to be notified of a change
}
```

### `State` Creation

#### `use_state<T>(v: T) -> State<T>`

A convenience function to create a new `State` instance.

```rust
pub fn use_state<T>(v: T) -> State<T>
```

*   `v`: The initial value for the state.
*   **Returns**: A new `State<T>`.

    ```rust
    use osui::prelude::*;
    let counter = use_state(0);
    let name = use_state(String::from("Alice"));
    ```

### `State<T>` Methods

#### `get_dl(&self) -> T` (Clone required for `T`)

Gets a **cloned** value of the inner data. This is recommended to avoid deadlocks when accessing the state from multiple threads or within complex UI logic, as it doesn't hold the `Mutex` lock.

```rust
pub fn get_dl(&self) -> T
```

*   **Requires**: `T: Clone`.
*   **Returns**: A cloned instance of the inner `value`.

    ```rust
    let count_val = counter.get_dl();
    println!("Current count: {}", count_val);
    ```

#### `get(&self) -> MutexGuard<'_, Inner<T>>`

Obtains a `MutexGuard` for the `Inner<T>` struct. This allows direct read and write access to the underlying `value`. When the `MutexGuard` is dropped (or explicitly dereferenced mutably), the state is marked as changed.

```rust
pub fn get(&self) -> MutexGuard<'_, Inner<T>>
```

*   **Returns**: A `MutexGuard` that dereferences to `&Inner<T>`.
*   **Usage**: For both reading and mutating the state.

    ```rust
    // Reading
    let inner_state = counter.get();
    println!("Count from guard: {}", inner_state.value);

    // Mutating (will mark state as changed)
    let mut inner_state = counter.get();
    inner_state.value += 1; // Direct mutation
    *inner_state = 5; // Replaces the entire Inner struct (less common for value)
    ```

#### `set(&self, v: T)`

Sets the inner value directly and unconditionally marks the state as changed, notifying all listening dependents.

```rust
pub fn set(&self, v: T)
```

*   `v`: The new value for the state.

    ```rust
    counter.set(10); // Sets count to 10 and triggers a refresh for dependents
    ```

#### `update(&self)`

Manually marks the state as changed without modifying its value. This is useful if you mutate the inner value directly through `get()` and then want to explicitly trigger a refresh *after* the `MutexGuard` has been dropped, or if the change is internal to `T` and not visible via `DerefMut`.

```rust
pub fn update(&self)
```

    ```rust
    // Example where `update` might be useful (less common with DerefMut):
    let mut inner_data = counter.get();
    // Perform complex operations on inner_data.value
    // ...
    // Dropping inner_data will mark as changed, so update() might be redundant here
    // But if you had a situation where `DerefMut` didn't cover the change:
    // inner_data.some_internal_list.push(item);
    // drop(inner_data); // Dropping the guard normally triggers update
    // counter.update(); // Manual update if needed for some reason (e.g., if you only had an immutable guard before)
    ```

### `State<T>` and `DependencyHandler` Implementation

`State<T>` implements `DependencyHandler`, enabling it to participate in OSUI's reactive system:

*   `add()`: When a `DynWidget` declares a dependency on a `State<T>` (e.g., using `%my_state` in `rsx!`), this method is called. It increments `inner.dependencies`.
*   `check()`: During `DynWidget::auto_refresh`, this method is called. It checks if `inner.changed > 0`. If true, it decrements `inner.changed` and returns `true`, indicating the widget needs to be rebuilt.

### `Deref` and `DerefMut` for `Inner<T>`

The `Inner<T>` struct implements `Deref` and `DerefMut` to its inner `value: T`. This allows you to directly access and modify the `T` value through the `MutexGuard`.

*   `impl Deref for Inner<T>`: Allows `*inner_state` to yield `&T`.
*   `impl DerefMut for Inner<T>`: Allows `*inner_state = ...` or `inner_state.mutate_field = ...` to yield `&mut T`. **Crucially, when `deref_mut` is called, it sets `inner.changed = inner.dependencies`, ensuring all registered dependents are notified.**

    ```rust
    let my_state = use_state(0);

    // Directly read via Deref:
    let guard = my_state.get();
    println!("{}", *guard); // Prints the value of the integer

    // Directly mutate via DerefMut:
    let mut guard = my_state.get();
    *guard += 1; // Mutates the integer, triggers 'changed' flag
    drop(guard); // The guard is dropped here, releasing the mutex

    // The DynWidget dependent on `my_state` will now refresh on the next auto_refresh cycle.
    ```

### `Display` for `State<T>`

`State<T>` also implements `Display` if `T` implements `Display`. This is very convenient for embedding `State` values directly into strings in `rsx!` for display.

```rust
use osui::prelude::*;

let my_str_state = use_state(String::from("World"));

rsx! {
    %my_str_state
    Div {
        // This works because State<String> implements Display
        "Hello, {my_str_state}!"
    }
}
```

The `State` system, combined with `DynWidget` and the `rsx!` macro, forms the backbone of OSUI's reactive programming model, allowing for efficient and automatic UI updates in response to data changes.



