---
title: Screen
slug: /screen
---

`Screen` is a OSUI structure that allows the program to use osui elements and it's extensions.
<img src="/img/diagrams/screen.png" alt="Diagram" width="600"/>

### `Screen::new() -> Arc<Screen>`

Creates a new `Screen` structure with empty widgets and extensions.

### `draw(self: &Arc<Self>, element: FnMut() -> WidgetLoad) -> Arc<Widget>`

Adds a element to the widgets array and returns the widget for extra parameters.

### `extension(&mut self, ext: Extension)`

Implements a extension to the screen.

### `run(&mut self) -> std::io::Result<()>`

Runs the app.

### `render(&self) -> std::io::Result<()>`

> :::warning
> Do not call this function if you don't know what you're doing, this function may cause a mutex deadlock.

### `pub fn draw_box(self: &Arc<Self>, element: Box<dyn FnMut() -> WidgetLoad + Send + Sync>) -> Arc<Widget>`

Adds a element to the widgets array and returns the widget for extra parameters.

> :::info
> This function is useful in special scenarios.
