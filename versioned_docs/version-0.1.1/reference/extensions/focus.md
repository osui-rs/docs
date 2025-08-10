# `osui::extensions::focus`

The `focus` module provides extensions and components for managing keyboard focus within your OSUI application. It enables navigation between widgets using keyboard input, which is crucial for interactive elements like `Input` fields.

## Components

### `AlwaysFocused` (Component)
```rust
component!(AlwaysFocused);
```
A marker component that, when attached to a widget, ensures that the widget remains focused regardless of user navigation. This is useful for global event handlers or root containers that should always receive input.

**Example:**
```rust
use osui::prelude::*;
rsx! {
    @AlwaysFocused;
    @Handler::new(|_, e: &crossterm::event::Event| {
        // This handler will always receive events.
    });
    Div { "Global Handler" }
}
```

### `Focused` (Component)
```rust
component!(Focused);
```
A marker component that, when attached to a widget, indicates that this widget should be initially focused when the application starts or when focus is determined. The `RelativeFocusExtension` uses this to set initial focus.

**Example:**
```rust
use osui::prelude::*;
rsx! {
    FlexCol {
        "Username:"
        @Focused; // This Input will be focused by default
        Input { }
        "Password:"
        Input { }
    }
}
```

## `RelativeFocusExtension`

This extension manages focus between eligible widgets based on their relative positions on the screen. It allows users to navigate the UI using arrow keys (often combined with Shift).

```rust
pub struct RelativeFocusExtension {
    cursor: usize, // Internal index of the currently focused widget
    rendered: Arc<Mutex<Vec<(usize, u16, u16)>>>, // Stores widget indices and their (x,y) positions
}
```

### Associated Methods

#### `RelativeFocusExtension::new() -> Self`
Creates a new instance of the `RelativeFocusExtension`.

### `Extension` Trait Implementation

#### `init(&mut self, _ctx: &Context)`
When initialized, it checks existing widgets for the `Focused` component and sets the first one found as focused.

#### `event(&mut self, ctx: &Context, event: &dyn Event)`
Listens for `crossterm::event::Event`s, specifically `KeyCode::Right`, `Left`, `Up`, `Down` when combined with `KeyModifiers::SHIFT`.
When such a key is pressed, it calculates the closest eligible widget in the specified direction based on the `rendered` positions and updates `self.cursor` to that widget's index. It then sets the focus state (`set_focused`) for all widgets accordingly.
Widgets with the `AlwaysFocused` component remain focused.

#### `render(&mut self, _ctx: &Context, _scope: &mut RenderScope)`
Clears the internal `rendered` list at the beginning of each frame. This ensures that widget positions are recalculated based on the latest render.

#### `after_render_widget(&mut self, ctx: &Context, scope: &mut RenderScope, widget: &Arc<Widget>)`
After each widget is rendered, this hook captures its absolute position (`RawTransform.x`, `RawTransform.y`) and its index in the `Screen`'s widget list, storing it in the `rendered` list. This data is then used by the `event` method for focus navigation calculations. It runs in a separate thread for performance.

### How Focus Navigation Works

1.  **Position Tracking**: During the `after_render_widget` phase, the `RelativeFocusExtension` records the `(x, y)` coordinates of every non-ghost widget that is rendered.
2.  **Event Listening**: When the user presses `Shift + Arrow Key`, the `event` method is triggered.
3.  **Closest Widget Calculation**: The `find_closest_in_direction` helper function (internal to the module) determines the next best widget to focus. It prioritizes:
    *   Widgets directly in the line of the arrow key (same row for left/right, same column for up/down).
    *   If no direct match, it finds the geographically closest widget in the general direction.
4.  **Focus Update**: The extension then updates the `focused` state on widgets using `widget.set_focused(true/false)`. Widgets with the `Focused` component (usually `Input` fields) will then react to subsequent key events.

**Note on `Tab` / `BackTab`**: While `RelativeFocusExtension` handles arrow keys, `Paginator` elements handle `Tab` and `Shift+Tab` internally to cycle through their pages. For general `Tab` navigation across *all* focusable elements in the UI, you would implement a custom `Handler` on a root widget that iterates through widgets and sets focus, or extend `RelativeFocusExtension` to handle `Tab` more generically.
