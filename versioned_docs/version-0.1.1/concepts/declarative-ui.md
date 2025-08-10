# Declarative UI and the `rsx!` Macro

OSUI embraces a declarative approach to UI development, heavily inspired by modern web frameworks. This is primarily facilitated by the `rsx!` macro, which allows you to describe your UI's structure and behavior in a clear, nested, and expressive way.

## Why Declarative UI?

Traditional imperative UI development involves manually creating, positioning, and updating UI elements based on state changes. This can lead to complex, hard-to-maintain code, especially for dynamic UIs.

Declarative UI, in contrast:

*   **Focuses on "What"**: You describe the desired UI state for a given data state, rather than the steps to get there.
*   **Simplicity**: The code is often more readable and easier to reason about, as it mirrors the visual structure of the UI.
*   **Reactivity**: When the underlying data changes, the framework (OSUI, in this case) efficiently updates the UI to reflect the new state, minimizing manual DOM manipulation.
*   **Composition**: Encourages breaking down complex UIs into smaller, reusable components.

## The `rsx!` Macro

The `rsx!` macro is the cornerstone of OSUI's declarative syntax. It transforms a nested, JSX-like structure into a tree of `RsxElement`s, which are then used to build `Widget`s on the `Screen`.

### Basic Syntax

```rust
use osui::prelude::*;

fn main() -> std::io::Result<()> {
    let screen = Screen::new();
    screen.extension(InputExtension); // Needed for basic interaction

    rsx! {
        // Simple text string as an Element
        "Hello, World!"

        // Static element: No dynamic dependencies or state
        static Div {
            // Nested content
            "This is a static div."
        }

        // Dynamic element: Reacts to state changes
        %my_state // This widget depends on `my_state`
        Div {
            // Content can be interpolated from state
            "Current value: {my_state}"
        }
    }.draw(&screen);

    screen.run()?;
    Ok(())
}
```

### Key Features of `rsx!` Syntax

1.  **Direct Text**:
    Any string literal within `rsx!` is treated as a `String` element.
    ```rust
    rsx! {
        "Just some text."
        format!("Dynamic text: {}", 123) // You can also use format!
    }
    ```

2.  **Element Declaration**:
    Elements are typically declared by their struct name (e.g., `Div`, `FlexRow`, `Input`).
    ```rust
    rsx! {
        Div {} // A simple Div element
    }
    ```

3.  **Properties (Fields)**:
    You can set public fields on the element struct directly using comma-separated key-value pairs, similar to struct instantiation.
    ```rust
    rsx! {
        Heading, smooth: true, { "Important Title" } // Sets the `smooth` field on Heading
    }
    ```
    This expands to:
    ```rust
    let mut elem = Heading::new();
    elem.smooth = true;
    // ... then `elem` is wrapped in a Widget
    ```

4.  **Children**:
    Content nested within curly braces `{}` after an element forms its children. These children are then drawn by the parent element's `after_render` method.
    ```rust
    rsx! {
        Div {
            "First child"
            "Second child"
            FlexRow { "Nested FlexRow" }
        }
    }
    ```

5.  **Static vs. Dynamic Widgets**:
    *   **`static` keyword**: Prefix an element with `static` to explicitly declare it as a `StaticWidget`. This means its content and components won't change unless manually modified elsewhere. It incurs no dependency tracking overhead.
        ```rust
        rsx! {
            static Div { "Always the same" }
        }
        ```
    *   **Dynamic (Reactive)**: By default, if an element has dependencies (see below) or is just a string literal without `static`, it becomes a `DynWidget`. This allows it to refresh when its dependencies change.

6.  **Dependencies (`%dep_name`)**:
    Prefixing an element with `%variable_name` registers `variable_name` (which must implement `DependencyHandler`, like `State<T>`) as a dependency for that widget. If `variable_name` signals a change, the widget will automatically rebuild and re-render.
    ```rust
    let counter = use_state(0);
    rsx! {
        %counter // This Div depends on `counter`
        Div {
            // `counter` can be used directly in its content
            "Count: {counter}"
        }
    }
    ```
    Multiple dependencies can be listed: `%dep1 %dep2 Element {}`.

7.  **Components (`@ComponentType`)**:
    Attach components to an element using the `@` symbol followed by the component's type and its constructor or a value.
    ```rust
    use osui::prelude::*;

    rsx! {
        // Attach a Transform component with specific dimensions
        @Transform::new().dimensions(10, 5);
        // Attach a Style component with a solid red background
        @Style { background: Background::Solid(0xFF0000) };
        Div {
            "A red box"
        }

        // Attach a custom Handler component for events
        @Handler::new(|_, e: &MyEvent| { /* ... */ });
        Div { "Click me!" }
    }
    ```
    You can attach multiple components to the same element, each on its own `@` line.

8.  **Macro Expansion (`$expand => ($args)`)**:
    You can include the output of another `Rsx`-generating function or macro using `macro_name => (args)`. This is useful for creating reusable UI fragments.
    ```rust
    fn my_button(text: &str) -> Rsx {
        rsx! {
            Div { format!("Button: {}", text) }
        }
    }

    rsx! {
        my_button => ("Click Me")
        my_button => ("Another Button")
    }
    ```

### How `rsx!` Works Internally

The `rsx!` macro recursively expands into a series of `Rsx::create_element` or `Rsx::create_element_static` calls. Each `RsxElement` stores either a `StaticWidget` directly or a closure that produces a `WidgetLoad` (for dynamic widgets), along with its dependencies and child `Rsx` tree.

When `Rsx::draw` or `Rsx::draw_parent` is called on the root `Rsx` object:

1.  It iterates through its `RsxElement`s.
2.  For `RsxElement::DynElement`, it calls the stored closure to generate a `WidgetLoad`, then creates a `DynWidget` via `screen.draw_box_dyn`. It registers all specified dependencies with this new `DynWidget`.
3.  For `RsxElement::Element`, it directly creates a `StaticWidget` via `screen.draw_widget`.
4.  If a parent widget is provided (for nested elements), it calls `parent.get_elem().draw_child(&new_widget)`. This informs the parent `Element` about its new child.
5.  It then recursively calls `draw_parent` on the child `Rsx` tree, passing the newly created widget as the `parent`.

This process builds the complete `Arc<Widget>` tree managed by the `Screen`, setting up the initial hierarchy and reactive dependencies. The declarative `rsx!` syntax simplifies this complex creation process into an intuitive structure.
