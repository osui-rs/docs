markdown
---
sidebar_position: 2
title: Reactive State Flow
---

# Reactive State Flow

OSUI's reactivity model is designed to efficiently update the UI in response to changes in application data. It centers around `State<T>`, `HookDependency`, and `use_effect`, forming a flow where data changes automatically trigger re-rendering of affected components.

## 1. `State<T>`: The Source of Truth

At the heart of reactivity is the `State<T>` type. When you declare state using `use_state(initial_value)`, you get a `State<T>` instance:

```rust
let count = use_state(0); // count: State<i32>
```

`State<T>` wraps your actual data `T` in an `Arc<Mutex<T>>`, allowing it to be safely shared and mutated across multiple threads and component scopes.

## 2. Updating `State<T>`

When the value held by `State<T>` changes, this initiates the reactive flow. There are two primary ways to update `State<T>`:

*   **`state.set(new_value)`**: Replaces the entire value and explicitly triggers an update.
*   **`*state.get() = new_value`**: Acquires an `Inner<'_, T>` guard, which provides mutable access to the underlying value. When this `Inner` guard is dropped (goes out of scope), it automatically checks if the value was modified and, if so, triggers an update.

```rust
// Method 1: using .set()
count.set(count.get_dl() + 1);

// Method 2: using .get() for mutable access
{
    let mut count_guard = count.get(); // Acquire Inner guard
    *count_guard += 1; // Mutate the value
} // count_guard drops here, automatically triggering updates
```

## 3. `HookDependency`: Declaring Reactivity

For an update to `State<T>` to have an effect, there must be something "listening" for that update. This is where the `HookDependency` trait comes in:

```rust
pub trait HookDependency: Send + Sync {
    fn on_update(&self, hook: HookEffect);
}
```

*   `State<T>` implements `HookDependency`. This means you can register an `HookEffect` with a `State<T>` instance, and `State<T>` will ensure that effect is called whenever its value changes.
*   `Mount` also implements `HookDependency` for managing component lifecycle effects.

## 4. `HookEffect`: The Callback

An `HookEffect` is essentially a wrapper around a closure (`Arc<Mutex<dyn FnMut() + Send + Sync>>`) that represents a side effect. When a `HookDependency` updates, it calls all registered `HookEffect`s.

```rust
// An effect might look something like this internally:
let my_effect = HookEffect::new(move || {
    // This code runs when the dependency updates
    println!("Dependency changed!");
});
```

## 5. `use_effect` and Dynamic `rsx!` Blocks: Consuming Reactivity

The `HookDependency` and `HookEffect` mechanism is consumed by two main features to enable reactive UI updates:

### a) `use_effect` Hook

`use_effect` allows you to run side effects when specified dependencies change:

```rust
use_effect(
    {
        let count = count.clone(); // Clone State handle for closure
        move || {
            // This closure runs in a spawned thread when `count` updates
            println!("Count is now: {}", count.get_dl());
        }
    },
    &[&count], // `count` is the dependency
);
```

When `use_effect` is first called, it registers its internal `HookEffect` closure with each `HookDependency` in the provided slice. Each time `count` is updated, `count` calls its registered `HookEffect`, which then executes the provided closure.

### b) Dynamic `rsx!` Blocks (`%dep @if ...`, `%dep @for ...`)

OSUI's `rsx!` macro supports special syntax for dynamic UI segments that automatically re-render when dependencies change:

```rust
rsx! {
    %count @if *count.get() > 0 { // This block re-renders if `count` changes
        format!("Count is positive: {}", count.get_dl())
    }
    %items @for item in items.get_dl() { // This block re-renders if `items` changes
        format!("- {}", item)
    }
}
```

*   When the `rsx!` macro encounters `%dep`, it also registers a special internal `HookEffect` with that dependency.
*   This `HookEffect` is responsible for re-evaluating the entire `dynamic_scope` (the `if` or `for` block) within the component's `Context`. This re-evaluation re-runs the `rsx!` logic for that block, generating potentially new children or text nodes, and thus updating the UI.

## The Reactive Flow in Summary

1.  A component uses `use_state` to create a `State<T>`.
2.  The `State<T>` is passed as a dependency to `use_effect` or declared in a dynamic `rsx!` block (`%state`).
3.  When `State<T>`'s value is modified (`set()` or `get()` then drop), it triggers its registered `HookEffect`s.
4.  These `HookEffect`s then either execute a side-effect closure (from `use_effect`) or trigger a re-evaluation of the corresponding `dynamic_scope` (from `rsx!`).
5.  Re-evaluation of `dynamic_scope` leads to updated `DrawInstruction`s, which the `Engine` eventually renders to the terminal.

This elegant system ensures that your UI remains synchronized with your application's data, responding efficiently and predictably to changes, minimizing manual re-rendering logic.

**Next:** Understand how events traverse the component tree in [Event Propagation](./03-event-propagation.md).
