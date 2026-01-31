---
sidebar_position: 3
title: Event Propagation
---

# Event Propagation

Event propagation in OSUI describes how events traverse the component tree after they are emitted. Understanding this model is crucial for designing effective inter-component communication and responsive user interfaces.

## Unidirectional Propagation: Downwards

OSUI employs a unidirectional event propagation model, primarily **downwards** through the component tree. When an event is emitted from a component's `Context`, it follows this path:

1.  **Current Context**: All `on_event` handlers registered on the `Context` that emitted the event are invoked first.
2.  **Child Contexts**: The event is then recursively propagated to all immediate children's `Context`s, and from there, further down to their children, and so on, until it reaches the leaves of the component tree. Each child `Context` will also invoke its own registered `on_event` handlers for that event type.

This means an event emitted by an ancestor component will reach all its descendants. An event emitted by a child component will reach its parents (if the parent `Context` has `on_event` handlers for it) and all its siblings and their descendants.

```mermaid
graph TD
    A[Root Component Context] --> B(Child A Context)
    A --> C(Child B Context)
    B --> D(Grandchild A1 Context)
    B --> E(Grandchild A2 Context)
    C --> F(Grandchild B1 Context)

    subgraph Event Propagation (emit_event from D)
        D -- handlers on D --> D
        D -- propagate --> B
        B -- handlers on B --> B
        B -- propagate --> E
        E -- handlers on E --> E
        B -- propagate --> A
        A -- handlers on A --> A
        A -- propagate --> C
        C -- handlers on C --> C
        C -- propagate --> F
        F -- handlers on F --> F
    end
```

### Methods for Event Emission

*   **`cx.emit_event(event: E)`**:
    *   This is the standard method for emitting events.
    *   It processes event handlers synchronously in the current thread. This means that subsequent code execution will wait for all handlers (and their propagation to children) to complete.
    *   Useful for events where the order of execution matters or where the handler logic is quick.

*   **`cx.emit_event_threaded(event: &E)`**:
    *   This method processes event handlers asynchronously by spawning a new `std::thread` for *each* registered handler.
    *   The event object `E` must implement `Clone` because each handler receives its own cloned copy.
    *   Useful for events that might trigger long-running or blocking operations, preventing them from freezing the UI. The event propagation down the tree also uses the threaded approach.

## Practical Implications

### Parent-to-Child Communication (Implicit)

If a parent component emits an event, all its child components (and their children) that have `on_event` handlers for that specific event type will receive it. This is a powerful way for ancestors to broadcast information or commands to their descendants.

```rust
// Parent emits a "Refresh" event
cx.emit_event(RefreshEvent {});

// Child listens for "Refresh" event
cx.on_event(|_cx, _event: &RefreshEvent| {
    // Perform refresh logic
});
```

### Child-to-Parent/Sibling Communication (Explicit)

A child component can effectively communicate with its parent or siblings by emitting an event. Because events propagate downwards from the emitting `Context` *and then* to all its children (and subsequently to its parent's other children, if any), the parent and siblings will receive the event if they are listening for it.

```rust
// Child component
#[component]
fn Child(cx: &Arc<Context>) -> View {
    // ... logic to decide when to emit
    cx.emit_event(ChildActionCompleted { data: "success".to_string() });
    // ...
}

// Parent component
#[component]
fn Parent(cx: &Arc<Context>) -> View {
    cx.on_event(|_cx, event: &ChildActionCompleted| {
        println!("Parent received action from child: {:?}", event.data);
    });
    rsx! { Child {} }.view(&cx)
}
```

### Decoupling Components

Event handling promotes a decoupled architecture. Components don't need direct references to each other to communicate; they only need to agree on common event types. This makes components more independent and easier to reuse.

## When to use `emit_event` vs. `emit_event_threaded`

*   **`emit_event`**: Use for most general-purpose events where handlers are quick, or you need strict sequential processing, or if you don't want the overhead of spawning many threads.
*   **`emit_event_threaded`**: Use for events that might trigger expensive, long-running, or I/O-bound operations in their handlers. This prevents the main rendering loop from blocking, ensuring a responsive UI. Be mindful of potential race conditions if multiple threads modify shared state (though `State<T>`'s `Mutex` helps mitigate this).

Understanding OSUI's downward event propagation is key to designing robust and reactive component interactions within your TUI applications.

**Next:** Get insights into how your UI transforms from `View`s to terminal output in [The Rendering Pipeline](./04-rendering-pipeline.md).
