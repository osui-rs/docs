---
title: Screen
slug: /screen
---
`Screen` is a OSUI structure that allows the program to use osui elements and it's extensions.
<img src="/img/diagrams/screen.png" alt="Diagram" width="600"/>

### `Screen::new()`
Creates a new `Screen` structure with empty widgets and extensions.

### `draw(&mut self, element: E) -> &Arc<Widget>`
Adds a element to the widgets array and returns the widget for extra parameters.

### `extension(&mut self, ext: E)`
Adds a extension to the extensions array.

### `run(&mut self) -> std::io::Result<()>`
Runs the app with the elements and extension provided.

### `render(&self) -> std::io::Result<()>`
> :::warning
> Do not run this function if you don't know what you're doing, this function may cause a mutex deadlock.


### `render_extension(&self, wi: Arc<Widget>) -> std::io::Result<()>`
> :::warning
> Do not run this function if you don't know what you're doing, this function may cause a mutex deadlock.