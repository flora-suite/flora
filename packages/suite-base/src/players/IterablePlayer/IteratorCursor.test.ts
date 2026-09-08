// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { IteratorCursor } from "./IteratorCursor";

async function* results(values: readonly unknown[]) {
  yield* values as never;
}

const stamp = (sec: number) => ({ type: "stamp" as const, stamp: { sec, nsec: 0 } });
const problem = { type: "problem" as const, connectionId: 1, problem: { message: "problem" } };
const message = (sec: number) =>
  ({ type: "message-event" as const, msgEvent: { receiveTime: { sec, nsec: 0 } } }) as never;

describe("IteratorCursor", () => {
  it("reads next values and batches through the time cutoff", async () => {
    const cursor = new IteratorCursor(results([stamp(1), stamp(3), stamp(4)]));

    await expect(cursor.next()).resolves.toEqual(stamp(1));
    await expect(cursor.nextBatch(500)).resolves.toEqual([stamp(3), stamp(4)]);
    await expect(cursor.nextBatch(500)).resolves.toBeUndefined();
  });

  it("ends a batch at a problem result", async () => {
    const cursor = new IteratorCursor(results([stamp(1), problem, stamp(2)]));

    await expect(cursor.nextBatch(1_000)).resolves.toEqual([stamp(1), problem]);
    await expect(cursor.next()).resolves.toEqual(stamp(2));
  });

  it("handles a problem as the first batch result and message-event cutoffs", async () => {
    await expect(new IteratorCursor(results([problem])).nextBatch(1_000)).resolves.toEqual([
      problem,
    ]);
    await expect(
      new IteratorCursor(results([message(1), message(3)])).nextBatch(1_000),
    ).resolves.toEqual([message(1), message(3)]);
  });

  it("keeps the first value past a read-until boundary for the next call", async () => {
    const cursor = new IteratorCursor(results([stamp(1), stamp(3), stamp(4)]));

    await expect(cursor.readUntil({ sec: 2, nsec: 0 })).resolves.toEqual([stamp(1)]);
    await expect(cursor.readUntil({ sec: 2, nsec: 0 })).resolves.toEqual([]);
    await expect(cursor.readUntil({ sec: 4, nsec: 0 })).resolves.toEqual([stamp(3)]);
    await expect(
      new IteratorCursor(results([stamp(1)])).readUntil({ sec: 2, nsec: 0 }),
    ).resolves.toEqual([stamp(1)]);
  });

  it("returns undefined when aborted and closes iterators", async () => {
    const controller = new AbortController();
    const iterator = results([stamp(1)]);
    const returnSpy = jest.spyOn(iterator, "return");
    const cursor = new IteratorCursor(iterator, controller.signal);

    controller.abort();
    await expect(cursor.next()).resolves.toBeUndefined();
    await expect(cursor.readUntil({ sec: 1, nsec: 0 })).resolves.toBeUndefined();
    await cursor.end();
    expect(returnSpy).toHaveBeenCalled();
  });
});
