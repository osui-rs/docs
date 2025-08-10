# `osui::elements::input`

The `Input` element provides a basic interactive text input field for your OSUI applications. It allows users to type, backspace, delete characters, and move the cursor within the input area.

## `Input` Struct

```rust
pub struct Input {
    pub state: State<String>, // Reactive state holding the input string
    cursor: usize,            // Current cursor position within the string
}
```

### Associated Methods

#### `Input::new() -> Self`
Creates a new `Input` instance with an empty `String` for its `state` and the `cursor` at position `0`.

**Example:**
```rust
use osui::prelude::*;
let my_input = Input::new();
```

### `Element` Trait Implementation

#### `render(&mut self, scope: &mut RenderScope, render_context: &RenderContext)`
This method is responsible for drawing the input field's current text and the cursor.
1.  It retrieves the current string from `self.state`.
2.  It calls `scope.draw_text(0, 0, &s)` to render the entire input string.
3.  **Cursor Rendering (Focus Indicator)**: If `render_context.is_focused()` is `true` (meaning this `Input` widget has keyboard focus), it draws an "inverted" character at the current `self.cursor` position. If the cursor is at the end of the string, it draws an inverted space. This visually indicates where the user is typing.

#### `event(&mut self, event: &dyn Event)`
This method handles incoming `crossterm::event::Event`s, specifically keyboard input, when the `Input` widget is focused.
It checks if the event is a `KeyEvent` and if modifiers (other than `Shift`) are present, it ignores the event to prevent unintended actions (e.g., `Ctrl+C`).
It then matches on `KeyCode`:
*   **`KeyCode::Char(c)`**: Inserts the character `c` at the `cursor` position in the `state` string and increments `cursor`.
*   **`KeyCode::Backspace`**: If `cursor > 0`, removes the character before the cursor and decrements `cursor`.
*   **`KeyCode::Delete`**: If `cursor` is not at the end of the string, removes the character at the `cursor` position.
*   **`KeyCode::Left`**: Moves `cursor` one position to the left (if not already at `0`).
*   **`KeyCode::Right`**: Moves `cursor` one position to the right (if not already at the end of the string).
After any modification, the `Input`'s `state` is automatically marked as changed (due to `DerefMut` on `State::get()`), triggering a re-render.

#### `as_any(&self) -> &dyn std::any::Any` / `as_any_mut(&mut self) -> &mut dyn std::any::Any`
Standard implementations for downcasting.

## Usage in `rsx!`

The `Input` element needs to be part of the widget tree. For it to receive keyboard input, it must be the `focused` widget. You typically achieve this using the `Focused` component (provided by `RelativeFocusExtension`).

```rust
use osui::prelude::*;

fn main() -> std::io::Result<()> {
    let screen = Screen::new();
    screen.extension(InputExtension); // Essential for keyboard input
    screen.extension(RelativeFocusExtension::new()); // Manages focus

    rsx! {
        FlexCol, gap: 1, {
            "Username:"
            @Transform::new().dimensions(30, 1).padding(1, 0); // Give it some padding
            @Style { background: Background::Outline(0xAAAAAA), foreground: Some(0xFFFFFF) };
            @Focused; // This input will be focused by default
            Input { }

            "Password:"
            @Transform::new().dimensions(30, 1).padding(1, 0);
            @Style { background: Background::RoundedOutline(0xAAAAAA), foreground: Some(0xFFFFFF) };
            Input { } // This input will only be focused via navigation (e.g., Shift+Down arrow)
        }
    }
    .draw(&screen);

    screen.run()
}
```
**Accessing Input Value:**
The `Input` element manages its own `State<String>`. If you need to access the typed value from another part of your application (e.g., when a submit button is pressed), you would typically:
1.  **Inject your own `State<String>`**: Instead of `Input { }`, you could modify `Input::new()` or create a custom `Input` variant that takes an external `State<String>` to bind to.
2.  **Get component by ID**: If using `IdExtension`, you could assign an `Id` to the `Input` widget, then later retrieve the `Arc<Widget>` by ID and call `widget.get::<Input>()` to access its `state` field.

The `Input` element provides a crucial interactive component for building forms and dynamic data entry in your TUI.
