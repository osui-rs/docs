---
title: CSS
---

Along with the `Css` type, This macro provides styling for multiple elements by their class name or struct name.

## Example
In this case we will make a button with the classname `my_btn`. And set `styling`
```rust
fn app() -> Element {
    rsx! {
        styling: Some(styles()) // Set the css styling for the div.

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

## Style by struct name
```rust
fn styles() -> Css {
    css! {
        Button { // style by the struct name
            color: Red,
        }

        // Style by state

        Button: clicked { // When the element state is clicked
            color: Blue,
        }
    }
}
```