---
title: RSX
---

This macro is the recommended way to describe a ui, it is a div that holds multiple elements
```rust
#[component]
fn App() -> Element {
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
let x = 69;

rsx! {
    div {
        text { "the number is {x}, Nice!" }
    }
}
```

## Formatted text
```rust
let x = 69;

rsx! {
    text { "the number is {x}, Nice!" }
}
```
> :::info You can also do expressions after the string
```rust
text { "the number is {}, Nice!", x }
```

## For loops
```rust
rsx! {
    for (i in 0..5) { // () are required
        text { "{i}" }
    }
}
```

## Attribute
You can change the element's struct fields by just providing some attributes before the children
```rust
rsx! {
    text { class: "my_text" }
}
```

## Handler functions
Instead of closures which are tricky to work with on structs, We use `Handler`, It's basically a closure wrapped with a `Arc<Mutex<T>>`
```rust
rsx! {
    button {
        on_click: fn(btn: &mut Button, event, document) {
            // do something
        }
    }
}
```

## Handler functions (with dependents)
If you have a `State<T>` and want to use it, you have to put a @ before the code block like this
```rust
let count = State::new();

rsx! {
    button {
        on_click: fn(btn: &mut Button, event, document) @count {
            let count = count.use_state(); // locks count so it can be used
        },
        "Current count: {count}"
    }
}
```
> :::info you can add multiple decedents by separating them via `,` like: @var1, var2, var3

## Static text
If your text doesn't use variables that will change you can put `static` right before the text to signal that it's static.
```rust
let count = 69; // count won't change since it's not mutable

rsx! {
    text {
        static "Current count: {count}"
    }
}
```

## Instructions
Add an instruction by putting a `@` before it, like this:
```rust
rsx! {
    @SetStyle(css! { // the SetStyle instruction
        "title": {
            color: Green,
        }
    })

    text { class: "title", static "Hello world!" }
}
```

# Ghost elements
With a `div` you can use tab (or shift+tab) to go through components, But sometimes an element doesn't really do anything, So to skip over the element you can use the ghost syntax `%`. This makes it so that the element is not selectable.
```rust
rsx! {
    %text { "This is a ghost title!!!!" }

    button { "Click me!" }
}