---
title: ElementCore
---

`ElementCore` is a trait that will automatically be implemented by the `osui_element::element` proc-macro. All of it's functions are used by OSUI.

## `element` proc-macro
This macro adds the essential fields and functions for a `ElementCore` structure.
```rust
use osui_element::element;
#[element]
#[derive(Default, Debug)]
struct MyElement {}
```

## `elem_fn` proc-macro
This macro makes a function that returns a `Box<T>` of which T is the default of `MyElement`
```rust
use osui_element::{element, elem_fn};
#[element]
#[elem_fn]
#[derive(Default, Debug)]
struct MyElement {}
```

>:::info
>You can also define a function for the element manually:
>```rust
>pub fn my_element() -> Box<MyElement> {
>    Box::new(MyElement::default())
>}
>```