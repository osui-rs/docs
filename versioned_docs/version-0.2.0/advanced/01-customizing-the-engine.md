markdown
---
sidebar_position: 1
title: Customizing the Engine
---

# Customizing the Engine

OSUI's `Engine` and `CommandExecutor` traits are designed to be highly extensible. While the `Console` engine provides `crossterm`-based terminal rendering, you might want to create a custom engine for various reasons:

*   **Different Rendering Backend**: Render to a graphical window (e.g., using `minifb` or `pixels`), a web canvas, or a specific hardware display.
*   **Headless Testing**: Create a dummy engine that doesn't render anything but processes all commands and component logic, useful for fast unit or integration tests.
*   **Logging/Debugging**: An engine that logs all `DrawInstruction`s to a file for analysis.
*   **Specialized Behavior**: Implement custom render loops, input handling, or command processing.

This guide will walk you through the process of implementing your own `Engine` and `CommandExecutor`.

## Implementing `CommandExecutor`

First, let's define a custom `CommandExecutor`. This trait is responsible for processing commands issued by components (e.g., `cx.stop()`).

```rust
use osui::prelude::*;
use std::{
    any::Any,
    sync::{Arc, Mutex},
};

// Define a custom command
#[derive(Debug, Clone)]
pub struct CustomCommand(pub String);

impl Command for CustomCommand {
    fn as_any(&self) -> &dyn Any {
        self
    }
}

pub struct MyCustomExecutor {
    running: Mutex<bool>,
    received_commands: Mutex<Vec<CustomCommand>>,
}

impl MyCustomExecutor {
    pub fn new() -> Arc<Self> {
        Arc::new(Self {
            running: Mutex::new(true),
            received_commands: Mutex::new(Vec::new()),
        })
    }

    pub fn stop_engine(&self) -> crate::Result<()> {
        *self.running.lock()? = false;
        Ok(())
    }

    pub fn get_status(&self) -> bool {
        *self.running.lock().unwrap()
    }

    pub fn get_received_commands(&self) -> Vec<CustomCommand> {
        self.received_commands.lock().unwrap().clone()
    }
}

impl CommandExecutor for MyCustomExecutor {
    fn execute_command(&self, command: &Arc<dyn Command>) -> crate::Result<()> {
        let command_any = command.as_any();

        // Handle built-in Stop command
        if let Some(commands::Stop) = command_any.downcast_ref::<commands::Stop>() {
            println!("MyCustomExecutor: Received Stop command.");
            return self.stop_engine();
        }

        // Handle our custom command
        if let Some(custom_cmd) = command_any.downcast_ref::<CustomCommand>() {
            println!("MyCustomExecutor: Received CustomCommand: {:?}", custom_cmd);
            self.received_commands.lock().unwrap().push(custom_cmd.clone());
            return Ok(());
        }

        println!("MyCustomExecutor: Unhandled command.");
        Ok(())
    }
}
```

## Implementing `Engine`

Now, let's create a simple "headless" engine that doesn't draw to the terminal but just logs rendering events.

```rust
use osui::prelude::*;
use std::sync::Arc;

pub struct MyHeadlessEngine {
    executor: Arc<MyCustomExecutor>,
    log_output: Mutex<Vec<String>>,
}

impl MyHeadlessEngine {
    pub fn new() -> Self {
        Self {
            executor: MyCustomExecutor::new(),
            log_output: Mutex::new(Vec::new()),
        }
    }

    // Helper to log messages
    fn log(&self, msg: &str) {
        self.log_output.lock().unwrap().push(msg.to_string());
    }

    pub fn get_log(&self) -> Vec<String> {
        self.log_output.lock().unwrap().clone()
    }
}

impl Engine for MyHeadlessEngine {
    fn run<C: ComponentImpl + 'static>(&self, component: C) -> crate::Result<()> {
        self.log("Engine: Initializing component...");
        let cx = self.init(component);

        while self.executor.get_status() {
            self.log("Engine: Starting render cycle...");
            self.render(&cx);
            self.log("Engine: Render cycle complete. Delaying...");
            self.render_delay(); // Use default delay or implement custom
        }

        self.log("Engine: Application stopped.");
        Ok(())
    }

    fn init<C: ComponentImpl + 'static>(&self, component: C) -> Arc<Context> {
        // Perform any setup needed for your custom engine
        self.log("Engine: Component initialized.");
        let cx = Context::new(component, self.executor.clone());
        cx.refresh(); // Initial render of the component
        cx
    }

    fn render(&self, cx: &Arc<Context>) {
        let area = Area { x: 0, y: 0, width: 80, height: 24 }; // Define a virtual screen size
        let draw_ctx = self.render_view(&area, &cx.get_view());
        self.draw_context(&draw_ctx);
    }

    // No actual delay for headless, or keep default for testing loop speed
    fn render_delay(&self) {
        // crate::sleep(16); // Uncomment for actual delay
    }

    fn render_view(&self, area: &Area, view: &View) -> DrawContext {
        self.log(&format!("Engine: Rendering view in area: {:?}", area));
        let mut context = DrawContext::new(area.clone());
        view(&mut context); // Execute the View closure to populate DrawContext
        context
    }

    fn draw_context(&self, ctx: &DrawContext) {
        self.log(&format!("Engine: Drawing context with {} instructions.", ctx.drawing.len()));
        for inst in &ctx.drawing {
            match inst {
                DrawInstruction::Text(point, text) => self.log(&format!("  Draw Text at {:?}: '{}'", point, text)),
                DrawInstruction::View(area, view) => {
                    self.log(&format!("  Draw Child View in area: {:?}", area));
                    self.draw_context(&self.render_view(area, view)); // Recursively render child views
                },
                DrawInstruction::Child(point, child_ctx) => {
                    self.log(&format!("  Draw Child DrawContext at {:?}.", point));
                    self.draw_context(child_ctx); // Recursively draw child contexts
                },
            }
        }
    }

    fn executor(&self) -> Arc<dyn CommandExecutor> {
        self.executor.clone()
    }
}
```

## Using Your Custom Engine

```rust
use osui::prelude::*;
use std::sync::Arc;

// (Include MyHeadlessEngine, MyCustomExecutor, CustomCommand definitions here)

#[component]
fn MyApp(cx: &Arc<Context>) -> View {
    let counter = use_state(0);

    use_effect(
        {
            let cx = cx.clone();
            let counter = counter.clone();
            move || {
                // Periodically increment counter and emit custom command
                loop {
                    sleep(200);
                    let new_val = *counter.get() + 1;
                    counter.set(new_val);
                    if new_val >= 3 {
                        cx.execute(CustomCommand(format!("Counter reached {}", new_val))).expect("Cmd failed");
                        cx.stop().expect("Stop failed");
                        break;
                    }
                }
            }
        },
        &[], // Run once on mount
    );

    rsx! {
        format!("Counter value: {}", counter.get_dl())
    }.view(&cx)
}

fn main() {
    let my_engine = MyHeadlessEngine::new();
    let executor = my_engine.executor.clone(); // Get a reference to the executor

    my_engine.run(MyApp {}).expect("Failed to run custom engine");

    println!("\n--- Engine Log ---");
    for line in my_engine.get_log() {
        println!("{}", line);
    }

    println!("\n--- Received Commands ---");
    for cmd in executor.get_received_commands() {
        println!("{:?}", cmd);
    }
}
```

### Explanation:

1.  **`MyCustomExecutor`**: Implements `CommandExecutor`. It handles the built-in `commands::Stop` and our new `CustomCommand`. It also keeps a log of received custom commands for verification.
2.  **`MyHeadlessEngine`**: Implements `Engine`.
    *   It takes `MyCustomExecutor` as its command executor.
    *   `run` method establishes a basic loop that continues as long as `executor.get_status()` is `true`.
    *   `render` orchestrates the `render_view` and `draw_context` calls.
    *   `render_view` executes the component `View` and collects `DrawInstruction`s.
    *   `draw_context` iterates through `DrawInstruction`s, logging them instead of actually drawing to a terminal. It recursively handles `DrawInstruction::View` and `DrawInstruction::Child`.
3.  **`MyApp` Component**:
    *   Uses `use_state` for a counter.
    *   Uses `use_effect` to periodically increment the counter.
    *   When the counter reaches 3, it `execute`s our `CustomCommand` and then `stop()`s the engine.
4.  **`main` Function**:
    *   Instantiates `MyHeadlessEngine`.
    *   Calls `my_engine.run(MyApp {})`.
    *   After the engine stops, it prints the internal log and received commands from the executor, allowing you to verify that component logic and commands were processed correctly.

By following this pattern, you can integrate OSUI's powerful component and state management system with virtually any rendering or execution environment you desire.

**Next:** Dive into the internals of OSUI's macro system in [Internals: Macros](./02-internals-macros.md).
