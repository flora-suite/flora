// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

/** @jest-environment jsdom */

import { render } from "@testing-library/react";

import { useAppParameters } from "@lichtblick/suite-base/context/AppParametersContext";
import BasicBuilder from "@lichtblick/suite-base/testing/builders/BasicBuilder";

import AppParametersProvider from "./AppParametersProvider";

describe("AppParametersProvider", () => {
  it("provides app parameters to its children", () => {
    const mockParameters = { defaultLayout: BasicBuilder.string() };
    const TestComponent = () => {
      const appParameters = useAppParameters();
      return <div>{appParameters.defaultLayout}</div>;
    };

    const { getByText } = render(
      <AppParametersProvider appParameters={mockParameters}>
        <TestComponent />
      </AppParametersProvider>,
    );

    expect(getByText(mockParameters.defaultLayout)).toBeDefined();
  });

  it("provides default app parameters when none are given", () => {
    const TestComponent = () => {
      const appParameters = useAppParameters();
      expect(Object.keys(appParameters)).toHaveLength(0);
      return <div>{Object.keys(appParameters).length}</div>;
    };

    const { getByText } = render(
      <AppParametersProvider>
        <TestComponent />
      </AppParametersProvider>,
    );

    expect(getByText("0")).toBeDefined();
  });

  it("should throw an error if useAppParameters is called without AppParametersProvider", () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const TestComponent = () => {
      useAppParameters();
      return <div />;
    };

    expect(() => render(<TestComponent />)).toThrow();
    consoleErrorSpy.mockRestore();
  });
});
