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
A better way to do this is:
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
> :::info `fn() {}` is a part of our macro `rsx!`. In rust you would normally use `|| {}`