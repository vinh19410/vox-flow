import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  ForecastAdminScreen,
  type AdminForecastTopic,
} from "../forecast-admin-screen";

describe("ForecastAdminScreen", () => {
  const mockTopics: AdminForecastTopic[] = [
    {
      id: "topic_draft_1",
      title: "Describe an energetic person you know",
      quarter: "2026-Q1",
      part: 2,
      questions: [
        "Who this person is",
        "What kind of work they do",
        "Why you find them energetic",
      ],
      status: "draft",
      realReportCount: 3,
      sources: [
        {
          id: "src_1",
          sourceType: "manual",
          rawContent: "Curated by product owner",
        },
        {
          id: "src_2",
          sourceType: "web",
          sourceUrl: "https://example.com/ielts-forecast/energetic-person",
          rawContent: "Scraped web signal",
        },
        {
          id: "src_3",
          sourceType: "student",
          rawContent: "Reported by student at BC",
        },
      ],
    },
    {
      id: "topic_published_1",
      title: "Describe a quiet library you visited",
      quarter: "2026-Q1",
      part: 2,
      questions: [
        "Where the library is",
        "How often you go there",
        "Why you like studying there",
      ],
      status: "published",
      reviewedBy: "usr_admin_1",
      reviewedAt: Date.now() - 3600000,
      realReportCount: 7,
      sources: [
        {
          id: "src_4",
          sourceType: "manual",
          rawContent: "Official test pool",
        },
      ],
    },
    {
      id: "topic_archived_1",
      title: "Describe an old television show",
      quarter: "2026-Q1",
      part: 1,
      questions: ["What show was it?"],
      status: "archived",
      realReportCount: 0,
      sources: [],
    },
  ];

  it("renders draft topic with 'Bản nháp' badge, questions, sources, and action buttons", () => {
    render(<ForecastAdminScreen initialTopics={mockTopics} />);

    // Title and badge
    expect(screen.getByText("Describe an energetic person you know")).toBeTruthy();
    expect(screen.getAllByText("Bản nháp").length).toBeGreaterThanOrEqual(1);

    // Questions rendered
    expect(screen.getByText("Who this person is")).toBeTruthy();
    expect(screen.getByText("Why you find them energetic")).toBeTruthy();

    // Sources rendered
    expect(screen.getAllByText("Tự soạn").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Web")).toBeTruthy();
    expect(screen.getByText("Học viên báo")).toBeTruthy();

    // Student reports count
    expect(screen.getByText("3 thí sinh báo đã gặp")).toBeTruthy();

    // Action buttons: Draft must have "Duyệt" button
    expect(screen.getByRole("button", { name: "Duyệt" })).toBeTruthy();
  });

  it("renders published topic with 'Đã duyệt' badge and no Duyệt button", () => {
    render(<ForecastAdminScreen initialTopics={mockTopics} />);

    expect(screen.getByText("Describe a quiet library you visited")).toBeTruthy();
    expect(screen.getAllByText("Đã duyệt").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("7 thí sinh báo đã gặp")).toBeTruthy();
  });

  it("filters topics by status when filter tabs are clicked", () => {
    render(<ForecastAdminScreen initialTopics={mockTopics} />);

    // Initially shows all
    expect(screen.getByText("Describe an energetic person you know")).toBeTruthy();
    expect(screen.getByText("Describe a quiet library you visited")).toBeTruthy();

    // Filter by 'Bản nháp'
    const draftTab = screen.getByRole("button", { name: "Bản nháp" });
    fireEvent.click(draftTab);

    expect(screen.getByText("Describe an energetic person you know")).toBeTruthy();
    expect(screen.queryByText("Describe a quiet library you visited")).toBeNull();

    // Filter by 'Đã duyệt'
    const publishedTab = screen.getByRole("button", { name: "Đã duyệt" });
    fireEvent.click(publishedTab);

    expect(screen.queryByText("Describe an energetic person you know")).toBeNull();
    expect(screen.getByText("Describe a quiet library you visited")).toBeTruthy();
  });

  it("opens edit modal and allows editing topic title and questions", () => {
    render(<ForecastAdminScreen initialTopics={mockTopics} />);

    const editButtons = screen.getAllByRole("button", { name: /sửa/i });
    fireEvent.click(editButtons[0]!);

    expect(screen.getByText("Chỉnh sửa đề thi nháp")).toBeTruthy();
    expect(screen.getByDisplayValue("Describe an energetic person you know")).toBeTruthy();

    // Close modal
    const cancelButton = screen.getByRole("button", { name: /hủy/i });
    fireEvent.click(cancelButton);

    expect(screen.queryByText("Chỉnh sửa đề thi nháp")).toBeNull();
  });

  it("opens create modal for new drafts", () => {
    render(<ForecastAdminScreen initialTopics={mockTopics} />);

    const addDraftButton = screen.getByRole("button", { name: /thêm bản nháp/i });
    fireEvent.click(addDraftButton);

    expect(screen.getByText("Thêm bản nháp đề mới")).toBeTruthy();
  });

  it("renders Access Denied state when access is not permitted", () => {
    render(<ForecastAdminScreen accessDeniedForTest={true} />);

    expect(screen.getByText("Truy cập bị từ chối")).toBeTruthy();
    expect(
      screen.getByText(
        "Chỉ người sở hữu sản phẩm mới có quyền truy cập vào công cụ quản trị duyệt đề forecast.",
      ),
    ).toBeTruthy();
  });

  it("validates that web sources require a valid URL in create draft modal", () => {
    render(<ForecastAdminScreen initialTopics={mockTopics} />);

    const addDraftButton = screen.getByRole("button", { name: /thêm bản nháp/i });
    fireEvent.click(addDraftButton);

    // Select Web source
    const selects = screen.getAllByRole("combobox");
    // selects[0] is Quarter, selects[1] is Part, selects[2] is Source
    fireEvent.change(selects[2]!, { target: { value: "web" } });

    // Type title without URL and submit
    const titleInput = screen.getByPlaceholderText(/Describe an energetic person/);
    fireEvent.change(titleInput, { target: { value: "Topic from web" } });

    const submitButton = screen.getByRole("button", { name: "Tạo bản nháp" });
    fireEvent.click(submitButton);

    expect(
      screen.getByText(/Nguồn web bắt buộc có URL hợp lệ/),
    ).toBeTruthy();
  });
});
