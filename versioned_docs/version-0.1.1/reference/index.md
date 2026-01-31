# API Reference

This section provides detailed documentation for all public modules, structs, enums, traits, and macros within the OSUI library.

## Core Concepts & Structure

*   [Screen](/docs/0.1.1/reference/screen): The main application context for managing widgets and extensions.
*   [Widget Model](/docs/0.1.1/reference/widget): `Element`, `Component`, `Widget` (Static/Dynamic), and `WidgetLoad`.
*   [Rendering & Scope](/docs/0.1.1/reference/render-scope): `RenderScope`, `RenderMethod`, and `ElementRenderer`.
*   [State Management](/docs/0.1.1/reference/state): `State<T>` and `DependencyHandler` for reactivity.
*   [Frontend & Macros](/docs/0.1.1/reference/frontend): `RsxElement`, `Rsx`, and the `event!`, `component!`, `transform!`, `rsx!` macros.
*   [Utilities](/docs/0.1.1/reference/utils): Helper functions for terminal control and string manipulation.

## Built-in Components & Extensions

*   [Style & Layout](/docs/0.1.1/reference/style): `Transform`, `Position`, `Dimension`, `Style`, `Background`.
*   [Extensions Overview](/docs/0.1.1/reference/extensions): The `Extension` trait, `Event` trait, and `Context` for global behaviors.
*   [Focus Extension](/docs/0.1.1/reference/extensions/focus): `AlwaysFocused`, `Focused`, `RelativeFocusExtension` for keyboard navigation.
*   [ID Extension](/docs/0.1.1/reference/extensions/id): `IdExtension`, `Id` for unique widget identification.
*   [Input Handling Extension](/docs/0.1.1/reference/extensions/input_handling): `InputExtension` for keyboard and mouse input.
*   [Tick Extension](/docs/0.1.1/reference/extensions/tick): `TickExtension`, `TickEvent` for timed events.
*   [Velocity Extension](/docs/0.1.1/reference/extensions/velocity): `VelocityExtension`, `Velocity` for simple animations.

## Built-in UI Elements

*   [Elements Overview](/docs/0.1.1/reference/elements): General Element trait and String as an Element.
*   [Div](/docs/0.1.1/reference/elements/div): A generic container element.
*   [Flex Containers](/docs/0.1.1/reference/elements/flex): `FlexRow` and `FlexCol` for automatic horizontal/vertical layout.
*   [Heading](/docs/0.1.1/reference/elements/heading): Renders large ASCII art text.
*   [Input](/docs/0.1.1/reference/elements/input): An interactive text input field.
*   [Paginator](/docs/0.1.1/reference/elements/paginator): Manages and navigates between multiple pages/children.
