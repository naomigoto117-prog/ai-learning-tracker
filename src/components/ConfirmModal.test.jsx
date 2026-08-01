import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ConfirmModal from "./ConfirmModal";

function renderModal(overrides = {}) {
  const props = {
    isOpen: true,
    title: "Delete course?",
    message: "This action cannot be undone.",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };

  render(<ConfirmModal {...props} />);

  return props;
}

describe("ConfirmModal", () => {
  it("does not render when closed", () => {
    renderModal({
      isOpen: false,
    });

    expect(
      screen.queryByRole("dialog")
    ).not.toBeInTheDocument();
  });

  it("renders the dialog when open", () => {
    renderModal();

    expect(
      screen.getByRole("dialog")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Delete course?")
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "This action cannot be undone."
      )
    ).toBeInTheDocument();
  });

  it("calls onConfirm when the confirm button is clicked", () => {
    const { onConfirm } = renderModal();

    fireEvent.click(
      screen.getByRole("button", {
        name: /delete|confirm/i,
      })
    );

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when the cancel button is clicked", () => {
    const { onCancel } = renderModal();

    fireEvent.click(
      screen.getByRole("button", {
        name: /cancel/i,
      })
    );

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("has an accessible modal title", () => {
    renderModal();

    const dialog =
      screen.getByRole("dialog");

    expect(dialog).toHaveAttribute(
      "aria-modal",
      "true"
    );

    expect(dialog).toHaveAccessibleName(
      "Delete course?"
    );
  });
});