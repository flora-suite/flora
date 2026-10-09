// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import showOpenFilePicker from "./showOpenFilePicker";

describe("showOpenFilePicker", () => {
  afterEach(() => {
    delete (window as unknown as { showOpenFilePicker?: unknown }).showOpenFilePicker;
    jest.restoreAllMocks();
  });

  it("uses the native picker when available", async () => {
    const handles = [{ name: "file" }] as never;
    const picker = jest.fn().mockResolvedValue(handles);
    (window as unknown as { showOpenFilePicker: typeof picker }).showOpenFilePicker = picker;

    await expect(showOpenFilePicker({ multiple: true })).resolves.toBe(handles);
    expect(picker).toHaveBeenCalledWith({ multiple: true });
  });

  it("converts native picker cancellation to an empty selection", async () => {
    const picker = jest.fn().mockRejectedValue({ name: "AbortError" });
    (window as unknown as { showOpenFilePicker: typeof picker }).showOpenFilePicker = picker;

    await expect(showOpenFilePicker()).resolves.toEqual([]);
  });

  it("uses a configured input fallback when the native picker is unavailable", async () => {
    const input = document.createElement("input");
    const file = new File(["content"], "data.csv", { type: "text/csv" });
    Object.defineProperty(input, "files", { value: [file] });
    jest.spyOn(input, "click").mockImplementation(() => input.onchange?.(new Event("change")));
    jest.spyOn(document, "createElement").mockReturnValue(input);

    const handles = await showOpenFilePicker({
      multiple: true,
      types: [{ accept: { "text/csv": [".csv"], "application/json": ".json" } }],
    });

    expect(input.multiple).toBe(true);
    expect(input.accept).toBe(".csv,.json");
    expect(handles).toHaveLength(1);
    expect(handles[0]!.name).toBe("data.csv");
    await expect(handles[0]!.getFile()).resolves.toBe(file);
  });

  it("propagates native picker failures other than cancellation", async () => {
    const picker = jest.fn().mockRejectedValue(new Error("not allowed"));
    (window as unknown as { showOpenFilePicker: typeof picker }).showOpenFilePicker = picker;
    await expect(showOpenFilePicker()).rejects.toThrow("not allowed");
  });
});
