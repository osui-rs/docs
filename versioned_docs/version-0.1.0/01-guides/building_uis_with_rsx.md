# Building UIs with RSX

OSUI leverages a declarative syntax, similar to JSX in web development, to define your UI elements. This is primarily facilitated by the `rsx!` macro. This guide explains how to use `rsx!` to construct your UI tree, manage properties, attach components, and handle reactive updates.

## The `rsx!` Macro: Declarative UI Definition

The `rsx!` macro provides a concise way to declare a hierarchy of UI elements. It processes a block of UI definitions and expands them into an `Rsx` object, which can then be drawn onto the `Screen`.

A basic `rsx!` block looks like this:

```rust
use osui::prelude::*;

fn my_ui_function(my_state: State<String>) -> Rsx {
    rsx! {
        // A simple string is treated as a text element
        "Hello, RSX!"

        // An element with properties and children
        Div {
            // Another text element
            "I am a child of the Div."
        }

        // A dynamic element with a state dependency
        %my_state
        Div {
            "Current state value: {my_state}"
        }
    }
}
```

### Basic Element Types

1.  **Text Literals**: A string literal directly within `rsx!` creates a simple text element. OSUI automatically converts `String` and `(String, u32)` (for colored text) into renderable `Element`s.

    ```rust
    rsx! {
        "This is plain text."
        ("This text is colored", 0xFF00FF) // Pink text
    }
    ```

2.  **Built-in Elements**: OSUI provides several pre-defined elements like `Div`, `FlexRow`, `FlexCol`, `Input`, `Paginator`, and `Heading`. You reference them by their struct name.

    ```rust
    rsx! {
        Div {
            "Content inside a div."
        }
        FlexCol, gap: 1, {
            "Item 1"
            "Item 2"
        }
    }
    ```

## Properties and Configuration

Elements can be configured by setting their public fields. This is done by listing the field names and their values after the element type, separated by commas.

```rust
rsx! {
    // Setting `gap` for FlexRow
    FlexRow, gap: 2, {
        "First item"
        "Second item"
    }

    // Setting `smooth` for Heading
    Heading, smooth: true, { "My Title" }
}
```

If an element has no properties to set, or you are using default values, you can omit the property list:

```rust
rsx! {
    Div { "No custom properties needed here." }
}
```

## Nesting Elements (Children)

Elements can contain other elements as children. This creates the UI tree. Children are defined within curly braces `{}` immediately following the element declaration.

```rust
rsx! {
    Div {
        "Parent Div"
        Div { // Nested Div
            "Child Div"
            "Another child"
        }
        FlexCol { // Another child, a FlexCol
            "Flex item 1"
            "Flex item 2"
        }
    }
}
```

## Attaching Components

Components are Rust structs that implement the `Component` trait. They can be attached to any widget to extend its behavior or provide additional data (like styling or transformation). In `rsx!`, components are attached using the `@` prefix.

```rust
use osui::prelude::*;

// Assume MyComponent is defined via `component!(MyComponent { /* ... */ });`
// and Transform and Style are imported from `osui::style`.

rsx! {
    // Attach a Transform component to control position/size
    @Transform::new().center().padding(1, 1);
    // Attach a Style component for background and foreground colors
    @Style { background: Background::Solid(0x333333), foreground: Some(0xFFFFFF) };
    Div {
        "This div is centered, padded, and has a dark background with white text."
    }

    // Attach a custom component
    @MyComponent { my_prop: "value".to_string() };
    Div {
        "This div has MyComponent attached."
    }
}
```

You can attach multiple components to a single element. They are applied in the order they are declared.

## Dynamic vs. Static Widgets

OSUI distinguishes between static and dynamic widgets for performance and reactivity.

### Static Widgets (`static` keyword)

A widget declared with the `static` keyword means that the root `Element` instance itself will be created only once. Its children, however, can still be dynamic. This is suitable for parts of your UI that do not change their fundamental structure or the root `Element` type.

```rust
rsx! {
    static Heading, smooth: true, { "Static Title" }
    static Div { "This div's root element is static." }
}
```

*   **When to use `static`**: For elements whose `Element` trait implementation doesn't change and doesn't depend on external reactive state to rebuild itself. This can include simple text, static containers, or complex elements whose internal state is managed purely by their own logic (not OSUI's `State` system).
*   **Performance**: Generally more performant as they avoid re-evaluating the element creation closure on every refresh cycle.

### Dynamic Widgets (Default)

By default, any element declared without `static` is considered dynamic. This means its creation closure (`FnMut() -> WidgetLoad`) will be re-evaluated whenever its declared dependencies change or when a manual `refresh()` is triggered.

```rust
use osui::prelude::*;

let my_counter = use_state(0);
rsx! {
    // This Div is dynamic because it depends on `my_counter`
    %my_counter
    Div {
        "Counter: {my_counter}"
    }
}
```

*   **When to use Dynamic**: For any element whose content or type changes based on reactive state or other external factors that necessitate a rebuild of the underlying `Element`.
*   **Reactivity**: Essential for building interactive UIs that respond to state changes.

## Reactive Updates with State (`%` prefix)

OSUI's reactivity system allows you to automatically re-render parts of your UI when specific `State` variables change. This is achieved by declaring a dependency using the `%` prefix followed by the state variable's identifier.

```rust
use osui::prelude::*;

fn main() -> std::io::Result<()> {
    let screen = Screen::new();
    screen.extension(InputExtension); // Needed for input to trigger updates

    let click_count = use_state(0);

    // Increment counter on any key press
    screen.draw_dyn({
        let click_count = click_count.clone();
        move || {
            WidgetLoad::new(String::new())
                .component(Handler::new(move |_, e: &crossterm::event::Event| {
                    if let crossterm::event::Event::Key(_) = e {
                        **click_count.get() += 1;
                    }
                }))
        }
    });

    rsx! {
        // This Div will re-render whenever `click_count` changes
        %click_count
        Div {
            "You have pressed a key {click_count} times."
        }
    }.draw(&screen);

    screen.run()
}
```

When `**click_count.get() += 1;` is called, it marks `click_count` as changed. During the next render cycle, any `DynWidget` (like our `Div` above) that declares `click_count` as a dependency will be automatically refreshed (rebuilt), reflecting the new value.

Multiple dependencies can be declared:

```rust
let state_a = use_state(0);
let state_b = use_state(false);

rsx! {
    %state_a %state_b
    Div {
        "A: {state_a}, B: {state_b}"
    }
}
```

The `rsx!` macro automatically clones the `Arc<State<T>>` for each declared dependency and passes it into the widget's creation closure, ensuring the closure can capture and use the state without ownership issues.

## Expanding RSX Blocks (`=>`)

You can compose `rsx!` blocks by calling a function that returns `Rsx` and using the `=>` operator. This is useful for breaking down complex UIs into smaller, manageable functions.

```rust
use osui::prelude::*;

fn my_header() -> Rsx {
    rsx! {
        Heading, smooth: true, { "My App" }
    }
}

fn my_content(data: State<String>) -> Rsx {
    rsx! {
        %data
        Div {
            "Data: {data}"
        }
    }
}

rsx! {
    my_header => () // Call my_header function to insert its elements
    my_content => (my_state_variable.clone()) // Pass arguments if needed
    Div { "Footer" }
}
```

The `rsx_inner!` macro, which `rsx!` expands to, handles the recursive insertion of `RsxElement`s from the called function.

## Summary

The `rsx!` macro is the cornerstone of building UIs in OSUI. By understanding how to define elements, set properties, attach components, and manage reactivity with `State`, you can construct powerful and interactive terminal applications with a clean and declarative syntax.



