---
title: RSX
---

This macro is the recommended way to describe a ui, it is a div that holds multiple elements
```rust
fn app() -> Element {
    rsx! {
        button { "click me" }
        text { "This is some text" }
    }
}
```

> :::info `rsx!` is really just a div, so you can just do something like
> ```rust
> rsx! {
>     id: "root", class: "root",
>
>     button { "click me" }
>     text { "This is some text" }
> }
> ```

## Child values
If you want to add more children to values then just simply express it like a `rsx!`
```rust
fn app() -> Element {
    let x = 69;
    rsx! {
        div {
            text { "the number is {x}, Nice!" }
        }
    }
}
```

## Formatted text
```rust
fn app() -> Element {
    let x = 69;
    rsx! {
        text { "the number is {x}, Nice!" }
    }
}
```
> :::info You can also do expressions after the string
```rust
text { "the number is {}, Nice!", x }
```

## For loops
```rust
fn app() -> Element {
    rsx! {
        for (i in 0..5) { // () are required
            text { "{i}" }
        }
    }
}
```

## Attribute
You can change the element's struct fields by just providing some attributes before the children
```rust
fn app() -> Element {
    rsx! {
        text { class: "my_text" }
    }
}
```

## Type assignment
In special elements like `data_holder` You can specify what `type` the element holds. It would act like `my_fn::<Type>()`
```rust
fn app() -> Element {
    rsx! {
        // assign the type u32
        data_holder as u32 { id: "count" }
    }
}
```

## Handler functions
Instead of closures which are tricky to work with on structs, We use `Handler`, It's basically a closure wrapped with a `Arc<Mutex<T>>`
```rust
fn app() -> Element {
    rsx! {
        button {
            on_click: fn(btn: &mut Button, event, document) {
                // do something
            }
        }
    }
}
```