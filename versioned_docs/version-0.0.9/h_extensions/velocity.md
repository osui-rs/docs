---
title: Velocity Extension
slug: /extensions/velocity
---

The `VelocityExtension` is a utility struct that changes the `Transform` component of a div to make a velocity effect.

> :::info
> The `Velocity` component only works if the `Transform::new` component is in the element, otherwise it may have issues.

---

## 📦 Usage

```rust
use osui::prelude::*;

fn main() -> std::io::Result<()> {
    let screen = Screen::new();
    screen.extension(VelocityExtension);

    rsx! {
        @Velocity(100, 0);
        @Transform::new();
        "Hello, World"
    }
    .draw(&screen);

    screen.run()
}
```

---

## Components

### `Velocity(x: i32, y: i32)`

Makes the `VelocityExtension` move the element according to the values, if the values are negative then the velocity is in the opposite direction.
