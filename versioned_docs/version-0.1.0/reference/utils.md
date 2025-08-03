# Utilities (`utils` module) API Reference

The `utils` module provides a collection of helper functions primarily for low-level terminal manipulation (like clearing the screen or hiding the cursor) and string measurements. These functions are often used internally by OSUI's rendering engine but can also be helpful for application developers directly.

## Functions

### `clear()`

Clears the entire terminal screen and moves the cursor to the top-left corner (1,1).

```rust
pub fn clear() -> io::Result<()>
```

*   **Returns**: A `std::io::Result<()>` indicating success or an I/O error.
*   **Behavior**: Sends ANSI escape codes `\x1B[2J` (clear screen) and `\x1B[H` (cursor home).
*   **Usage**: Used by `Screen::render` before drawing a new frame. You might use it yourself for custom full-screen updates outside of OSUI's main loop.

    ```rust
    use osui::utils;
    // ...
    utils::clear().unwrap();
    ```

### `hide_cursor()`

Hides the terminal cursor.

```rust
pub fn hide_cursor() -> io::Result<()>
```

*   **Returns**: A `std::io::Result<()>` indicating success or an I/O error.
*   **Behavior**: Sends ANSI escape code `\x1b[?25l`.
*   **Usage**: Called by `Screen::run` at application startup for a cleaner TUI experience. You should not need to call this manually in most OSUI applications.

### `show_cursor()`

Shows the terminal cursor.

```rust
pub fn show_cursor() -> io::Result<()>
```

*   **Returns**: A `std::io::Result<()>` indicating success or an I/O error.
*   **Behavior**: Sends ANSI escape code `\x1B[?25h`.
*   **Usage**: Called by `Screen::close` at application shutdown to restore the terminal state. You should not need to call this manually.

### `flush()`

Flushes the standard output buffer. This ensures that any `print!` or `println!` macros or direct writes to `stdout` are immediately displayed on the terminal.

```rust
pub fn flush() -> io::Result<()>
```

*   **Returns**: A `std::io::Result<()>` indicating success or an I/O error.
*   **Usage**: Used internally by OSUI's print functions to ensure immediate rendering. You might use it after a series of prints if you're not using OSUI's `RenderScope` for drawing.

    ```rust
    use std::io::{self, Write};
    use osui::utils;

    print!("Loading...");
    utils::flush()?; // Ensure "Loading..." is visible
    // ... long operation ...
    println!("Done.");
    ```

### `str_size(s: &str) -> (u16, u16)`

Calculates the width (maximum line length) and height (number of lines) of a string, assuming it's rendered in a monospaced terminal environment. It handles newline characters (`\n`).

```rust
pub fn str_size(s: &str) -> (u16, u16)
```

*   `s`: The input string.
*   **Returns**: A tuple `(width, height)` where `width` is the maximum line width and `height` is the number of lines.
*   **Usage**: Used by `RenderScope` to determine content-based element sizes. Also useful for custom elements needing to know the dimensions of text.

    ```rust
    use osui::utils;
    let (width, height) = utils::str_size("Hello\nWorld");
    assert_eq!((5, 2), (width, height)); // "World" is 5 chars, 2 lines
    ```

### `hex_ansi(hex: u32) -> String`

Converts a 24-bit RGB hex color (e.g., `0xFF00FF`) into an ANSI escape sequence for setting the **foreground** color.

```rust
pub fn hex_ansi(hex: u32) -> String
```

*   `hex`: A `u32` representing the RGB color (e.g., `0xAABBCC`).
*   **Returns**: A `String` containing the ANSI escape code (e.g., `"\x1b[38;2;R;G;Bm"`).
*   **Usage**: Used internally for coloring text.

### `hex_ansi_bg(hex: u32) -> String`

Converts a 24-bit RGB hex color (e.g., `0xFF00FF`) into an ANSI escape sequence for setting the **background** color.

```rust
pub fn hex_ansi_bg(hex: u32) -> String
```

*   `hex`: A `u32` representing the RGB color.
*   **Returns**: A `String` containing the ANSI escape code (e.g., `"\x1b[48;2;R;G;Bm"`).
*   **Usage**: Used internally for coloring backgrounds.

### `print(x: u16, y: u16, text: &str)` (crate-internal)

Prints text directly to the terminal at a specific 0-indexed `(x, y)` coordinate (converted to 1-indexed for ANSI). It resets the terminal style (`\x1b[0m`) after printing.

```rust
pub(crate) fn print(x: u16, y: u16, text: &str)
```

*   `x`, `y`: 0-indexed coordinates for the top-left corner of the text.
*   `text`: The string to print.
*   **Usage**: Internal helper for `RenderScope`.

### `print_liner(x: u16, y: u16, liner: &str, text: &str)` (crate-internal)

Prints text to the terminal at `(x, y)` coordinates, prepending each line with a specified `liner` string (typically an ANSI color code). It resets the terminal style after printing.

```rust
pub(crate) fn print_liner(x: u16, y: u16, liner: &str, text: &str)
```

*   `x`, `y`: 0-indexed coordinates.
*   `liner`: A string (e.g., an ANSI color code) to prepend to each line.
*   `text`: The string to print.
*   **Usage**: Internal helper for `RenderScope` to apply styles to printed output.

These utility functions provide the low-level terminal interaction necessary for OSUI's rendering, but some can be useful for direct debugging or custom terminal output when not managed by OSUI's drawing pipeline.



