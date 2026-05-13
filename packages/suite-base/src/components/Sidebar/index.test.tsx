// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import { useWorkspaceActions } from "@lichtblick/suite-base/context/Workspace/useWorkspaceActions";

import { Sidebar } from "./index";

jest.mock("@lichtblick/suite-base/context/Workspace/useWorkspaceActions", () => ({
  useWorkspaceActions: jest.fn(),
}));

const mockNavigate = jest.fn();

jest.mock("react-router", () => {
  const actual = jest.requireActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Sidebar", () => {
  const openFile = jest.fn<Promise<boolean>, []>();

  beforeEach(() => {
    mockNavigate.mockReset();
    openFile.mockReset();

    (useWorkspaceActions as jest.Mock).mockReturnValue({
      dialogActions: {
        openFile: { open: openFile },
        dataSource: { open: jest.fn() },
      },
    });
  });

  function renderSidebar() {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );
  }

  it("does not navigate to view when local file selection is cancelled", async () => {
    openFile.mockResolvedValue(false);

    renderSidebar();
    fireEvent.click(screen.getByText("Open local file(s)"));

    await waitFor(() => {
      expect(openFile).toHaveBeenCalled();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("navigates to view when local file selection succeeds", async () => {
    openFile.mockResolvedValue(true);

    renderSidebar();
    fireEvent.click(screen.getByText("Open local file(s)"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/view");
    });
  });
});
