// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { JsonMessageWriter } from "@lichtblick/suite-base/players/FoxgloveWebSocketPlayer/JsonMessageWriter";

describe("JsonMessageWriter", () => {
  const writer = new JsonMessageWriter();

  it("should return a message converted to a Uint8Array", () => {
    const message = { text: "test message" };

    const result = writer.writeMessage(message);

    expect(result).toHaveLength(result.length);
  });

  it("should return an empty Uint8array because the message recieved was undefined", () => {
    const message = undefined;

    const result = writer.writeMessage(message);
    const expected = new Uint8Array(Buffer.from(""));

    expect(result).toEqual(expected);
  });
});
