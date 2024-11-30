---
title: Style
---

Like `css!`, `style!` is a way to style a element. But unlike `css!`, `style!` is only meant to style a single element

```rust
rsx! {
    button {
        style: style! {
            color: Red,
            clicked { // when the button state is 'clicked'
                color: Blue,
            } 
        },

        "click me!"
    }
}
```