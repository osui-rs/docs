---
title: Widget
slug: /widget
---

A `Widget` is a wrapper for `Element` that manages `Component`(s) and `DependencyHandler`(s).

## Trait `Element`

A `Element` is the core ui component for OSUI, this includes `Div`, `FlexRow`, etc.

### `render(&mut self, scope: &mut RenderScope)`

Called to get the UI output of the element.

### `after_render(&mut self, scope: &mut RenderScope)`

Called after the output of `render` is drawn to the screen.

### `draw_child(&self, element: &Arc<Widget>)`

Called when the element is provided with a child `Widget`.

### `as_any(&self) -> &dyn Any`

For safety and misc reasons.

### `as_any_mut(&mut self) -> &mut dyn Any`

For safety and misc reasons.

## Trait `Component`

### `as_any(&self) -> &dyn Any`

For safety and misc reasons.

### `as_any_mut(&mut self) -> &mut dyn Any`

For safety and misc reasons.
