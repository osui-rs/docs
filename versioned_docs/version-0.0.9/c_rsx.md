---
title: Rsx
slug: /rsx
---

`Rsx` is a declarative way to define the UI in OSUI, it allows the user to define patterns and can use them later in the code.

## Macro `rsx!` Example

```rust
use osui::prelude::*;

fn main() -> std::io::Result<()> {
    let screen = Screen::new();

    rsx! {
        "Hello, World"
    }
    .draw(&screen);

    screen.run()
}
```

## Raw `Rsx` Example

```rust
use osui::prelude::*;

fn main() -> std::io::Result<()> {
    let screen = Screen::new();

    Rsx(vec![RsxElement::Element(
        Box::new(|| WidgetLoad::new(format!("Hello, World"))),
        vec![],
        Rsx(vec![]),
    )])
    .draw(&screen);

    screen.run()
}
```

## `rsx!`

A macro that defines and returns a `Rsx`, `rsx!` defines it in a clean and readable way.

### `%dependency @component $path {}`

Draws a `Element` from the `$path`, and applies `%dependency` and `@component`

### `%dependency @component "<string>"`

Draws a `String` using `format!`, and applies `%dependency` and `@component`

## Raw `Rsx`

The raw `Rsx` struct is a tuple-like which contains a `Vec<RsxElement>`, the elements can be defined directly in the `Vec` or using the `create_element` function

### `draw(self, screen: &Arc<Screen>)`

Draws the rsx to the provided screen.

### `draw_parent(self, screen: &Arc<Screen>, parent: Option<Arc<Widget>>)`

Draws the rsx to the provided screen with a parent option if the rsx is a child of a widget.

### `create_element(&mut self, load: FnMut() -> WidgetLoad, dependencies: Vec<Box<dyn DependencyHandler>>, children: Rsx)`

### `expand(&mut self, other: &mut Rsx)`

Expands the current rsx at the current position with the other `Rsx`
