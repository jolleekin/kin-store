/**
 * The listener callback passed to {@linkcode Store.subscribe}.
 *
 * @template TState The type of the state this listener observes.
 *
 * @param get The function to get the latest state.
 * This is a function rather than the current state to allow derived stores to
 * compute its state lazily.
 * @param prevState The previous state.
 */
export type Listener<TState> = (
  get: () => TState,
  prevState: TState,
) => void;
