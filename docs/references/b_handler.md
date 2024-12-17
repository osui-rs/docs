---
title: Handler
---

A `Handler` is a closure wrapper. Due to how closures work, they aren't the best to work with on structs (in this case: elements). So to fix this we use a `Handler` which is a wrapper for the closure, Then you can safely clone and use it without any problems (in which a normal closure would fail at)

## Examples
```rust
Handler::new(|btn: &mut Button, event, document| {
    // do something
})
```
### Recommended way
```rust
rsx! {
    button {
        // No need for Handler::new
        on_click: fn(btn: &mut Button, event, document) {
            // do something
        }
    }
}
```
### With dependents
If you have a `State<T>` and want to use it in a `fn()`, you have to put a @ before the code block like this
```rust
fn app() -> Element {
    let count = State::new();

    rsx! {
        button {
            on_click: fn(btn: &mut Button, event, document) @count {
                let count = count.use_state(); // locks count so it can be used
            },
            "Current count: {count}"
        }
    }
}
```
> :::info you can add multiple decedents by separating them via `,` like: @var1, var2, var3

> :::info `fn() {}` is a part of the OSUI macro `rsx!`. In rust you would normally use `|| {}`