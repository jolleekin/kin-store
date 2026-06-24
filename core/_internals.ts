import type { Listener } from "./_types.ts";

export const IS_STORE = Symbol();

export function throwError(msg: string): never {
  throw new Error(msg);
}

export function notify<TState>(
  listeners: Set<Listener<TState>>,
  getState: () => TState,
  prevState: TState,
): void {
  for (const listener of Array.from(listeners)) {
    listener(getState, prevState);
  }
}
