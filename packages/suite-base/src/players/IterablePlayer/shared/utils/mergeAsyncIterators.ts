// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Heap } from "heap-js";

import { toMillis } from "@lichtblick/rostime";
import { IteratorResult } from "@lichtblick/suite-base/players/IterablePlayer/IIterableSource";

export async function* mergeAsyncIterators<T extends IteratorResult>(
  iterators: AsyncIterableIterator<T>[],
): AsyncIterableIterator<T> {
  const heap = new Heap<{ value: T; iterator: AsyncIterableIterator<T> }>(
    (a, b) => getTime(a.value) - getTime(b.value),
  );

  await Promise.all(
    iterators.map(async (iterator) => {
      const result = await iterator.next();
      if (!(result.done ?? false)) {
        heap.push({ value: result.value, iterator });
      }
    }),
  );

  while (!heap.isEmpty()) {
    const node = heap.pop()!;
    yield node.value;

    const nextResult = await node.iterator.next();
    if (!(nextResult.done ?? false)) {
      heap.push({ value: nextResult.value, iterator: node.iterator });
    }
  }
}

function getTime(event: IteratorResult): number {
  if (event.type === "message-event") {
    return toMillis(event.msgEvent.receiveTime);
  }
  if (event.type === "stamp") {
    return toMillis(event.stamp);
  }
  return Number.MAX_SAFE_INTEGER;
}
