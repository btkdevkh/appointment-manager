// @vitest-environment jsdom
// The first component-rendering tests in the suite: `renderHook` covers the
// hooks, but a dialog's whole job is what it puts on screen and when.
import {afterEach, describe, expect, it, vi} from "vitest";
import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import Modal from "@/components/ui/Modal";

// Vitest runs without `globals`, so RTL can't register its own auto-cleanup.
afterEach(cleanup);

const overlay = () => document.querySelector('div[aria-hidden="true"]');

const setup = ({open = true} = {}) => {
  const onClose = vi.fn();
  const view = render(
    <Modal open={open} onClose={onClose} title="Titre du dialogue">
      <p>Contenu</p>
    </Modal>
  );
  return {onClose, view};
};

describe("Modal", () => {
  it("renders nothing while closed", () => {
    setup({open: false});

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByText("Contenu")).toBeNull();
  });

  it("renders its title and children once open", () => {
    setup();

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Contenu")).toBeTruthy();
    expect(
      screen.getByRole("heading", {name: "Titre du dialogue"})
    ).toBeTruthy();
  });

  // The heading is rendered by the Modal precisely so this wiring can't be
  // forgotten by a caller — a dialog announced as just "dialog" is useless.
  it("labels the dialog with its own heading", () => {
    setup();

    const dialog = screen.getByRole("dialog");
    const heading = screen.getByRole("heading", {name: "Titre du dialogue"});

    expect(dialog.getAttribute("aria-labelledby")).toBe(heading.id);
    expect(heading.id).not.toBe("");
  });

  it("closes on Escape", () => {
    const {onClose} = setup();

    fireEvent.keyDown(document, {key: "Escape"});

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ignores other keys", () => {
    const {onClose} = setup();

    fireEvent.keyDown(document, {key: "Enter"});

    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes on an overlay click", () => {
    const {onClose} = setup();

    fireEvent.click(overlay()!);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // Clicking a field or a button inside the panel must not dismiss the dialog.
  it("stays open when the panel itself is clicked", () => {
    const {onClose} = setup();

    fireEvent.click(screen.getByText("Contenu"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not listen for Escape while closed", () => {
    const {onClose} = setup({open: false});

    fireEvent.keyDown(document, {key: "Escape"});

    expect(onClose).not.toHaveBeenCalled();
  });

  it("detaches its key listener on unmount", () => {
    const {onClose, view} = setup();

    view.unmount();
    fireEvent.keyDown(document, {key: "Escape"});

    expect(onClose).not.toHaveBeenCalled();
  });
});
