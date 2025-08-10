# `osui::extensions::velocity`

The `velocity` module provides the `VelocityExtension` and `Velocity` component, enabling simple animation by automatically moving widgets with a constant velocity.

## `Velocity` (Component)

```rust
component!(Velocity(pub i32, pub i32));
```
A tuple struct component that holds two `i32` values, representing the horizontal (`x`) and vertical (`y`) velocity of a widget. The values represent "cells per second" for movement.

**Fields:**
*   `0`: `i32` - Horizontal velocity (cells per second). Positive moves right, negative moves left.
*   `1`: `i32` - Vertical velocity (cells per second). Positive moves down, negative moves up.

**Example:**
```rust
use osui::prelude::*;
rsx! {
    @Velocity(10, 0); // Move 10 cells right per second
    @Transform::new().x(0).y(0);
    Div { "Moving Right" }
}
```

## `VelocityExtension`

This extension is responsible for applying the specified `Velocity` to widgets that also have a `Transform` component, causing them to move across the screen.

```rust
pub struct VelocityExtension;
```

### Associated Methods

#### `VelocityExtension::apply_velocity(ticks: u16, velocity: i32, x: &mut u16)`
An internal helper function that updates a single coordinate (`x` or `y`) based on the elapsed `ticks` and `velocity`. It ensures that movement occurs at the specified `velocity` (cells per second) by checking if enough time has passed since the last movement.

#### `VelocityExtension::apply_velocity_xy(ticks: u16, widget: &Arc<Widget>)`
An internal helper that applies `Velocity` to both `x` and `y` coordinates of a widget's `Transform` component. It retrieves the `Velocity` and `Transform` components, calculates new positions using `apply_velocity`, and then updates the `Transform` component on the widget.

### `Extension` Trait Implementation

#### `init(&mut self, ctx: &super::Context)`
Called when the extension is initialized.
1.  Clones the `Context`.
2.  Spawns a new thread.
3.  In this thread, it enters an infinite loop:
    *   Initializes a `tick` counter (0 to 1000, then resets). This acts as a granular time counter.
    *   Iterates over all widgets managed by the `Screen` (obtained via `ctx.get_widgets()`).
    *   For each widget, it calls `Self::apply_velocity_xy(tick, widget)` to update its position if it has a `Velocity` and `Transform` component.
    *   The thread sleeps for 1 millisecond. This ensures very frequent checks and smooth potential movement, as `velocity` is defined in "cells per second".

**Why a separate thread?**
Similar to `InputExtension` and `TickExtension`, a separate thread is used because time-based operations like `thread::sleep` are blocking. This prevents the velocity calculations from blocking the main rendering loop and ensures smooth animations. The 1ms sleep provides a high refresh rate for velocity updates.

## Usage

To use `VelocityExtension`, you need to:
1.  Register it with your `Screen`.
2.  Attach both a `Transform` and a `Velocity` component to the widget you want to animate. The `Transform` should have `Position::Const` for the coordinates you want to animate.

**Example:**
```rust
use osui::prelude::*;

fn main() -> std::io::Result<()> {
    let screen = Screen::new();

    screen.extension(InputExtension); // Required for general terminal operations
    screen.extension(RelativeFocusExtension::new()); // Optional, but good practice
    screen.extension(VelocityExtension); // Register the VelocityExtension

    rsx! {
        // A Div that moves right at 10 cells/second
        @Velocity(10, 0);
        @Transform::new().x(0).y(0).dimensions(10, 1); // Must have Const position to be moved
        @Style { background: Background::Solid(0xFF0000) };
        Div { "Moving Text" }

        // A Div that moves down at 5 cells/second, starting below the first
        @Velocity(0, 5);
        @Transform::new().x(0).y(2).dimensions(10, 1);
        @Style { background: Background::Solid(0x0000FF) };
        Div { "Moving Down" }
    }
    .draw(&screen);

    screen.run()
}
```
`VelocityExtension` provides a simple, component-based way to add continuous motion to your OSUI elements. For more complex animations, you might combine it with `TickExtension` and custom logic within a widget's `event` method or a more advanced animation extension.
