---
title: State Management
slug: /state
---

OSUI has builtin state management, the `State<T>` type is easy to use. A `State<T>` makes dependencies reload if the state is updated.

## Example

A counter app that increments every 100 milliseconds

```rust src/main.rs
use osui::prelude::*;

fn main() -> std::io::Result<()> {
    let screen = Screen::new();
    let count = use_state(0);

    rsx! {
        %count // Dependency of count
        "Count: {count}"
    }
    .draw(&screen);

    std::thread::spawn(move || loop {
        **count.get() += 1;
        std::thread::sleep(std::time::Duration::from_millis(100));
    });

    screen.run()
}
```

## `use_state<T>(v: T) -> State<T>`

Returns a State of T with the specified default value.

## `State<T>`

A smart pointer that is wrapped around a `Arc<Mutex<T>>` and manages the state of the holding value, any changes will result in the dependencies reloading, making a smart and efficient approach instead of reloading the whole thing.

### `get(&self) -> MutexGuard<'_, Inner<T>>`

Gets a lock on the state for read/write access.

### `set(&self, v: T)`

Sets the value and marks it as updated.

### `update(&self)`

Marks the state as updated.

## Trait `DependencyHandler`

The `DependencyHandler` trait is a state management trait that will reload dependencies if the values are true

### `fn add(&self)`

Called when a dependency is added, for incrementing a dependency counter.

### `check(&self) -> bool`

Should return if the dependencies need to reload, if `true` the dependencies will reload, called after render.
