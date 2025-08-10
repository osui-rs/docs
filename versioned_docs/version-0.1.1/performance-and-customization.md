# Advanced Topics: Performance and Customization

This section covers more advanced aspects of OSUI, including performance considerations and how to further customize the library beyond basic usage.

## Performance Optimization

OSUI is designed to be efficient for terminal UIs, but there are always considerations to keep in mind:

1.  **`StaticWidget` vs. `DynWidget`**:
    *   **Prefer `static` elements for unchanging content**: If a part of your UI never changes (e.g., a fixed label, a decorative border), use the `static` keyword in `rsx!` or `Screen::draw` to create `StaticWidget`s. They have zero overhead for dependency tracking and re-evaluation.
    *   **Use `DynWidget` (implicit without `static`) only where reactivity is needed**: `DynWidget`s carry the overhead of checking dependencies and potentially rebuilding their `Element` and components every frame. While efficient, unnecessary `DynWidget`s can add up.

2.  **State Management (`State<T>`)**:
    *   **Granularity of State**: Try to keep state changes as granular as possible. If only a small part of your UI needs to react to a specific state, make only that minimal `DynWidget` depend on it, rather than a large parent widget. This limits the scope of re-evaluation.
    *   **Avoid Holding Locks**: When interacting with `State<T>`, acquire the `MutexGuard` via `state.get()` for the shortest possible duration. If you only need to read the value, consider `state.get_dl()` which clones the value and doesn't hold the lock, reducing potential for contention.

3.  **Extensions and Threads**:
    *   **Offload Blocking Operations**: As seen with `InputExtension` and `TickExtension`, blocking I/O operations (like reading input or `thread::sleep`) should ideally be performed in separate threads. This prevents the main rendering loop from stalling, ensuring a smooth and responsive UI.
    *   **Minimize Work in Hooks**: The `Extension` hooks (especially `render_widget` and `after_render_widget`) are called frequently, often for every widget every frame. Keep the logic within these hooks as lightweight as possible. For heavy computation, consider delegating to a separate thread and communicating results back via a `State` variable or an `Event`.

4.  **Terminal Redraws**:
    *   OSUI internally manages clearing and redrawing the necessary parts of the screen. However, complex UIs with many elements or frequent full-screen redraws can still be perceived as flickering or slow on some terminals.
    *   While not directly exposed as a user configurable option, OSUI's design aims to minimize redraws by only updating changed cells where possible, though the current implementation does a full clear and redraw each frame. This is a common pattern for many TUIs.

## Customization

### 1. Custom Elements

As detailed in [Creating Custom Widgets](/docs/guides/creating-custom-widgets), the primary way to customize OSUI is by implementing the `Element` trait. This allows you to define completely new visual components or logical containers tailored to your application.

### 2. Custom Components

Beyond the built-in `Transform` and `Style`, you can define any arbitrary data or behavior as a `Component` using the `component!` macro. This is invaluable for:

*   **Marker Traits**: Like `Focused` or `AlwaysFocused`, indicating a property without holding data.
*   **Behavioral Data**: Storing data related to a specific behavior, e.g., `Velocity(x, y)` for animation.
*   **Event Handling**: The `Handler<E>` component allows attaching event-specific logic directly to widgets.
*   **Custom Logic**: Storing state specific to a widget's custom behavior that isn't part of its core `Element` data.

### 3. Custom Extensions

The `Extension` trait provides the deepest level of customization by allowing you to inject global logic into the OSUI application lifecycle. Use extensions for:

*   **Global Event Handling**: Listening to all events across the UI.
*   **System Integrations**: Interacting with external systems (e.g., network, files, other libraries).
*   **Custom Layout Passes**: Implementing alternative or additional layout algorithms.
*   **Debugging Tools**: Injecting logging or visualization aids.
*   **Theming Systems**: Implementing a global theming system that dynamically adjusts widget styles.

### 4. `Cargo.toml` Profiles

The `Cargo.toml` provides specific build profiles that can be customized for performance and debugging.

```toml
[profile.dev]
opt-level = 1          # Optimization level for development builds. `1` is a good balance.
debug = true           # Include debug info.
debug-assertions = true # Enable runtime checks for debugging.
overflow-checks = true  # Enable integer overflow checks.
lto = false             # Link-time optimizations are off for faster compile times.
panic = 'unwind'        # Panic unwinds the stack.

[profile.release]
opt-level = "z"        # Optimize for size. Can also use `3` for max speed.
debug = false          # No debug info.
debug-assertions = false # No runtime checks.
overflow-checks = false  # No integer overflow checks.
lto = true               # Enable link-time optimizations for max performance.
panic = 'abort'          # Panic aborts the process immediately (can be faster).
codegen-units = 1        # Single codegen unit for max optimization (longer compile).
```

*   **`opt-level = "z"` in release**: This prioritizes binary size over raw speed. For TUI applications, small binary size can be desirable. You might change this to `opt-level = 3` for maximum performance, though the visual difference in most TUI apps might be negligible.
*   **`lto = true` in release**: Link-time optimizations can significantly improve runtime performance by allowing the compiler to optimize across crate boundaries. This comes at the cost of longer release build times.
*   **`panic = 'abort'` in release**: When a panic occurs in a release build, the program immediately terminates without unwinding the stack. This can sometimes lead to smaller binaries and slightly faster panic paths, but makes debugging panics harder. `panic = 'unwind'` (default for `dev`) is generally safer for debugging.

By understanding and leveraging these profiles, you can fine-tune the performance characteristics of your OSUI application.

### 5. `no_rsx` and `no_elem` Features

OSUI offers features that allow you to strip out parts of the library you don't use, primarily for reducing binary size if not for performance in all cases.

```toml
# Cargo.toml
[features]
no_rsx = []  # Disables the rsx! macro and its related frontend components.
no_elem = [] # Disables all built-in elements (Div, Flex, Input, etc.).
```

*   **`no_rsx`**: If you prefer to build your UI programmatically (using `Widget::new_static`, `Widget::new_dyn`, `WidgetLoad`, etc.) instead of the declarative `rsx!` macro, enabling this feature removes the `rsx!` macro and the `frontend` module. This can be useful for very small, custom-built applications or for library consumers who want to define their own UI construction layer.
*   **`no_elem`**: If you intend to implement all your UI elements from scratch (e.g., you only need `Element`, `Component`, `Screen`, and `Extension` traits), enabling this feature removes all the built-in elements like `Div`, `FlexRow`, `Input`, `Heading`, and `Paginator`. This can drastically reduce the binary size if your application is entirely custom.

**How to use features:**

In your `Cargo.toml`:

```toml
[dependencies]
osui = { version = "0.1.1", features = ["no_rsx"] } # Or ["no_elem"], or both
```

Or on the command line:

```bash
cargo build --features no_rsx
cargo run --release --features "no_rsx no_elem"
```

These features offer a fine-grained control over the final binary, allowing you to tailor OSUI to your exact needs and potentially reduce its footprint in constrained environments.
