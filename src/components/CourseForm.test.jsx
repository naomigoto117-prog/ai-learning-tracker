import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CourseForm from "./CourseForm";

const defaultForm = {
  title: "",
  platform: "",
  url: "",
  category: "",
  progress: 0,
  status: "Not Started",
  deadline: "",
};

const defaultErrors = {};

function renderCourseForm(overrides = {}) {
  const props = {
    form: defaultForm,
    errors: defaultErrors,
    onChange: vi.fn(),
    onSubmit: vi.fn((event) => event.preventDefault()),
    submitLabel: "Save Course",
    ...overrides,
  };

  render(<CourseForm {...props} />);

  return props;
}

describe("CourseForm", () => {
  it("renders all course fields", () => {
    renderCourseForm();

    expect(
      screen.getByRole("textbox", {
        name: /course title/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("textbox", {
        name: /platform/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("textbox", {
        name: /course link/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("textbox", {
        name: /category/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("spinbutton", {
        name: /progress/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("combobox", {
        name: /status/i,
      })
    ).toBeDisabled();

    expect(
      screen.getByLabelText(/target completion date/i)
    ).toBeInTheDocument();
  });

  it("renders the supplied form values", () => {
    renderCourseForm({
      form: {
        title: "Python for AI",
        platform: "freeCodeCamp",
        url: "https://example.com/course",
        category: "Programming",
        progress: 60,
        status: "In Progress",
        deadline: "2026-09-30",
      },
    });

    expect(
      screen.getByDisplayValue("Python for AI")
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue("freeCodeCamp")
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue(
        "https://example.com/course"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue("Programming")
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue("60")
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue("In Progress")
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue("2026-09-30")
    ).toBeInTheDocument();
  });

  it("calls onChange when the title is edited", () => {
    const { onChange } = renderCourseForm();

    const titleInput = screen.getByRole("textbox", {
      name: /course title/i,
    });

    fireEvent.change(titleInput, {
      target: {
        name: "title",
        value: "Machine Learning Basics",
      },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("calls onSubmit when the form is submitted", () => {
    const { onSubmit } = renderCourseForm();

    fireEvent.click(
      screen.getByRole("button", {
        name: /save course/i,
      })
    );

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("shows validation errors", () => {
    renderCourseForm({
      errors: {
        title: "Course title is required.",
        platform: "Platform is required.",
        category: "Category is required.",
        progress:
          "Progress must be between 0 and 100.",
        deadline:
          "Target completion date is required.",
      },
    });

    expect(
      screen.getByText("Course title is required.")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Platform is required.")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Category is required.")
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Progress must be between 0 and 100."
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Target completion date is required."
      )
    ).toBeInTheDocument();
  });
});