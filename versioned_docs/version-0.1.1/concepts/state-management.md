# State Management and Reactivity

OSUI provides a built-in, lightweight state management system that enables reactive updates to your UI. This system is centered around the `State<T>` struct and the `DependencyHandler` trait, allowing `DynWidget`s to automatically re-render when their associated data changes.

## `State<T>`: Your Reactive Data Container

The `State<T>` struct is a wrapper around your data `T` that facilitates dependency tracking.

```rust
#[derive(Debug, Clone)]
pub struct State<T> {
    inner: Arc<Mutex<Inner<T>>>,
}

#[derive(Debug)]
pub struct Inner<T> {
    value: T,
    dependencies: usize, // Number of widgets depending on this state
    changed: usize,      // Counter for changes waiting to be processed by dependents
}
```

*   **`Arc<Mutex<Inner<T>>>`**: The core of `State<T>` is its use of `Arc` and `Mutex`.
    *   `Arc` allows `State<T>` instances to be shared across multiple widgets and threads without needing to clone the underlying data `T` itself, which is crucial for `DynWidget`s that track multiple dependencies.
    *   `Mutex` ensures safe concurrent access to the `value` and metadata (`dependencies`, `changed`), preventing data races.

### Creating State (`use_state`)

You create a new `State<T>` instance using the `use_state` helper function:

```rust
pub fn use_state<T>(v: T) -> State<T> { /* ... */ }
```

**Example:**

```rust
use osui::prelude::*;

fn main() -> std::io::Result<()> {
    let screen = Screen::new();
    screen.extension(InputExtension);
    screen.extension(RelativeFocusExtension::new());

    // Create a new state variable for a counter
    let count = use_state(0);

    // Spawn a thread to increment the counter every second
    std::thread::spawn({
        let count = count.clone(); // Clone the Arc<State<T>> for the new thread
        move || loop {
            // Get a mutable lock on the Inner<T> to modify the value
            // DerefMut implementation on Inner<T> automatically marks it as changed
            *count.get() += 1;
            std::thread::sleep(std::time::Duration::from_secs(1));
        }
    });

    rsx! {
        // Declare the widget as dependent on `count`
        %count
        Div {
            // Access the value using Deref on Inner<T>
            format!("This number increments: {}", count.get())
        }
    }.draw(&screen);

    screen.run()?;
    Ok(())
}
```

### Accessing and Modifying State

*   **`State::get()`**: Returns a `MutexGuard<'_, Inner<T>>`. This provides mutable access to the underlying `value` within `Inner<T>`.
    *   `Inner<T>` implements `Deref` and `DerefMut` for `T`. This means you can treat `count.get()` like a direct reference to `T`.
    *   Crucially, when you use `DerefMut` (e.g., `*count.get() += 1`), the `changed` counter within `Inner<T>` is automatically incremented. This is how OSUI knows the state has been modified and needs to trigger a re-render.
*   **`State::get_dl()`**: (Short for "get, don't lock") Returns a cloned copy of the value. This is useful when you only need to read the value and want to avoid holding the `MutexGuard` for longer than necessary, which can prevent deadlocks in complex scenarios. However, it doesn't mark the state as changed.
*   **`State::set(v: T)`**: Replaces the entire value and marks the state as changed.
*   **`State::update()`**: Explicitly marks the state as changed *without* modifying its value. Useful if internal parts of `T` are modified outside of direct `DerefMut` access.

## `DependencyHandler` Trait

The `DependencyHandler` trait is the interface through which `DynWidget`s observe changes in their dependencies. `State<T>` implements this trait.

```rust
pub trait DependencyHandler: std::fmt::Debug + Send + Sync {
    fn add(&self);
    fn check(&self) -> bool;
}
```

*   **`add()`**: Called when a `DynWidget` registers itself as a dependent of this `State<T>`. It increments the `dependencies` counter within `Inner<T>`.
*   **`check()`**: Called by `DynWidget`s (specifically by `DynWidget::auto_refresh()`) to determine if the state has changed since the last check.
    *   It decrements the `changed` counter if it's greater than zero, signifying that a change has been "consumed" by a dependent.
    *   It returns `true` if `changed` was greater than zero, indicating a fresh update.

### How Reactivity Works

1.  **Widget Creation**: When `rsx!` creates a `DynWidget` with a `%state_var` dependency, `state_var.add()` is called, incrementing `state_var.inner.dependencies`.
2.  **State Modification**: When `*state_var.get() = new_value` or `state_var.set(new_value)` is called, the `state_var.inner.changed` counter is set to `state_var.inner.dependencies`. This means *all* widgets currently depending on this state are marked for a refresh.
3.  **Automatic Refresh**: In each rendering frame, `DynWidget::auto_refresh()` is called.
    *   It iterates through its registered `DependencyHandler`s.
    *   For each dependency, it calls `dependency.check()`.
    *   If `check()` returns `true` (meaning the state has changed and hasn't been consumed yet by this widget), the `DynWidget`'s internal `load` closure is re-executed (`self.refresh()`). This rebuilds the widget's `Element` and `Component`s, picking up the new state value.
    *   The `check()` method decrements the `changed` counter, ensuring that a single modification to the state triggers exactly one rebuild for each dependent widget.
4.  **Re-render**: The rebuilt widget is then rendered on the next frame, reflecting the updated state.

This system provides a robust and efficient way to manage dynamic UI elements, abstracting away the complexities of manual DOM updates and allowing developers to focus on defining their UI's desired state.
