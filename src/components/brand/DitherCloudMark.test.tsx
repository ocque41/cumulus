import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DitherCloudMark } from "./DitherCloudMark";

afterEach(cleanup);

describe("DitherCloudMark", () => {
  it("renders an accessible dithered brand mark without raster assets", () => {
    const { container } = render(<DitherCloudMark />);

    expect(screen.getByRole("img", { name: "Cumulus dither cloud" })).toBeVisible();
    expect(container.querySelector("pattern circle")).not.toBeNull();
    expect(container.querySelector(".dither-cloud-mark__signal")).not.toBeNull();
    expect(container.querySelector("image")).toBeNull();
  });

  it("becomes silent when it supports an existing text wordmark", () => {
    const { container } = render(<DitherCloudMark decorative />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
