markdown
---
sidebar_position: 4
title: Lifecycle Hooks
---

# Lifecycle Hooks

In OSUI, components have a lifecycle, meaning they go through various stages from creation to destruction. While OSUI doesn't expose a full set of lifecycle methods like some frameworks, it provides powerful hooks for managing effects related to a component's "mounting" phase: `use_mount` and `use_mount_manual`. These are special applications of the `use_effect` hook, designed for setup logic.

## The "Mounted" Concept

A component is considered "mounted" when it has been rendered for the first time and is part of the active component tree. Lifecycle hooks allow you to run code precisely at this point.

## `use_mount()`: Automatic Mounting

The `use_mount()` hook provides a `Mount` instance that is automatically marked as "mounted" upon its creation. Any `use_effect` that depends on this `Mount` instance will execute its effect closure immediately when the component renders.

### When to use `use_mount()`:

*   **Initial Setup**: Performing actions that should only happen once when the component first appears on screen, such as fetching initial data, setting up global event listeners, or initializing complex external resources.
*   **No Cleanup Required**: For effects that don't require any cleanup logic. If cleanup is needed, ensure your effect closure handles it or consider using `use_effect` with an empty dependency array (which is similar in behavior for initial execution, but offers more control over subsequent runs if dependencies are added).

### Example: Initial Data Fetch

```rust
use osui::prelude::*;
use std::sync::Arc;
use std::time::Duration;

// Simulate a data fetching operation
async fn fetch_data_async() -> String {
    // In a real application, this would be an actual network request or disk read.
    tokio::time::sleep(Duration::from_secs(1)).await; // Simulate network delay
    "Data loaded successfully!".to_string()
}

#[component]
fn DataLoader(cx: &Arc<Context>) -> View {
    let data_state = use_state("Loading data...".to_string());
    let mount_hook = use_mount(); // Automatically initializes as "mounted"

    // Use `use_effect` with `mount_hook` as a dependency
    use_effect(
        {
            let data_state = data_state.clone();
            move || {
                // This effect runs once when `mount_hook` is initialized (component mounts)
                println!("DataLoader: Component mounted, starting data fetch...");
                // Spawn a new async task (requires a runtime like tokio)
                tokio::spawn(async move {
                    let data = fetch_data_async().await;
                    data_state.set(data); // Update state, triggering re-render
                    println!("DataLoader: Data fetch complete.");
                });
            }
        },
        &[&mount_hook], // Effect runs when `mount_hook` updates (i.e., on mount)
    );

    rsx! {
        format!("Status: {}", data_state.get_dl())
    }.view(&cx)
}

#[component]
fn App(cx: &Arc<Context>) -> View {
    rsx! {
        DataLoader {}
    }.view(&cx)
}

pub fn main() {
    // For async operations, you need a runtime like tokio.
    // Add `tokio = { version = "1", features = ["full"] }` to your Cargo.toml
    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(async {
            let engine = Console::new();
            engine.run(App {}).expect("Failed to run async app");
        });
}
```

## `use_mount_manual()`: Explicit Mounting

The `use_mount_manual()` hook provides a `Mount` instance that starts in an "unmounted" state. Its associated `use_effect` callbacks will *not* run until you explicitly call the `mount()` method on that specific `Mount` instance. This offers finer control over when initial setup logic executes.

### When to use `use_mount_manual()`:

*   **Conditional Mounting**: When you want to delay the "mount" logic until a specific condition is met or an interaction occurs.
*   **`rsx!`-driven Mounting**: You can trigger the `mount()` method directly from your `rsx!` template using the `!mount_hook_instance` syntax. This is useful if the mount event is tied to the presence of a specific element or a complex rendering path.

### Example: Delayed Mount with `rsx!`

```rust
use osui::prelude::*;
use std::sync::Arc;

#[component]
fn DelayedSetup(cx: &Arc<Context>) -> View {
    let setup_status = use_state("Waiting for manual mount...".to_string());
    let manual_mount_hook = use_mount_manual(); // Starts unmounted

    use_effect(
        {
            let setup_status = setup_status.clone();
            move || {
                // This effect will only run when `manual_mount_hook.mount()` is called.
                println!("DelayedSetup: Manual mount triggered, performing setup!");
                setup_status.set("Setup complete!".to_string());
            }
        },
        &[&manual_mount_hook], // Depends on the manual mount hook
    );

    rsx! {
        format!("Status: {}", setup_status.get_dl())
        // The `!manual_mount_hook` in RSX triggers `manual_mount_hook.mount()`
        // which then causes the `use_effect` to run.
        !manual_mount_hook
        "This component is now mounted."
    }.view(&cx)
}

#[component]
fn App(cx: &Arc<Context>) -> View {
    rsx! {
        DelayedSetup {}
    }.view(&cx)
}

pub fn main() {
    let engine = Console::new();
    engine.run(App {}).expect("Failed to run delayed mount app");
}
```

In this example, the "Setup complete!" message will appear only after the `!manual_mount_hook` line is processed by the `rsx!` renderer, explicitly calling `mount_hook.mount()`.

## Summary of Lifecycle Hooks

*   `use_mount()`: For effects that should run once immediately when the component is initially rendered.
*   `use_mount_manual()`: For effects that you want to explicitly control when they run, either through programmatic calls to `.mount()` or via the `!mount_hook_instance` syntax in `rsx!`.

These hooks, combined with `use_effect`, give you fine-grained control over when side effects are performed during your component's lifetime.

**Next:** Understand how to synchronize component state with events for sophisticated data flow patterns in [Data Flow and Sync](./05-data-flow-and-sync.md).
