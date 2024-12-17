---
title: CSS
---

Along with the `Css` type, This macro provides styling for multiple elements by their class name.

## Example
In this case we will make a button with the classname `my_btn`. And set `styling`
```rust
fn app() -> Element {
    rsx! {
        button { class: "my_btn", "Click me!" }
    }
}
```

## Style by classname
```rust
fn styles() -> Css {
    css! {
        "my_btn" { // style by classname
            color: Red,
        }

        // Style by state
        "my_btn": "clicked" { // When the element state is clicked
            color: Blue,
        }
    }
}
```

## `hover`
The `hover` state is on every element but only if it's focused/hovered.
```rust
"my_btn": "clicked" {
    color: Green,
}
```