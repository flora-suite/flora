// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import clipboard from "@lichtblick/suite-base/util/clipboard";

import CopyButton from "./CopyButton";

jest.mock("@lichtblick/suite-base/util/clipboard", () => ({ copy: jest.fn() }));

describe("CopyButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("copies generated text and displays success feedback", async () => {
    (clipboard.copy as jest.Mock).mockResolvedValue(undefined);
    render(<CopyButton getText={() => "copied text"} />);
    fireEvent.click(screen.getByRole("button"));
    expect(clipboard.copy).toHaveBeenCalledWith("copied text");
    await waitFor(() =>
      expect(screen.getByRole("button").classList.contains("MuiIconButton-colorSuccess")).toBe(
        true,
      ),
    );
  });

  it("renders a text button and handles failed clipboard writes", async () => {
    (clipboard.copy as jest.Mock).mockRejectedValue(new Error("denied"));
    render(<CopyButton getText={() => "text"}>Copy value</CopyButton>);
    fireEvent.click(screen.getByRole("button", { name: "Copy value" }));
    await waitFor(() => expect(console.warn).toHaveBeenCalled());
    expect(clipboard.copy).toHaveBeenCalledWith("text");
    (console.warn as jest.Mock).mockClear();
  });

  it("supports the small and large icon variants", async () => {
    (clipboard.copy as jest.Mock).mockResolvedValue(undefined);
    const { rerender } = render(<CopyButton getText={() => "small"} iconSize="small" />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() =>
      expect(screen.getByRole("button").getAttribute("aria-label")).toBe("Copied"),
    );
    rerender(<CopyButton getText={() => "large"} iconSize="large" />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(clipboard.copy).toHaveBeenCalledWith("large"));
  });
});
