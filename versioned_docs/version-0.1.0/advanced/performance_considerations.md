# Performance Considerations

Building performant Terminal User Interfaces (TUIs) requires careful attention, as direct terminal manipulation can be slower than native graphical UIs. OSUI is designed with performance in mind, offering mechanisms to optimize rendering and reactivity.

## 1. `DynWidget` vs. `StaticWidget`

This is perhaps the most crucial performance decision in OSUI.

*   **`StaticWidget`**:
    *   **Creation**: The `Element` instance is created only *once* when the widget is initially loaded.
    *   **Rendering**: During each `Screen::render()` cycle, the `Element::render` and `Element::after_render` methods are called directly on the existing `Element` instance. The `Element`'s internal state (if any) is mutated directly.
    *   **Overhead**: Minimal. No re-allocation or re-evaluation of closures per frame.
    *   **When to Use**: For any part of your UI that does not change its fundamental structure or the type of its root `Element` instance. This includes static text, fixed layouts, or elements whose internal state changes but doesn't require a full rebuild of the `Element` itself.
    *   **In `rsx!`**: Use the `static` keyword: `static Div { "Hello" }`.

*   **`DynWidget`**:
    *   **Creation**: Holds a closure (`FnMut() -> WidgetLoad`) that *rebuilds* the `Element` and its initial components whenever `refresh()` is called.
    *   **Rendering**: During `Screen::render()`, if `auto_refresh()` determines that a dependency has changed, the widget's internal `Element` is entirely replaced by re-executing the creation closure. Then, the `render` methods are called on this *new* `Element` instance.
    *   **Overhead**: Higher. Involves re-allocations for the new `Element` and `HashMap` of components, plus the cost of re-evaluating the closure and potentially re-parsing text for elements like `format!()` strings.
    *   **When to Use**: For parts of your UI that *must* change their `Element` type, or whose content is deeply tied to reactive `State` that necessitates a full rebuild to reflect changes. Use it for dynamic text, lists that grow/shrink, or components that switch between different visual representations.
    *   **In `rsx!`**: Default behavior or using `%dependency`: `%my_state Div { "Count: {my_state}" }`.

**Recommendation**: Favor `static` widgets whenever possible. Break down your UI into the smallest possible `DynWidget`s to isolate reactive updates and minimize the scope of re-renders.

## 2. `State<T>` Usage and Granularity

OSUI's `State<T>` is efficient for simple values, but consider its implications for larger data structures.

*   **Modification Cost**: When `**my_state.get() = ...` or `my_state.set(...)` is called, it marks `inner.changed = inner.dependencies`. This means *all* `DynWidget`s listening to that specific `State<T>` will be rebuilt on the next `auto_refresh` cycle.
*   **Large `State` Objects**: If `T` in `State<T>` is a large struct or `Vec`, and you only modify a small part of it, the entire `DynWidget` (and its children) listening to it will still rebuild.
*   **Optimization**:
    *   **Splitting State**: If a complex data structure has independent parts that change, consider splitting it into multiple `State` objects.
        ```rust
        // Instead of:
        struct UserProfile { name: String, email: String, settings: Settings }
        let profile = use_state(UserProfile { /* ... */ });
        // And updating `profile.get().name = ...` which rebuilds everything.

        // Consider:
        let user_name = use_state(String::new());
        let user_email = use_state(String::new());
        let user_settings = use_state(Settings::new());
        // Then, only widgets depending on `user_name` re-render when `user_name` changes.
        ```
    *   **Smart `Element` Implementations**: For complex data, a custom `Element` can internally manage its own `State` and handle partial updates without requiring a full rebuild of the `Element` itself. For instance, an `Element` could hold a `State<Vec<Item>>` and only re-render the changed `Item`s internally, or update specific `Widget` children based on diffing logic, rather than relying on `DynWidget` to rebuild the entire `Element`.

## 3. Terminal I/O Overhead

Every character printed to the terminal, especially with color or cursor positioning, incurs overhead due to ANSI escape code processing and actual screen updates by the terminal emulator.

*   **Full Screen Clear**: `utils::clear()` (used by `Screen::render`) clears the entire screen. This is a common TUI practice to avoid artifacts but is also a performance bottleneck for very high frame rates or remote connections. OSUI currently performs a full clear every frame.
*   **Minimize Redraws**: OSUI's reactive system already helps minimize *what* is rebuilt, but the `RenderScope` then draws the *entire* content of each widget. Terminal emulators often optimize partial updates, but minimizing the total area of change is always beneficial.
*   **Batching**: `RenderScope` implicitly batches drawing commands before `draw()` is called. Avoid manual, unbuffered `print!` calls in tight loops.

## 4. Expensive Operations in `Element::render` or `FnMut() -> WidgetLoad` Closures

*   **Avoid Heavy Computation**: Do not perform computationally intensive tasks (e.g., complex data processing, network requests, large file I/O) directly within `Element::render` or the `FnMut() -> WidgetLoad` closure of a `DynWidget`. These are called frequently (every frame for `render`, or every dependency change for the closure).
*   **Offload**: If such operations are necessary, offload them to separate `std::thread::spawn` threads or use asynchronous runtime if your application supports it. Update `State<T>` from these background threads, and your UI will react.

    ```rust
    // BAD (expensive in render/build closure):
    // rsx! { Div { format!("Result: {}", expensive_computation()) } }

    // GOOD:
    let computation_result = use_state("Calculating...".to_string());
    std::thread::spawn({
        let computation_result = computation_result.clone();
        move || {
            let result = expensive_computation(); // Runs in background
            computation_result.set(format!("Result: {}", result)); // Updates state, triggers UI refresh
        }
    });
    rsx! {
        %computation_result
        Div { "{computation_result}" }
    }
    ```

## 5. `Mutex` Contention

OSUI uses `Mutex`es extensively (`Arc<Mutex<T>>`) for thread-safe access to widgets, elements, components, and state.

*   **Minimize Lock Duration**: When you call `my_state.get()` or `widget.get_elem()`, you acquire a `MutexGuard`. Keep the duration for which you hold this lock as short as possible. Perform your read/write operation, then `drop` the guard or let it go out of scope quickly.
*   **Avoid Nested Locks**: Do not acquire a `Mutex` lock and then, while holding it, try to acquire another `Mutex` that could be held by a different thread trying to acquire your first lock. This leads to deadlocks. `State::get_dl()` is useful for avoiding this, as it releases the lock immediately after cloning.

By being mindful of these performance considerations, you can ensure your OSUI applications are responsive and efficient, even when handling complex UIs or frequent updates.



