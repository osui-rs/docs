# API Reference

This section provides detailed documentation for all public modules, structs, enums, traits, and macros within the OSUI library.

## Core Concepts & Structure

*   [Screen](/docs/reference/screen): The main application context for managing widgets and extensions.
*   [Widget Model](/docs/reference/widget): `Element`, `Component`, `Widget` (Static/Dynamic), and `WidgetLoad`.
*   [Rendering & Scope](/docs/reference/render-scope): `RenderScope`, `RenderMethod`, and `ElementRenderer`.
*   [State Management](/docs/reference/state): `State<T>` and `DependencyHandler` for reactivity.
*   [Frontend & Macros](/docs/reference/frontend): `RsxElement`, `Rsx`, and the `event!`, `component!`, `transform!`, `rsx!` macros.
*   [Utilities](/docs/reference/utils): Helper functions for terminal control and string manipulation.

## Built-in Components & Extensions

*   [Style & Layout](/docs/reference/style): `Transform`, `Position`, `Dimension`, `Style`, `Background`.
*   [Extensions Overview](/docs/reference/extensions): The `Extension` trait, `Event` trait, and `Context` for global behaviors.
*   [Focus Extension](/docs/reference/extensions/focus): `AlwaysFocused`, `Focused`, `RelativeFocusExtension` for keyboard navigation.
*   [ID Extension](/docs/reference/extensions/id): `IdExtension`, `Id` for unique widget identification.
*   [Input Handling Extension](/docs/reference/extensions/input_handling): `InputExtension` for keyboard and mouse input.
*   [Tick Extension](/docs/reference/extensions/tick): `TickExtension`, `TickEvent` for timed events.
*   [Velocity Extension](/docs/reference/extensions/velocity): `VelocityExtension`, `Velocity` for simple animations.

## Built-in UI Elements

*   [Elements Overview](/docs/reference/elements): General Element trait and String as an Element.
*   [Div](/docs/reference/elements/div): A generic container element.
*   [Flex Containers](/docs/reference/elements/flex): `FlexRow` and `FlexCol` for automatic horizontal/vertical layout.
*   [Heading](/docs/reference/elements/heading): Renders large ASCII art text.
*   [Input](/docs/reference/elements/input): An interactive text input field.
*   [Paginator](/docs/reference/elements/paginator): Manages and navigates between multiple pages/children.
