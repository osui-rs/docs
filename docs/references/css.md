---
title: CSS
---

Along with the `Css` type, This macro provides styling for multiple elements by their class name.

## Example
In this case we will make a button with the classname `my_btn`. And set `styling`
```rust
#[component]
fn App() -> Element {
    rsx! {
        @SetStyle(css! {
            blue-outline {
                outline: true,
                outline_color: Blue,
            }

            red {
                color: Red,
            }

            green-hover: "hover" {
                color: Green,
            }
        })

        button { class: "red blue-outline green-hover", "Click me!" }
    }
}
```

## `hover`
The `hover` state is on every element but only if it's focused/hovered.
```rust
"my_btn": "hover" {
    color: Green,
}
```