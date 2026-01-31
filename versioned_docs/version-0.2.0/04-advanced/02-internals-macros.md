---
sidebar_position: 2
title: Internals: Macros
---

# Internals: Macros

OSUI heavily relies on procedural macros to provide its ergonomic, declarative syntax. The `osui-macros` crate contains the logic for the `#[component]` attribute macro and the `rsx!` function macro. Understanding how these macros work under the hood gives you a deeper insight into OSUI's architecture and capabilities.

## Introduction to Procedural Macros

Procedural macros are functions that operate on the Rust syntax tree (Abstract Syntax Tree or AST) during compilation. They receive `TokenStream`s as input and produce `TokenStream`s as output, effectively transforming your code. OSUI's macros leverage the following crates:

*   **`syn`**: A parser for Rust's syntax tree. It allows macros to parse input `TokenStream`s into structured Rust AST types (like `ItemFn`, `Expr`, `Path`, etc.).
*   **`quote`**: A quasiquoting library that makes it easy to generate Rust code (as `TokenStream`s) from AST fragments.
*   **`proc-macro2`**: Provides types like `TokenStream` and `Ident` that are compatible with `syn` and `quote`, enabling ergonomic manipulation of tokens.

## `#[component]` Attribute Macro (`macros/src/lib.rs`)

The `#[component]` macro transforms a Rust function into an OSUI component struct.

### Input

It takes an `ItemFn` (the parsed function definition) as input.

```rust
// Original function in user's code
#[component]
pub fn MyComponent(cx: &Arc<Context>, prop1: &String, prop2: &i32) -> View {
    // ... function body ...
}
```

### Core Logic

1.  **Parse Function Signature**:
    *   It extracts the function's name (`MyComponent`).
    *   It validates the first argument `cx: &Arc<Context>`.
    *   It iterates through the remaining arguments (`prop1: &String`, `prop2: &i32`), which become the component's props.
2.  **Generate Component Struct**: For each prop parameter, it determines the *owned* type (e.g., `&String` becomes `String`, `&i32` becomes `i32`). It then uses `quote!` to generate a new struct:
    ```rust
    pub struct MyComponent {
        pub prop1: String, // Owned types
        pub prop2: i32,
    }
    ```
3.  **Implement `ComponentImpl`**: It then generates an `impl ComponentImpl for MyComponent` block. The `call` method of this trait:
    *   Takes `&self` and `cx: &Arc<Context>`.
    *   Internally calls a generated `Self::component` method (which is your original function's body).
    *   Passes `cx` and references (`&self.prop1`, `&self.prop2`) to the stored props from the generated struct.
    ```rust
    impl MyComponent {
        // This is your original function, renamed and wrapped
        pub fn component(cx: &Arc<Context>, prop1: &str, prop2: &i32) -> View { /* ... body ... */ }
    }

    impl ComponentImpl for MyComponent {
        fn call(&self, cx: &Arc<Context>) -> View {
            Self::component(cx, &self.prop1, &self.prop2) // Pass references to owned props
        }
    }
    ```

### Output

The macro replaces the original function with the generated struct, its `component` method, and the `ComponentImpl` implementation. This transformation makes `MyComponent` a valid OSUI component that can be instantiated with props in `rsx!`.

## `rsx!` Function Macro (`macros/src/parse.rs` & `macros/src/emit.rs`)

The `rsx!` macro is more complex, involving a two-step process: parsing the custom syntax and then emitting standard Rust code.

### 1. Parsing (`macros/src/parse.rs`)

The `parse` module defines an AST (Abstract Syntax Tree) for the `rsx!` syntax.

*   **`RsxRoot`**: The top-level container, holding a vector of `RsxNode`s.
*   **`RsxNode`**: An enum representing different types of nodes in the `rsx!` tree:
    *   `Text(LitStr)`: For `"Hello"` literals.
    *   `Expr(Expr)`: For `@{some_expression}` blocks.
    *   `Component { path: Path, props: Vec<RsxProp>, children: Vec<RsxNode> }`: For `MyComponent { prop: val, ... }`.
    *   `Mount(Ident)`: For `!my_mount_hook`.
    *   `If { deps: Vec<Dep>, cond: Expr, children: Vec<RsxNode> }`: For `@if condition { ... }`.
    *   `For { deps: Vec<Dep>, pat: Pat, expr: Expr, children: Vec<RsxNode> }`: For `@for item in items { ... }`.
*   **`RsxProp`**: Represents a `name: value` pair for component props.
*   **`Dep`**: Represents a dependency for dynamic blocks (`%my_state as my_alias`).

The `parse::RsxRoot::parse` method uses `syn`'s `ParseStream` to tokenize the `rsx!` input and build this AST. It intelligently differentiates between text, expressions, component names, and control flow keywords (`@if`, `@for`, `!`).

### 2. Emitting (`macros/src/emit.rs`)

The `emit` module takes the parsed `RsxRoot` AST and converts it into a `TokenStream` of standard Rust code that constructs `osui::frontend::Rsx` objects.

*   **`emit_rsx(root: RsxRoot)`**: The entry point, which initializes an `osui::frontend::Rsx` object and then iterates through the `root.nodes`.
*   **`emit_node_scope(node: &RsxNode)`**: For each `RsxNode`, it generates code that calls the appropriate `Rsx` builder method:
    *   **`RsxNode::Text`**: Emits `r.static_scope(move |scope| { scope.view(...) });` which draws text.
    *   **`RsxNode::Expr`**: Emits `r.child(expression);`.
    *   **`RsxNode::Component`**: Emits `r.static_scope(move |scope| { scope.child(ComponentName { props: ... }, None); });`. If children are present, they are recursively emitted into a nested `Rsx` object and passed as the `children` prop.
    *   **`RsxNode::Mount`**: Emits `mount_hook_instance.mount();`.
    *   **`RsxNode::If`**: Emits `r.dynamic_scope(move |scope| { if condition { ... } else { ... } }, dependencies);`. The `dependencies` are converted to `Vec<Arc<dyn HookDependency>>`.
    *   **`RsxNode::For`**: Similar to `If`, emits `r.dynamic_scope(move |scope| { for pattern in expr { ... } }, dependencies);`.

### Output

The `rsx!` macro produces a `TokenStream` that looks something like this (simplified):

```rust
// For: rsx! { "Hello" MyComponent { prop: value } }
{
    let mut r = osui::frontend::Rsx::new();
    r.static_scope(move |scope| {
        scope.view(std::sync::Arc::new(move |ctx| {
            ctx.draw_text(osui::render::Point { x: 0, y: 0 }, &format!("Hello"))
        }));
    });
    r.static_scope(move |scope| {
        scope.child(
            MyComponent { prop: value.to_string() }, // Note: Prop value converted to owned type
            None,
        );
    });
    r
}
```

This generated code, when compiled, constructs the `osui::frontend::Rsx` object that OSUI's runtime can then interpret to build the component tree and render the UI.

## Summary

The `osui-macros` crate plays a pivotal role in shaping OSUI's developer experience. `#[component]` streamlines component definition, while `rsx!` provides a powerful, declarative way to compose UIs by transforming custom syntax into efficient runtime calls. These macros are complex but essential for creating a modern, React-like development flow in a TUI environment.

**Next:** Learn how you can contribute to the OSUI project in [Contributing](./03-contributing.md).
