---
sidebar_position: 2
title: State Management
---

# State Management

Effective state management is crucial for building interactive and dynamic TUI applications. OSUI provides a React-like hook system that enables components to hold mutable state and react to changes efficiently. This guide covers the core state management hooks: `use_state` and `use_effect`.

## `use_state`: Managing Component-Local State

The `use_state` hook allows your components to declare and manage mutable, reactive state. When state managed by `use_state` changes, OSUI automatically re-renders affected parts of your UI.

### Basic Usage

```rust
use osui::prelude::*;
use std::sync::Arc;

#[component]
fn Counter(cx: &Arc<Context>) -> View {
    // 1. Initialize state with `use_state`
    // `count` is a `State<i32>`, initialized to 0.
    let count = use_state(0);

    // 2. Define a button that increments the count
    // This is a placeholder for actual interactive elements.
    // In a real app, an event handler would trigger `count.set()` or `*count.get_mut()`.
    let increment_button_simulated = {
        let count = count.clone(); // Clone the State handle to move into the closure
        move || {
            // Option 1: Using `set()` for direct replacement
            // count.set(*count.get() + 1);

            // Option 2: Using `get()` for mutable access (recommended for complex changes)
            *count.get() += 1; // `Inner` guard automatically calls `update()` on drop
        }
    };

    // Simulate clicking the button once per render for demonstration
    // In a real app, this would be triggered by user input or other events.
    increment_button_simulated();

    rsx! {
        // 3. Display the state value
        // `count.get_dl()` gets a cloned, deadlock-less copy of the value.
        // `count.get()` returns a guard for mutable access, also deadlock-less.
        format!("Count: {}", count.get_dl())
    }.view(&cx)
}

pub fn main() {
    let engine = Console::new();
    engine.run(Counter {}).expect("Failed to run Counter app");
}
```

In this example, the `Counter` component's state (`count`) is incremented on each render cycle (simulated). The `rsx!` macro automatically updates to reflect the new `count` value because the `Counter` component is re-rendered by the engine and the `count` state is used.

### `State<T>` and `Inner<'a, T>`

*   **`State<T>`**: This is the primary handle to your reactive state. It's an `Arc<Mutex<T>>` internally, allowing safe shared ownership and mutation across threads. When you call `use_state(value)`, you get a `State<T>`.
*   **`count.get()`**: This method returns an `Inner<'a, T>` guard. `Inner` implements `Deref` and `DerefMut`, so you can treat it almost like a direct reference to your data (`*count.get()`). The `Inner` guard is crucial because it automatically triggers updates to dependents when it's dropped *if* the value was mutated.
*   **`count.set(value)`**: A convenience method to replace the entire state value and then trigger updates.
*   **`count.get_dl()`**: Returns a cloned copy of the state value. The "dl" stands for "deadlock-less", as it doesn't hold the mutex lock for an extended period, making it safer for quick reads. Use this when you only need to read the value and cloning is cheap.
*   **`count.update()`**: Manually notifies all dependents that the state *might* have changed, even if you didn't use `get_mut()` or `set()`. Useful if you modify the internal `Arc<Mutex<T>>` directly (not recommended) or a complex part of `T` without triggering the `DerefMut` auto-update.

### Important Considerations for `State<T>`:

*   **Cloning `State` handles**: `State<T>` itself can be cloned (`count.clone()`). This creates a new `Arc` reference to the *same* underlying state. This is essential when moving `State` into closures or child components.
*   **`Send + Sync`**: The type `T` held by `State<T>` must implement `Send` and `Sync` for thread-safe access.
*   **Reactivity**: `use_state` makes state reactive. When the value changes, any `use_effect` or `rsx!` dynamic scope (`%state @if...` or `%state @for...`) that declared this `State` as a dependency will be re-evaluated.

## `use_effect`: Performing Side Effects

The `use_effect` hook allows you to perform side effects (e.g., logging, network requests, setting up event listeners) in response to state changes or component mounting.

### Basic Usage

```rust
use osui::prelude::*;
use std::sync::Arc;

#[component]
fn EffectExample(cx: &Arc<Context>) -> View {
    let count = use_state(0);
    let message = use_state("Initial message".to_string());

    // Effect 1: Logs when `count` changes
    use_effect(
        {
            let count = count.clone(); // Clone for the closure
            move || {
                println!("Effect 1: Count changed to {}", count.get_dl());
            }
        },
        &[&count], // Dependencies: &[&dyn HookDependency]
    );

    // Effect 2: Logs when `message` changes (and also on initial render)
    use_effect(
        {
            let message = message.clone();
            move || {
                println!("Effect 2: Message is now '{}'", message.get_dl());
            }
        },
        &[&message], // Dependencies: &[&dyn HookDependency]
    );

    // Simulate state changes (e.g., from user input or timers)
    let _ = {
        let count = count.clone();
        let message = message.clone();
        std::thread::spawn(move || {
            sleep(500); // Wait 0.5 seconds
            *count.get() += 1; // Triggers Effect 1
            sleep(500);
            message.set("Updated message!".to_string()); // Triggers Effect 2
            sleep(500);
            *count.get() += 1; // Triggers Effect 1 again
        });
    };

    rsx! {
        format!("Count: {}", count.get_dl())
        format!("Message: {}", message.get_dl())
    }.view(&cx)
}

pub fn main() {
    let engine = Console::new();
    engine.run(EffectExample {}).expect("Failed to run EffectExample app");
}
```

### `use_effect` Parameters:

1.  **`f: F`**: A closure (`FnMut() + Send + Sync + 'static`) that represents the side effect. This closure will be executed when any of its dependencies change. The closure is run in a separate spawned thread to avoid blocking the main rendering loop.
2.  **`dependencies: &[&dyn HookDependency]`**: A slice of references to objects that implement the `HookDependency` trait. These are typically `State<T>` instances. The effect closure will be called whenever any of these dependencies notify an update.

### Understanding Dependencies:

*   **Empty Dependency List (`&[]`)**: If you pass an empty slice (`&[]`), the effect will only run once when the component is first mounted. This is useful for setup logic like initializing global resources or subscriptions.
*   **Specific Dependencies**: When you list `State` objects as dependencies, the effect will run:
    *   Once, immediately when `use_effect` is called (during the initial component render).
    *   Again, whenever any of the listed `State` objects trigger an update.
*   **`HookDependency` Trait**: This trait defines how an object can register an `HookEffect` to be called upon update. `State<T>` and `Mount` both implement this trait, making them usable as dependencies.

## Lifecycle Hooks: `use_mount` and `use_mount_manual`

These hooks are special cases of `use_effect` for managing actions tied to a component's "mounting" lifecycle.

*   **`use_mount()`**: Returns a `Mount` instance that automatically calls `mount()` immediately upon its creation. Effects registered with this `Mount` instance will run once when the component is first rendered.
*   **`use_mount_manual()`**: Returns a `Mount` instance that starts in an unmounted state. Effects registered with it will *only* run when you explicitly call `mount_instance.mount()`. This is useful for controlling the mount event from specific `rsx!` nodes (`!mount_instance`) or from other logic.

```rust
use osui::prelude::*;
use std::sync::Arc;

#[component]
fn LifecycleExample(cx: &Arc<Context>) -> View {
    let mount_hook = use_mount(); // Automatically mounted
    let manual_mount_hook = use_mount_manual(); // Manual mount needed

    use_effect(
        move || {
            println!("Component mounted (automatic hook)!");
        },
        &[&mount_hook],
    );

    use_effect(
        move || {
            println!("Component manually mounted!");
        },
        &[&manual_mount_hook],
    );

    rsx! {
        "Lifecycle example"
        // This will trigger the `manual_mount_hook`'s effects
        !manual_mount_hook
    }.view(&cx)
}

pub fn main() {
    let engine = Console::new();
    engine.run(LifecycleExample {}).expect("Failed to run LifecycleExample app");
}
```

This guide has laid the foundation for managing state and side effects in your OSUI applications. By mastering `use_state` and `use_effect`, you can build sophisticated and responsive TUI experiences.

**Next:** Learn how to handle user interactions and other events with OSUI's [Event Handling system](./03-event-handling.md).
