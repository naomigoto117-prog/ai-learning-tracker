import {
    fireEvent,
    render,
    screen,
  } from "@testing-library/react";
  import {
    describe,
    expect,
    it,
    vi,
  } from "vitest";
  
  import ThemeToggle from "./ThemeToggle";
  
  describe("ThemeToggle", () => {
    it("renders the theme toggle button", () => {
      render(
        <ThemeToggle
          theme="light"
          onToggle={vi.fn()}
        />
      );
  
      expect(
        screen.getByRole("button")
      ).toBeInTheDocument();
    });
  
    it("calls onToggle when clicked", () => {
      const onToggle = vi.fn();
  
      render(
        <ThemeToggle
          theme="light"
          onToggle={onToggle}
        />
      );
  
      fireEvent.click(
        screen.getByRole("button")
      );
  
      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  
    it("shows Light when the current theme is light", () => {
      render(
        <ThemeToggle
          theme="light"
          onToggle={vi.fn()}
        />
      );
  
      expect(
        screen.getByRole("button")
      ).toHaveTextContent(/light/i);
    });
  
    it("shows Dark when the current theme is dark", () => {
      render(
        <ThemeToggle
          theme="dark"
          onToggle={vi.fn()}
        />
      );
  
      expect(
        screen.getByRole("button")
      ).toHaveTextContent(/dark/i);
    });
  });