markdown
---
sidebar_position: 6
title: Macros API
---

# Macros Module API Reference

The `osui-macros` crate provides the procedural macros that enhance OSUI's ergonomics and enable its declarative UI syntax. These macros transform your Rust code into the necessary OSUI component and rendering structures.

## `#[component]` Attribute Macro

```rust
#[proc_macro_attribute]
pub fn component(_attr: TokenStream, item: TokenStream) -> TokenStream { /* ... */ }
```

The `#[component]` attribute macro transforms a standard Rust function into a fully-fledged OSUI component.

#### Purpose:

*   **Prop Generation**: It automatically parses the function's parameters (after the initial `cx: &Arc<Context>`) and generates a `struct` with matching fields. These fields become the component's "props".
*   **`ComponentImpl` Implementation**: It implements the `ComponentImpl` trait for the generated struct, making it a valid OSUI component that can be rendered. The `call` method of this trait simply invokes your original function.
*   **Ergonomics**: Simplifies component definition by allowing you to write components as regular functions with clear parameters, without manually defining structs and `ComponentImpl` boilerplate.

#### Usage:

```rust
use osui::prelude::*; // For Context and View types
use std::sync::Arc;

#[component]
pub fn MyComponent(cx: &Arc<Context>, message: &str, count: &usize) -> View {
    // Your component logic, accessing `message` and `count` directly
    rsx! {
        format!("Message: {}, Count: {}", message, count)
    }.view(&cx)
}

// How `MyComponent` would be used in RSX:
// rsx! {
//     MyComponent { message: "Hello", count: 123 }
// }
```

#### Generated Code (Simplified):

```rust
pub struct MyComponent {
    pub message: String, // Note: `&str` becomes `String`
    pub count: usize,    // Note: `&usize` becomes `usize`
}

impl MyComponent {
    pub fn component(
        cx: &Arc<Context>,
        message: &str, // Original function signature as `component` method
        count: &usize,
    ) -> View {
        // Original body of the function
        rsx! {
            format!("Message: {}, Count: {}", message, count)
        }.view(&cx)
    }
}

impl ComponentImpl for MyComponent {
    fn call(&self, cx: &Arc<Context>) -> View {
        Self::component(
            cx,
            &self.message, // Passes stored props as references
            &self.count,
        )
    }
}
```

#### Requirements:

*   The function must take `cx: &Arc<Context>` as its first parameter.
*   The function must return `View`.
*   Prop parameters are typically references (e.g., `&str`, `&i32`). The macro automatically converts them to their owned types (e.g., `String`, `i32`) in the generated struct.

## `rsx!` Procedural Macro

```rust
#[proc_macro]
pub fn rsx(input: TokenStream) -> TokenStream { /* ... */ }
```

The `rsx!` macro provides a declarative, React-like syntax for building UI component hierarchies directly in your Rust code. It parses the input and transforms it into calls to the `osui::frontend::Rsx` builder methods.

#### Purpose:

*   **Declarative UI**: Allows you to describe *what* your UI should look like, rather than imperatively writing drawing commands.
*   **Component Composition**: Enables easy nesting and passing of props/children to other components.
*   **Reactive Flow**: Integrates with OSUI's state management to define dynamic UI segments.

#### Syntax Overview:

The `rsx!` macro supports several types of nodes:

1.  **Text Literals**:
    ```rust
    rsx! {
        "Hello World"
        "Another line of text"
    }
    // Generates:
    // r.static_scope(move |scope| {
    //     scope.view(Arc::new(move |ctx| {
    //         ctx.draw_text(Point { x: 0, y: 0 }, &format!("Hello World"))
    //     }));
    //     // ... for another line
    // });
    ```

2.  **Rust Expressions (`@{expr}`)**:
    ```rust
    let name = "Alice";
    rsx! {
        @{format!("Hello, {}!", name)}
        @{1 + 2} // Any `Display` impl
    }
    // Generates:
    // r.child(format!("Hello, {}!", name));
    // r.child(1 + 2);
    ```
    *   The `expr` must evaluate to a type that implements `osui::frontend::ToRsx`.

3.  **Component Instantiation (`Component { prop: value, ... children }`)**:
    ```rust
    #[component] fn MyDiv(cx: &Arc<Context>, content: &str) -> View { /* ... */ }
    rsx! {
        MyDiv {
            content: "Some text", // Prop
            rsx! { "Child content" } // Children (if `children: &Rsx` is a prop)
        }
    }
    // Generates:
    // r.static_scope(move |scope| {
    //     scope.child(
    //         MyDiv {
    //             content: "Some text".to_string(), // Owned type for struct field
    //             children: osui::frontend::Rsx(/* ... */)
    //         },
    //         None
    //     );
    // });
    ```
    *   `path`: The path to the component struct (e.g., `MyDiv`, `my_module::MyComponent`).
    *   `props`: `key: value` pairs for component properties.
    *   `children`: Any `rsx!` content directly inside the braces after props. This is collected into the special `children: &Rsx` prop if the component defines it.

4.  **Conditional Rendering (`@if condition { ... } [else { ... }]`)**:
    ```rust
    let show = true;
    rsx! {
        %show @if show {
            "Content shown if 'show' is true"
        } else {
            "Content shown if 'show' is false"
        }
    }
    // Generates:
    // r.dynamic_scope(move |scope| {
    //     if show {
    //         // ... rsx for true branch
    //     } else {
    //         // ... rsx for false branch
    //     }
    // }, vec![Arc::new(show) as Arc<dyn HookDependency>]);
    ```
    *   `%dep1, dep2`: Optional dependency list. The `if` block will re-evaluate when any of these dependencies (which must implement `HookDependency`, like `State<T>`) change.
    *   `condition`: A Rust expression evaluating to `bool`.
    *   `{ ... }`: An `rsx!` fragment rendered if `condition` is true.
    *   `else { ... }`: Optional `rsx!` fragment rendered if `condition` is false.

5.  **Loop Rendering (`@for pattern in expr { ... }`)**:
    ```rust
    let items = vec!["A", "B", "C"];
    rsx! {
        %items @for item in items {
            format!("Item: {}", item)
        }
    }
    // Generates:
    // r.dynamic_scope(move |scope| {
    //     for item in items {
    //         // ... rsx for each item
    //     }
    // }, vec![Arc::new(items) as Arc<dyn HookDependency>]);
    ```
    *   `%dep1, dep2`: Optional dependency list. The `for` loop will re-evaluate when any of these dependencies change.
    *   `pattern`: A standard Rust `for` loop pattern (e.g., `item`, `(idx, item)`).
    *   `expr`: A Rust expression evaluating to an `IntoIterator`.
    *   `{ ... }`: An `rsx!` fragment rendered for each iteration.

6.  **Mount Hook (`!mount_hook_instance`)**:
    ```rust
    let my_manual_mount = use_mount_manual();
    rsx! {
        !my_manual_mount
    }
    // Generates:
    // my_manual_mount.mount();
    ```
    *   Calls the `.mount()` method on the provided `Mount` instance. This is typically used with `use_mount_manual` to trigger effects at a specific point in the render tree.

The `rsx!` macro is a powerful tool for declarative UI construction, abstracting away the underlying `Rsx` object manipulation and `Scope` creation logic.

**Next:** Explore the detailed [Render API](./render-api.md).
