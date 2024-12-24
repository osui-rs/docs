---
title: Component
---

A `Component` is a function but in the backend it's a struct. It's a struct because of named parameters. It can be defiend using the `#[component]` attribute.
```rust
#[component]
pub fn App() -> Element {
    rsx! {
        User { name: "leo", age: 15 }
    }
}

#[component]
pub fn User<'a>(name: &'a str, age: u8) {
    rsx! {
        text { static "Welcome {}! You are {} years old!", self.name, self.age }
    }
}
```

If you're wondering why `User` doesn't have a return type, it's because the `#[component]` attribute sets it automatically, You can also use a custom return type.

The `text` is static because self.name is a reference, dynamic text needs the lifetimes to be `'static`.