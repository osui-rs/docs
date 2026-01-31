---
sidebar_position: 3
title: Basic Component with Children
---

# Basic Component with Children and Props

In OSUI, applications are built by composing smaller, reusable components. This guide expands on the "Hello World" example by demonstrating how to define a custom component, pass data to it (props), and render its children.

## 1. The `MyComponent` Example

Let's modify our `src/main.rs` to introduce `MyComponent`.

```rust title="src/main.rs"
use osui::prelude::*;
use std::sync::Arc;

pub fn main() {
    let engine = Console::new();
    engine.run(App {}).expect("Failed to run engine");
}

#[component]
fn App(cx: &Arc<Context>) -> View {
    rsx! {
        // Here, MyComponent is instantiated with a string literal as its child.
        // This string will be available inside MyComponent via the `children` prop.
        MyComponent { "------ example" }
    }
    .view(&cx)
}

#[component]
fn MyComponent(cx: &Arc<Context>, children: &Rsx) -> View {
    rsx! {
        // `@{children}` is an RSX expression that renders the children passed to MyComponent.
        // It's a special syntax to embed an `Rsx` value directly into the component's output.
        @{children}
        "Simple Component"
    }
    .view(&cx)
}
```

## 2. Run the Application

```bash
cargo run
```

You should see output similar to this:

```
------ example
Simple Component
```

The exact positioning will depend on your terminal's size and OSUI's default rendering behavior, but the text "------ example" (from the child) should appear before "Simple Component" (from `MyComponent` itself).

## Understanding the Component Pattern

### The `children` Prop

In OSUI, just like in React or other component-based frameworks, content nested inside a component's `rsx!` invocation is implicitly passed as `children`.

When you write:

```rust
rsx! {
    MyComponent { "------ example" }
}
```

The string literal `"------ example"` becomes the `children` prop for `MyComponent`.

### `MyComponent` Definition

Let's look at `MyComponent`'s definition:

```rust
#[component]
fn MyComponent(cx: &Arc<Context>, children: &Rsx) -> View {
    // ...
}
```

1.  **`#[component]`**: Marks `MyComponent` as a reusable component.
2.  **`cx: &Arc<Context>`**: The mandatory context parameter.
3.  **`children: &Rsx`**: This is where the magic happens. Any content passed as children within the `rsx!` invocation for `MyComponent` (like `"------ example"`) will be collected into an `Rsx` type and passed to this `children` prop. The `Rsx` type itself is a collection of renderable nodes.
4.  **`-> View`**: Components must return a `View`.

### Rendering Children with `@{children}`

Inside `MyComponent`'s `rsx!`:

```rust
rsx! {
    @{children} // Renders the content passed to MyComponent
    "Simple Component"
}
```

*   **`@{children}`**: This is an RSX expression. The `@{...}` syntax allows you to embed arbitrary Rust expressions directly into your `rsx!` output. In this case, `children` is an `&Rsx` value which implements `ToRsx`, making it eligible to be directly rendered as part of the component's output. When `children` is rendered, it generates its own `View`, effectively embedding the child content into the parent component's render tree.
*   **`"Simple Component"`**: This is a direct text literal within `MyComponent`'s own output, rendered after the children.

This pattern allows you to build highly flexible and composable components, where parents can define the overall structure and layout, while children provide specific content.

## Next Steps

You've seen how to define components and pass basic children. The next step is to explore the full power of OSUI's RSX syntax, including how to pass other types of props, use conditional rendering, and loop through data.

**Next:** Dive into the details of the [RSX Syntax Guide](../guides/01-rsx-syntax.md).
