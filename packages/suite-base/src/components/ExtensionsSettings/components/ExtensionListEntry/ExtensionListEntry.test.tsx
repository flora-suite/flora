/** @jest-environment jsdom */

// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import { render, screen, fireEvent } from "@testing-library/react";

import { Immutable } from "@lichtblick/suite";
import { ExtensionMarketplaceDetail } from "@lichtblick/suite-base/context/ExtensionMarketplaceContext";
import BasicBuilder from "@lichtblick/suite-base/testing/builders/BasicBuilder";
import "@testing-library/jest-dom";

import ExtensionListEntry from "./ExtensionListEntry";

describe("ExtensionListEntry Component", () => {
  const mockEntry: Immutable<ExtensionMarketplaceDetail> = {
    id: BasicBuilder.string(),
    name: BasicBuilder.string(),
    qualifiedName: BasicBuilder.string(),
    description: BasicBuilder.string(),
    publisher: BasicBuilder.string(),
    homepage: BasicBuilder.string(),
    license: BasicBuilder.string(),
    version: BasicBuilder.string(),
  };

  const mockOnClick = jest.fn();

  it("renders primary text with name and highlights search text", () => {
    render(
      <ExtensionListEntry entry={mockEntry} searchText={mockEntry.name} onClick={mockOnClick} />,
    );

    const name = screen.getByText(new RegExp(mockEntry.name, "i"));
    expect(name).toBeInTheDocument();

    const highlightedText = screen.getByText(new RegExp(mockEntry.name, "i"));
    expect(highlightedText).toBeInTheDocument();
    expect(highlightedText.tagName).toBe("SPAN");
  });

  it("renders secondary text with description and publisher", () => {
    render(
      <ExtensionListEntry entry={mockEntry} searchText={mockEntry.name} onClick={mockOnClick} />,
    );

    const description = screen.getByText(new RegExp(mockEntry.description, "i"));
    expect(description).toBeInTheDocument();

    const publisher = screen.getByText(new RegExp(mockEntry.publisher, "i"));
    expect(publisher).toBeInTheDocument();
  });

  it("displays version next to name", () => {
    render(
      <ExtensionListEntry entry={mockEntry} searchText={mockEntry.name} onClick={mockOnClick} />,
    );

    // Check for version
    const version = screen.getByText(new RegExp(mockEntry.version, "i"));
    expect(version).toBeInTheDocument();
  });

  it("calls onClick when ListItemButton is clicked", () => {
    render(<ExtensionListEntry entry={mockEntry} searchText="" onClick={mockOnClick} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
