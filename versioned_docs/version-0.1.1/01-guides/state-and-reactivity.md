# State and Reactivity in OSUI

OSUI's reactivity model enables your UI to automatically update when underlying data changes, eliminating the need for manual DOM manipulation. This is achieved through the `State<T>` struct and its integration with `DynWidget`s via the `DependencyHandler` trait.

## The Problem: Dynamic UIs

Imagine you have a counter that increments over time, and you want to display its current value in your TUI. Without a reactive system, you would manually:
1.  Get the new count.
2.  Clear the old count from the screen.
3.  Draw the new count at the correct position.
4.  Manage redraws if other elements shift.

This becomes complex quickly, especially with multiple, interconnected pieces of dynamic data.

## The OSUI Solution: `State<T>`

`State<T>` is a generic type that wraps your data `T` and provides mechanisms to signal when `T` has changed. This signal then triggers a re-render of any UI widget that depends on that `State`.

### 1. Creating Reactive State: `use_state()`

The `use_state` function is the primary way to create a new `State<T>` instance:

```rust
use osui::prelude::*;

fn main() -> std::io::Result<()> {
    let screen = Screen::new();
    screen.extension(InputExtension); // Needed for event loop

    // Create a new State<i32> initialized with 0
    let counter = use_state(0);

    // ... UI definition and screen.run()
    Ok(())
}
```
`State<T>` internally uses `Arc<Mutex<Inner<T>>>`, making it `Send + Sync` and safely shareable across threads and widgets.

### 2. Modifying State and Triggering Updates

The most common way to interact with `State<T>` is via its `get()` method, which returns a `MutexGuard<'_, Inner<T>>`. The `Inner<T>` struct implements `Deref` and `DerefMut` for `T`, allowing you to treat `state.get()` much like a direct mutable reference to your data.

**Key Point**: When you use `DerefMut` (e.g., `*state.get() = ...` or `*state.get() += 1`), the `State` automatically registers that it has changed. This is critical for reactivity.

```rust
use osui::prelude::*;
use std::{thread, time::Duration};

fn main() -> std::io::Result<()> {
    let screen = Screen::new();
    screen.extension(InputExtension); // Required for terminal setup

    let counter = use_state(0);

    // Spawn a new thread to increment the counter every second.
    // We clone `counter` (which is cheap due to Arc) to move it into the thread.
    thread::spawn({
        let counter_clone = counter.clone(); // Clone the Arc for the new thread
        move || {
            loop {
                // Get a mutable lock on the counter state
                // The DerefMut implementation on `Inner<i32>` will mark the state as changed
                // (setting `inner.changed = inner.dependencies`)
                *counter_clone.get() += 1;
                thread::sleep(Duration::from_secs(1));
            }
        }
    });

    rsx! {
        // Declare that this Div widget depends on the `counter` state.
        // The `%counter` syntax is a critical part of connecting state to UI.
        %counter
        Div {
            // Access the value of the state using `.get()`.
            // `format!` macro will automatically call `Display` for `State<T>`.
            format!("Current Count: {}", counter.get())
        }
    }
    .draw(&screen);

    screen.run()?;
    Ok(())
}
```

In this example:
*   `*counter_clone.get() += 1;` modifies the `i32` value and simultaneously tells `State<i32>` that it has been updated.
*   Because the `Div` element was declared with `%counter` in `rsx!`, it becomes a `DynWidget` and registers `counter` as one of its dependencies.
*   In the main rendering loop (inside `screen.run()`), `DynWidget`s repeatedly call `dependency.check()`. When `counter.check()` returns `true` (because it was marked as changed), the `DynWidget` rebuilds its internal `Element` and components, refreshing its content with the new `counter` value.

### 3. Declaring Dependencies in `rsx!`

The `%variable_name` syntax in the `rsx!` macro is how you declare that a widget depends on a `State<T>` variable (or any type implementing `DependencyHandler`).

```rust
let my_data = use_state("Initial".to_string());
// ...
rsx! {
    %my_data // This Div will re-render when `my_data` changes
    Div {
        format!("Data: {}", my_data.get())
    }
}
```
You can declare multiple dependencies: `%state1 %state2 Div { ... }`.

### When to use `State::set()` or `State::update()`

*   **`State::set(new_value)`**: Use this when you want to entirely replace the `T` value within the `State` and mark it as changed.
    ```rust
    // Instead of: *my_state.get() = "New".to_string();
    my_state.set("New".to_string());
    ```
*   **`State::update()`**: Use this if you modify the inner `T` value through a path that doesn't trigger `DerefMut` (e.g., if `T` is a complex struct and you modify one of its fields after getting a `&mut T` but without re-assigning the whole `T`). This explicitly tells `State` that it has changed.
    ```rust
    // If MyComplexData has an internal field modified, and you only got `&mut MyComplexData`
    // but didn't reassign the whole struct.
    let mut data_lock = my_complex_data.get();
    data_lock.some_internal_field.modify();
    // After modifying, you might need to manually update if DerefMut didn't catch it
    // (though in most simple cases, DerefMut handles it automatically).
    my_complex_data.update();
    ```

### Cloning `State<T>`

Since `State<T>` uses `Arc`, cloning a `State<T>` instance is very cheap. It only increments the reference count of the shared `Arc`. This is how you pass `State` into closures or other threads without moving ownership.

```rust
let original_state = use_state(0);
let cloned_state = original_state.clone(); // This is just an Arc clone
```

By leveraging `State<T>` and dependency tracking, OSUI enables you to build dynamic, responsive terminal UIs with a clear separation of concerns between data and presentation.
