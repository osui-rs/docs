---
title: Introduction
slug: /
---

OSUI is a powerful TUI library, what makes it special is it's design and features, it allows for both customization and easy of use.

### Setup
First, you need to install osui to a already existing [rust cargo](https://doc.rust-lang.org/cargo/getting-started/index.html) project, then in your project directory run:
```bash
cargo add osui
```

## Hello World App
To make a hello world app in OSUI simply write this
```rust src/main.rs
use osui::Screen;

fn main() -> std::io::Result<()> {
    let mut screen = Screen::new();
    
    screen.draw(format!("Hello, World!"));

    screen.run()
}
```

## Hello World App With Velocity
The text will move from left to right with a velocity of `100`
```rust src/main.rs
use osui::{Screen, extensions::velocity::{VelocityExtension, Velocity}};

fn main() -> std::io::Result<()> {
    let mut screen = Screen::new();
    screen.extension(VelocityExtension);
    
    screen
        .draw(format!("Hello, World!"))
        .component(Velocity(100, 0)); // Velocity(x, y)

    screen.run()
}
```
