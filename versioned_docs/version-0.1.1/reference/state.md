# `osui::state`

The `state` module provides OSUI's built-in reactivity system, allowing widgets to automatically update when their associated data changes. This is achieved through the `State<T>` struct and the `DependencyHandler` trait.

## `DependencyHandler` Trait

A trait for types that can signal changes, triggering reactive updates in `DynWidget`s. `State<T>` is the primary implementer.

```rust
pub trait DependencyHandler: std::fmt::Debug + Send + Sync {
    /// Called when a dependent widget registers itself with this dependency.
    /// This typically increments an internal counter of dependents.
    fn add(&self);

    /// Returns `true` if the state has changed since the last `check()`.
    /// If `true`, it typically "consumes" one change notification.
    fn check(&self) -> bool;
}
```

## `State<T>`

`State<T>` is a reactive data container. It wraps a value of type `T` and provides methods to get/set the value and signal changes to dependent widgets.

```rust
#[derive(Debug, Clone)]
pub struct State<T> {
    inner: Arc<Mutex<Inner<T>>>,
}

#[derive(Debug)]
pub struct Inner<T> {
    value: T,
    dependencies: usize, // Count of widgets depending on this state
    changed: usize,      // Count of pending changes to be processed by dependents
}
```

### Associated Functions

#### `use_state<T>(v: T) -> State<T>`
Creates a new `State<T>` instance, initialized with the provided value `v`.
This is the recommended way to create reactive state variables.

**Arguments:**
*   `v`: The initial value for the state.

**Returns:**
A new `State<T>` instance.

**Example:**
```rust
use osui::prelude::*;
let my_counter = use_state(0);
let my_text = use_state(String::from("Initial Text"));
```

### Associated Methods

#### `State::get_dl(&self) -> T`
Returns a cloned copy of the inner value `T`.
This method is recommended for preventing potential deadlocks if you only need to read the value and don't need to hold a lock for extended periods. It does *not* mark the state as changed.

**Returns:**
A `T` (clone of the inner value).

**Example:**
```rust
use osui::prelude::*;
let my_state = use_state(42);
let value = my_state.get_dl(); // value is 42
```

#### `State::get(&self) -> MutexGuard<'_, Inner<T>>`
Acquires a `MutexGuard` for the inner `Inner<T>` struct, providing mutable (or immutable) access to the `value` within `Inner<T>`.
This method *will* block if another thread or part of the application is currently holding the lock.

**Returns:**
A `MutexGuard` that dereferences to `Inner<T>`. Since `Inner<T>` implements `Deref` and `DerefMut` for `T`, you can often treat `state.get()` as a direct reference to `T`.

**Example (modifying value and marking as changed):**
```rust
use osui::prelude::*;
let my_state = use_state(0);
{
    let mut inner_guard = my_state.get(); // Acquire lock
    *inner_guard += 1; // Modify value using DerefMut; automatically marks as changed
} // Lock is released here
```

#### `State::set(&self, v: T)`
Sets the inner value of the state to `v` and explicitly marks it as changed.
This is an alternative to acquiring a `get()` lock and reassigning.

**Arguments:**
*   `v`: The new value for the state.

**Example:**
```rust
use osui::prelude::*;
let my_state = use_state("hello".to_string());
my_state.set("world".to_string()); // State is updated and marked changed
```

#### `State::update(&self)`
Explicitly marks the state as updated without changing its value.
This is useful if you've modified the inner `T` through a method that doesn't trigger `DerefMut` on `Inner<T>` (e.g., if `T` is a complex mutable struct and you called a method on it while holding the `MutexGuard` without reassigning the `T` itself).

**Example:**
```rust
use osui::prelude::*;
#[derive(Debug, Clone)]
struct MyData { count: i32 }
let my_data_state = use_state(MyData { count: 0 });
{
    let mut data_guard = my_data_state.get();
    data_guard.count += 1; // Directly modify field within the guard
}
my_data_state.update(); // Manually signal that the state has changed
```

### Implementations

#### `impl<T: Debug + Send + Sync> DependencyHandler for State<T>`
`State<T>` implements `DependencyHandler`.
*   `add()`: Increments `inner.dependencies`.
*   `check()`: Returns `true` if `inner.changed > 0`, then decrements `inner.changed`. This ensures each dependent consumes one change notification.

#### `impl<T: Display> Display for State<T>`
`State<T>` implements `Display`, allowing it to be formatted directly (e.g., in `format!` strings or debug output), by displaying its inner `value`.

**Example:**
```rust
use osui::prelude::*;
let count = use_state(10);
println!("Current count: {}", count); // Output: "Current count: 10"
```

#### `impl<T> Deref for Inner<T>`
Allows immutable dereferencing of `Inner<T>` to `T`.
This means `state.get().value` can be simply `*state.get()`.

#### `impl<T> DerefMut for Inner<T>`
Allows mutable dereferencing of `Inner<T>` to `T`.
Crucially, when this is used, the `changed` counter within `Inner<T>` is set to `dependencies`, marking the state as changed for all its dependents.
This means `*state.get() = new_value;` will trigger the change notification.
