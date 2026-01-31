markdown
---
sidebar_position: 0
title: Creating Components
---

# Creating Components

Components are the building blocks of any OSUI application. They encapsulate UI logic, state, and rendering instructions, making your code modular and reusable. This guide explains how to define and use components effectively.

## The `#[component]` Attribute

OSUI uses the `#[component]` procedural macro to transform a regular Rust function into an OSUI component. This macro handles the boilerplate necessary for prop handling and integrating the function into the component tree.

### Basic Structure

A component function generally looks like this:

```rust
use osui::prelude::*;
use std::sync::Arc;

#[component]
pub fn MyComponent(cx: &Arc<Context>) -> View {
    // Component logic goes here
    rsx! {
        "Hello from MyComponent!"
    }.view(&cx)
}
```

**Key requirements:**

1.  **`#[component]`**: Always annotate your component function with this attribute.
2.  **Function Signature**:
    *   It must take `cx: &Arc<Context>` as its *first* argument. The `Context` is essential for managing state, events, and child components.
    *   It must return a `View`. A `View` is an `Arc<dyn Fn(&mut DrawContext) + Send + Sync>`, essentially a closure that contains the drawing instructions for your component.
3.  **Return Value**: The most common way to return a `View` is by using the `rsx!` macro followed by `.view(&cx)`.

### Component Props

Components become truly powerful when they can receive data from their parents. These are called "props" (properties). To define props for your component, simply add more parameters to your component function after `cx: &Arc<Context>`.

OSUI's `#[component]` macro automatically generates a struct for your component based on these parameters.

```rust
use osui::prelude::*;
use std::sync::Arc;

#[component]
pub fn GreetUser(cx: &Arc<Context>, name: &str, age: &u8) -> View {
    // Access props directly by their parameter names
    rsx! {
        format!("Hello, {}! You are {} years old.", name, age)
    }.view(&cx)
}

#[component]
pub fn App(cx: &Arc<Context>) -> View {
    let user_name = "Alice".to_string();
    let user_age = 30;

    rsx! {
        // Instantiate GreetUser and pass props
        GreetUser {
            name: user_name, // Prop name matches the parameter name
            age: user_age,
        }
    }.view(&cx)
}
```

**Prop Rules:**

*   **Parameter Names**: The names of your function parameters (e.g., `name`, `age`) become the names of the props you use when instantiating the component in `rsx!`.
*   **Reference Types**: Props are typically passed as references (e.g., `&str`, `&u8`). The `#[component]` macro automatically "strips" the reference when generating the internal component struct, storing the owned type. This means you don't need to manually clone values unless you intend to move them into a closure or `State`.
*   **`children` Prop**: As seen in the [previous guide](../intro/03-example-basic-component.md), any content nested inside a component's `rsx!` invocation is implicitly passed as a `children: &Rsx` prop. This allows for flexible content composition.

### Example: Component with `children` and custom props

```rust
use osui::prelude::*;
use std::sync::Arc;

#[component]
pub fn Card(cx: &Arc<Context>, title: &str, children: &Rsx) -> View {
    rsx! {
        format!("--- {} ---", title) // Render the title prop
        @{children}                  // Render the children passed to Card
        "----------------"
    }.view(&cx)
}

#[component]
pub fn App(cx: &Arc<Context>) -> View {
    rsx! {
        Card {
            title: "My Awesome Card", // Pass a custom prop
            // The content below is passed as the `children` prop
            rsx! {
                "This is the content inside the card."
                "It can span multiple lines or include other components."
            }
        }
        Card {
            title: "Another Card",
            "Just some simple text here." // Even a single string literal can be children
        }
    }.view(&cx)
}
```

In this example, the `Card` component takes a `title` prop and a `children` prop. It renders the title, then its children, and finally a footer.

## When to Create a Component

*   **Reusability**: If you find yourself writing the same UI structure multiple times, extract it into a component.
*   **Separation of Concerns**: When a part of your UI has its own state or complex logic, it's a good candidate for a component.
*   **Readability**: Breaking down large `rsx!` blocks into smaller components improves the readability and maintainability of your code.
*   **Performance (Reactivity)**: Components, especially when using state hooks, allow OSUI to efficiently re-render only the parts of the UI that have changed.

By following these guidelines, you can build well-structured and scalable OSUI applications.

**Next:** Deep dive into the `rsx!` macro and its full capabilities in the [RSX Syntax Guide](./01-rsx-syntax.md).
