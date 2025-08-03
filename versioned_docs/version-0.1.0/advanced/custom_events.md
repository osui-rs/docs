# Custom Events

Beyond `crossterm` events, OSUI's event system is designed to be extensible, allowing you to define and dispatch your own custom event types. This is essential for building complex applications where different parts of your UI or internal logic need to communicate.

## 1. Defining a Custom Event

You define custom events using the `event!` macro, which automatically implements the necessary `Event` trait for your struct.

### Example: A `UserLoginEvent`

```rust
// In your `events.rs` or `lib.rs` file
use osui::prelude::*; // Import prelude for `event!` macro

event!(UserLoginEvent {
    username: String,
    success: bool,
});

// A simple unit event
event!(UserLoggedOut);
```

These events automatically get `Debug` and `Clone` derives, and implement the `osui::extensions::Event` trait.

## 2. Dispatching a Custom Event

Events are dispatched to widgets using the `widget.event(&my_event)` method. The `Screen`'s main loop automatically dispatches `crossterm::event::Event`s to all top-level widgets. For custom events, you will typically dispatch them manually from:

*   **Event Handlers**: A `Handler<crossterm::event::Event>` that captures input can then dispatch your custom event.
*   **Background Threads**: A thread performing some work can dispatch an event to the UI when its work is done.
*   **Custom Elements**: An element's internal logic might dispatch an event based on user interaction or state changes.
*   **Extensions**: An `Extension` might dispatch events to trigger behavior across multiple widgets.

To dispatch an event, you need an `Arc<Widget>` reference.

### Example: Dispatching from an `Input` handler

Let's imagine you have an `Input` widget where, when the user presses Enter, you want to dispatch a `UserLoginEvent`.

```rust
use osui::prelude::*;
use std::sync::Arc;
use crossterm::event::{KeyCode, KeyEvent, Event as CrosstermEvent};

event!(UserLoginEvent {
    username: String,
    success: bool,
});

fn main() -> std::io::Result<()> {
    let screen = Screen::new();
    screen.extension(InputExtension);

    let username_input_state = use_state(String::new());

    rsx! {
        // This handler is attached to the root widget, listening for ALL input events.
        // It will then dispatch a custom UserLoginEvent.
        @Handler::new({
            let screen = screen.clone(); // Clone screen to get all widgets
            let username_input_state = username_input_state.clone(); // Clone state to read username
            move |current_widget, event: &CrosstermEvent| {
                if let CrosstermEvent::Key(KeyEvent { code: KeyCode::Enter, .. }) = event {
                    let entered_username = username_input_state.get_dl();

                    // Simulate login logic
                    let login_success = entered_username == "admin";

                    // Create and dispatch the custom event to ALL widgets on the screen
                    // This is inefficient; normally you'd dispatch to specific widgets or use state updates
                    let login_event = UserLoginEvent {
                        username: entered_username,
                        success: login_success,
                    };
                    for w in screen.widgets.lock().unwrap().iter() {
                        w.event(&login_event);
                    }
                }
            }
        });
        Div {
            "Enter username (type 'admin' for success):"
            @Transform::new().y(1).dimensions(20, 1);
            @Style { background: Background::Outline(0x888888) };
            Input, state: username_input_state, { }
        }
    }.draw(&screen);

    screen.run()
}
```

## 3. Handling a Custom Event

Widgets (or other entities) can subscribe to your custom event types using the `Handler<E>` component.

### Example: A `LoginStatusDisplay` Widget

Now, let's create a widget that reacts to our `UserLoginEvent`:

```rust
use osui::prelude::*;
use std::sync::Arc;

// Make sure UserLoginEvent is defined and visible
event!(UserLoginEvent {
    username: String,
    success: bool,
});

pub struct LoginStatusDisplay {
    status_text: State<String>,
}

impl LoginStatusDisplay {
    pub fn new() -> Self {
        Self {
            status_text: use_state("Awaiting login...".to_string()),
        }
    }
}

impl Element for LoginStatusDisplay {
    fn render(&mut self, scope: &mut RenderScope) {
        scope.draw_text(0, 0, &self.status_text.get_dl());
    }
    // Implement as_any, as_any_mut, draw_child, after_render as needed for container logic
    fn as_any(&self) -> &dyn Any { self }
    fn as_any_mut(&mut self) -> &mut dyn Any { self }
}

fn main() -> std::io::Result<()> {
    let screen = Screen::new();
    screen.extension(InputExtension);

    let username_input_state = use_state(String::new());
    let login_status_display = Arc::new(Widget::new_static(Box::new(LoginStatusDisplay::new())));

    // Attach the handler for UserLoginEvent to the LoginStatusDisplay widget
    login_status_display.component(Handler::new({
        let status_state = login_status_display.get::<LoginStatusDisplay>().unwrap().status_text.clone();
        move |_, event: &UserLoginEvent| {
            if event.success {
                status_state.set(format!("Welcome, {}!", event.username));
            } else {
                status_state.set(format!("Login failed for {}!", event.username));
            }
        }
    }));

    // Draw the LoginStatusDisplay and the Input field
    screen.draw_widget(login_status_display.clone());

    rsx! {
        // This handler is now attached to a separate, root element.
        @Handler::new({
            let screen = screen.clone();
            let username_input_state = username_input_state.clone();
            move |_, event: &CrosstermEvent| {
                if let CrosstermEvent::Key(KeyEvent { code: KeyCode::Enter, .. }) = event {
                    let entered_username = username_input_state.get_dl();
                    let login_success = entered_username == "admin";
                    let login_event = UserLoginEvent {
                        username: entered_username,
                        success: login_success,
                    };
                    // Dispatch to the specific login_status_display widget
                    // This is more efficient than iterating all screen widgets.
                    if let Some(w) = screen.widgets.lock().unwrap().iter().find(|w| {
                        // A more robust way to find the target widget, perhaps by an ID component
                        w.get_elem().as_any().is::<LoginStatusDisplay>()
                    }) {
                        w.event(&login_event);
                    }
                }
            }
        });
        @Transform::new().y(0); // Position the input above the status
        Div {
            "Enter username (type 'admin' for success):"
            @Transform::new().y(1).dimensions(20, 1);
            @Style { background: Background::Outline(0x888888) };
            Input, state: username_input_state, { }
        }
    }.draw(&screen); // Add the input via rsx!

    screen.run()
}
```

In this enhanced example:
1.  The `Input` field (`rsx!`) has its own `Handler` for `crossterm::event::Event`.
2.  When `Enter` is pressed in the `Input`'s handler, it constructs a `UserLoginEvent`.
3.  Instead of iterating all widgets on the screen, it tries to find the `LoginStatusDisplay` widget (e.g., by checking its inner `Element` type, though using an `Id` component is more robust for production).
4.  It dispatches the `UserLoginEvent` directly to that specific `login_status_display` widget.
5.  The `Handler<UserLoginEvent>` attached to `login_status_display` then updates its internal `status_text` `State`.
6.  Because `status_text` is a `State`, and `LoginStatusDisplay` is a `StaticWidget` whose `render` method reads `status_text`, the display updates automatically.

## Event Propagation (Important)

OSUI's current event system is primarily a **global dispatch model**.
*   `InputExtension` (and `TickExtension`) dispatches events to *all* top-level widgets (`Screen.widgets.lock().unwrap().iter()`).
*   `Widget::event()` then checks for `Handler` components and calls the `Element::event` method.

This means if you have multiple `Handler`s for the *same event type* on different widgets, they will all be called. For more complex scenarios, you might need to build your own event routing or bubbling system on top of this, or prefer using `State` updates for communication over direct event dispatch between deeply nested components.

However, for simple communication like the `UserLoginEvent` example, dispatching directly to the target widget (once found) is efficient.

Custom events are a powerful tool for decoupling concerns and enabling clear communication between different parts of your OSUI application, allowing you to build more complex and modular UIs.



