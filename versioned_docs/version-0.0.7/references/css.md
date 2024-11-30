---
title: CSS
---

Along with the `Css` type, This macro provides styling for multiple elements by their class name or struct name.

## Style by classname
```rust
fn app() -> Element {
    rsx! {
        styling: Some(styles()) // Set the css styling for the div.

        button { class: "my_btn", "Click me!" }
    }
}

fn styles() -> Css {
    css! {
        .my_btn { // style by classname
            color: Red,
        }
    }
}
```

## Style by state
```rust
fn app() -> Element {
    rsx! {
        styling: Some(styles()) // Set the css styling for the div.

        button { class: "my_btn", "Click me!" }
    }
}

fn styles() -> Css {
    css! {
        .my_btn: clicked { // When the element state is clicked
            color: Blue,
        }
    }
}
```

## Style by struct name
```rust
fn app() -> Element {
    rsx! {
        styling: Some(styles()) // Set the css styling for the div.

        button { "Click me!" } // No need for classes
    }
}

fn styles() -> Css {
    css! {
        Button { // style by the struct name
            color: Red,
        }

        Button: clicked { // When the element state is clicked
            color: Blue,
        }
    }
}
```