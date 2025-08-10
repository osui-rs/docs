# `osui::utils`

The `utils` module provides a collection of small, standalone utility functions for common terminal manipulations and string operations. These functions are used internally by OSUI but can also be helpful for developers building their own terminal-based applications.

## Functions

#### `clear() -> io::Result<()>`
Clears the entire terminal screen and moves the cursor to the top-left corner (position 1,1).

**Returns:**
A `std::io::Result<()>` indicating success or if an I/O error occurred.

**Example:**
```rust
use osui::utils;
utils::clear().expect("Failed to clear terminal");
```

#### `hide_cursor() -> io::Result<()>`
Hides the terminal cursor. This is typically called at the start of an OSUI application to provide a cleaner UI experience.

**Returns:**
A `std::io::Result<()>` indicating success or if an I/O error occurred.

**Example:**
```rust
use osui::utils;
utils::hide_cursor().expect("Failed to hide cursor");
```

#### `show_cursor() -> io::Result<()>`
Shows the terminal cursor. This is typically called when the OSUI application exits or needs to return control to the user.

**Returns:**
A `std::io::Result<()>` indicating success or if an I/O error occurred.

**Example:**
```rust
use osui::utils;
utils::show_cursor().expect("Failed to show cursor");
```

#### `flush() -> io::Result<()>`
Flushes the standard output buffer. This ensures that any buffered print commands are immediately written to the terminal. OSUI often calls this after printing to ensure visual updates are instantaneous.

**Returns:**
A `std::io::Result<()>` indicating success or if an I/O error occurred.

**Example:**
```rust
use osui::utils;
print!("Some text that might be buffered.");
utils::flush().expect("Failed to flush stdout");
```

#### `str_size(s: &str) -> (u16, u16)`
Calculates the dimensions (width and height) of a string as it would be rendered in a terminal.
It accounts for newline characters (`\n`) to determine height and calculates the maximum line width.

**Arguments:**
*   `s`: The input string.

**Returns:**
A tuple `(max_width, height)` where:
*   `max_width`: The maximum width of any line in the string, in characters.
*   `height`: The number of lines in the string.

**Example:**
```rust
use osui::utils;
let (width, height) = utils::str_size("Hello\nWorld!");
assert_eq!((5, 2), (width, height)); // "World" is 5 chars, 2 lines
```

#### `hex_ansi(hex: u32) -> String`
Converts a 24-bit hexadecimal RGB color code (e.g., `0xFF0000` for red) into an ANSI escape sequence for setting the **foreground** color.

**Arguments:**
*   `hex`: A `u32` representing the RGB color (0xRRGGBB).

**Returns:**
A `String` containing the ANSI escape code.

**Example:**
```rust
use osui::utils;
let red_fg = utils::hex_ansi(0xFF0000);
println!("{}This text is red\x1b[0m", red_fg); // \x1b[0m resets color
```

#### `hex_ansi_bg(hex: u32) -> String`
Converts a 24-bit hexadecimal RGB color code into an ANSI escape sequence for setting the **background** color.

**Arguments:**
*   `hex`: A `u32` representing the RGB color (0xRRGGBB).

**Returns:**
A `String` containing the ANSI escape code.

**Example:**
```rust
use osui::utils;
let blue_bg = utils::hex_ansi_bg(0x0000FF);
println!("{}This text has a blue background\x1b[0m", blue_bg);
```

#### `print(x: u16, y: u16, text: &str)`
Prints a string to the terminal at specific coordinates. The coordinates are 1-based (row 1, column 1 is top-left). Includes an ANSI reset code `\x1b[0m` after the text.

**Arguments:**
*   `x`: The 1-based column.
*   `y`: The 1-based row.
*   `text`: The string to print.

**Example:**
```rust
use osui::utils;
utils::print(5, 3, "Hello at (5,3)");
```

#### `print_liner(x: u16, y: u16, liner: &str, text: &str)`
Prints a string to the terminal at specific coordinates, prefixed with an ANSI "liner" (e.g., a color escape sequence). This function is used by OSUI to apply colors to text. The `liner` string is printed *before* the text on each line. Includes an ANSI reset code `\x1b[0m` after the text.

**Arguments:**
*   `x`: The 1-based column.
*   `y`: The 1-based row.
*   `liner`: The ANSI escape sequence to apply (e.g., color code).
*   `text`: The string to print.

**Example:**
```rust
use osui::utils;
let green = utils::hex_ansi(0x00FF00);
utils::print_liner(1, 1, &green, "This text is green");
```
