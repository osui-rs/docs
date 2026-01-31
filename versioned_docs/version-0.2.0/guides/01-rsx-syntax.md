markdown
---
sidebar_position: 1
title: RSX Syntax Guide
---

# RSX Syntax Guide

The `rsx!` macro is the cornerstone of OSUI's declarative UI system. Inspired by React's JSX, it provides an ergonomic way to define your component hierarchies directly in Rust code. This guide covers all the features of the `rsx!` syntax.

## Basic Structure

The `rsx!` macro produces an `Rsx` object, which is a collection of renderable nodes. You typically call `.view(&cx)` on the `Rsx` object to convert it into a `View` that your component returns.

```rust
use osui::prelude::*;
use std::sync::Arc;

#[component]
fn App(cx: &Arc<Context>) -> View {
    rsx! {
        // Your UI elements go here
        "Hello, RSX!" // A simple text literal
    }.view(&cx)
}
```

## Types of Nodes

`rsx!` supports several types of nodes:

### 1. Text Literals

Plain string literals are rendered as text.

```rust
rsx! {
    "This is some text."
    "This is another line of text."
}
```

### 2. Rust Expressions: `@{expr}`

You can embed any Rust expression that evaluates to a renderable type (one that implements `ToRsx`) using the `@{...}` syntax. This is useful for dynamic content or rendering other `Rsx` objects.

```rust
let dynamic_text = format!("The current time is: {:?}", std::time::SystemTime::now());
let other_rsx = rsx! { "Some nested content" };

rsx! {
    @{dynamic_text} // Renders the string from the expression
    @{other_rsx}    // Renders another Rsx object
    @{123 + 456}    // Renders the result of the arithmetic operation (as a string)
}
```

:::tip
Any type that implements `std::fmt::Display` (like `String`, `&str`, `i32`, `f64`, etc.) automatically implements `ToRsx` and can be used directly within `rsx!`.
:::

### 3. Component Instantiation: `ComponentName { prop: value, ... }`

To use another component, specify its name (path) followed by an optional braced block containing its props and children.

```rust
#[component]
fn MyButton(cx: &Arc<Context>, text: &str) -> View {
    rsx! {
        format!("[ {} ]", text)
    }.view(&cx)
}

#[component]
fn App(cx: &Arc<Context>) -> View {
    rsx! {
        MyButton { text: "Click Me" } // Component with a prop
        MyButton { "Another Button" } // Component with children (which becomes `text` if `children: &Rsx` is also defined)
    }.view(&cx)
}
```

*   **Props**: Key-value pairs (`prop_name: value`) inside the braces. The `prop_name` must match a parameter name in the target component's function signature.
*   **Children**: Any `rsx!` content (text, expressions, other components) directly nested inside the component's braces after props will be collected into the special `children: &Rsx` prop, if defined by the component.

### 4. Conditional Rendering: `@if condition { ... }`

Conditionally render parts of your UI based on a boolean expression.

```rust
let show_message = true;
let is_admin = false;

rsx! {
    @if show_message {
        "This message is always shown."
    }
    @if is_admin {
        "Admin panel access granted."
    } else {
        "Access denied." // `else` is optional
    }
}
```

*   The `condition` must be a Rust expression that evaluates to a `bool`.
*   The content inside the `{...}` block is an `rsx!` fragment that will be rendered if the condition is true.
*   An optional `else { ... }` block can follow for false conditions.

#### Reactivity with Dependencies: `%$dep @if condition { ... }`

For conditional rendering to react to state changes, you need to explicitly declare dependencies using the `%$dep` syntax.

```rust
let count = use_state(0); // A reactive state

rsx! {
    %count @if *count.get() > 0 { // This block re-renders if `count` changes
        format!("Count is: {}", count.get_dl())
    } else {
        "Count is zero."
    }
}
```

*   **`%count`**: Declares `count` as a dependency for this `if` block. When `count`'s value changes (via `count.set()` or `*count.get_mut()`), this entire `if` block will be re-evaluated and re-rendered.
*   You can declare multiple dependencies: `%dep1, dep2, dep3 @if ...`
*   You can also rename dependencies for clarity: `%original_name as new_name @if ...`

### 5. Loop Rendering: `@for pattern in expr { ... }`

Render a list of items by iterating over a collection.

```rust
let items = vec!["Apple", "Banana", "Cherry"];

rsx! {
    "Fruits:"
    @for item in items { // Loops over the `items` vector
        format!("- {}", item)
    }

    "Numbers:"
    @for i in (0..3) {
        format!("Number: {}", i)
    }
}
```

*   `pattern` is a standard Rust `for` loop pattern (e.g., `item`, `(index, item)`, `_`).
*   `expr` is a Rust expression that evaluates to an `IntoIterator`.
*   The content inside the `{...}` block is an `rsx!` fragment that will be rendered for each iteration.

#### Reactivity with Dependencies: `%$dep @for pattern in expr { ... }`

Similar to `@if`, `@for` loops also support dependency tracking for reactive updates.

```rust
let my_list = use_state(vec!["One".to_string(), "Two".to_string()]);

// Later, you might update my_list.set(new_vec);
// or my_list.get_mut().push("Three");

rsx! {
    "My Dynamic List:"
    %my_list @for item in my_list.get_dl() { // This block re-renders if `my_list` changes
        format!("- {}", item)
    }
}
```

*   **`%my_list`**: Declares `my_list` as a dependency. When `my_list` is updated, the loop will be re-executed, rendering the new list.

### 6. Mount Hook: `!mount_hook_instance`

This syntax is used to explicitly "mount" a component's lifecycle hook. This is specifically for `use_mount_manual`.

```rust
let my_mount_hook = use_mount_manual();

rsx! {
    "This text is always visible."
    !my_mount_hook // Explicitly triggers the mount effects for `my_mount_hook`
}
```

*   When `!my_mount_hook` is encountered in the `rsx!` output, it calls `my_mount_hook.mount()`, triggering any `use_effect` callbacks registered with that specific `Mount` instance.

## Summary

The `rsx!` macro is a powerful tool for building declarative user interfaces in OSUI. By combining text, expressions, components, conditionals, and loops with reactive dependencies, you can create complex and dynamic TUIs with a clean and familiar syntax.

**Next:** Learn how to manage component data over time with OSUI's [State Management hooks](./02-state-management.md).
