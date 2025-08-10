# API Reference

This section provides detailed documentation for all public modules, structs, enums, traits, and macros within the OSUI library.

## Core Concepts & Structure

*   [Screen](../reference/screen.md): The main application context for managing widgets and extensions.
*   [Widget Model](../reference/widget.md): `Element`, `Component`, `Widget` (Static/Dynamic), and `WidgetLoad`.
*   [Rendering & Scope](../reference/render-scope.md): `RenderScope`, `RenderMethod`, and `ElementRenderer`.
*   [State Management](../reference/state.md): `State<T>` and `DependencyHandler` for reactivity.
*   [Frontend & Macros](../reference/frontend.md): `RsxElement`, `Rsx`, and the `event!`, `component!`, `transform!`, `rsx!` macros.
*   [Utilities](../reference/utils.md): Helper functions for terminal control and string manipulation.

## Built-in Components & Extensions

*   [Style & Layout](../reference/style.md): `Transform`, `Position`, `Dimension`, `Style`, `Background`.
*   [Extensions Overview](../reference/extensions.md): The `Extension` trait, `Event` trait, and `Context` for global behaviors.
*   [Focus Extension](../reference/extensions/focus.md): `AlwaysFocused`, `Focused`, `RelativeFocusExtension` for keyboard navigation.
*   [ID Extension](../reference/extensions/id.md): `IdExtension`, `Id` for unique widget identification.
*   [Input Handling Extension](../reference/extensions/input_handling.md): `InputExtension` for keyboard and mouse input.
*   [Tick Extension](../reference/extensions/tick.md): `TickExtension`, `TickEvent` for timed events.
*   [Velocity Extension](../reference/extensions/velocity.md): `VelocityExtension`, `Velocity` for simple animations.

## Built-in UI Elements

*   [Elements Overview](../reference/elements.md): General Element trait and String as an Element.
*   [Div](../reference/elements/div.md): A generic container element.
*   [Flex Containers](../reference/elements/flex.md): `FlexRow` and `FlexCol` for automatic horizontal/vertical layout.
*   [Heading](../reference/elements/heading.md): Renders large ASCII art text.
*   [Input](../reference/elements/input.md): An interactive text input field.
*   [Paginator](../reference/elements/paginator.md): Manages and navigates between multiple pages/children.
