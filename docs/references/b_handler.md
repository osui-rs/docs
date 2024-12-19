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
If you have a `State<T>` and want to use it in a `fn()`, Pub a @ before the code block like this
```rust
pub fn app() -> Element {
    let count = State::new(0);
    rsx! {
        button {
            on_click: fn(_, _, _) @count {
                count += 1;
            },
            "The current count is: {count}"
        }
    }
}
```

### How to call a handler
```rust
my_handler.clone().call();
```

> :::info you can add multiple decedents by separating them via `,` like: @var1, var2, var3

> :::info `fn() {}` is a part of the OSUI macro `rsx!`. In rust you would normally use `|| {}`