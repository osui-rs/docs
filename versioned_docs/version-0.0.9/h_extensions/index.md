---
title: Extensions
slug: /extensions
---

OSUI Extensions are a practical way to extend the possibilities with OSUI, Extensions allow for there to be a specific use or functionality that may otherwise be bloat or the opposite behavior of the use case.

### `screen.extension(&mut self, ext: Extension)`

You likely noticed that we used this function in the [Hello World App With Velocity](/docs/next/#hello-world-app-with-velocity) example, this function simply allows for structures implementing [Extension](/docs/next/extensions#trait-extension) to be included in the program.

---

## `Handler<E: Event>`

A `Handler` is a `Component` that is called when a specific event is dispatched, typically through a `Extension`.

### 📦 Usage

```rust
rsx!{
    @Handler::new(|widget, t: &TickEvent| {}
    "Hello World"
}
```

---

## Trait `Extension`

### `init(&mut self, _screen: Arc<Screen>)`

Runs right after the Transform component is applied to every widget.

### `render(&mut self, _scope: &mut RenderScope, _widget: &Arc<Widget>)`

Runs right before the `Element::render` is called.
