import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listDraftsSpy = vi.fn();
const createDraftSpy = vi.fn();

vi.mock("@/utils/trpc", () => ({
  trpcClient: {
    forecastAdmin: {
      listDrafts: {
        query: (...args: unknown[]) => listDraftsSpy(...args),
      },
      createDraft: {
        mutate: (...args: unknown[]) => createDraftSpy(...args),
      },
    },
  },
}));

import {
  ForecastAdminScreen,
  getCurrentQuarter,
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

  const multiQuarterTopics: AdminForecastTopic[] = [
    ...mockTopics,
    {
      id: "topic_future_part3",
      title: "Technology and social communication",
      quarter: "2028-Q2",
      part: 3,
      questions: ["How has social media changed communication?"],
      status: "published",
      realReportCount: 2,
      sources: [{ id: "src_5", sourceType: "manual" }],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    listDraftsSpy.mockResolvedValue([]);
    createDraftSpy.mockImplementation(async (input: {
      title: string;
      quarter: string;
      part: number;
    }) => ({
      id: "topic_created_1",
      title: input.title,
      quarter: input.quarter,
      part: input.part,
      status: "draft",
    }));
  });

  it("renders draft topic with 'Bản nháp' badge, questions, sources, and action buttons", () => {
    render(<ForecastAdminScreen initialTopics={mockTopics} />);

    expect(screen.getByText("Describe an energetic person you know")).toBeTruthy();
    expect(screen.getAllByText("Bản nháp").length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText("Who this person is")).toBeTruthy();
    expect(screen.getByText("Why you find them energetic")).toBeTruthy();

    expect(screen.getAllByText("Tự soạn").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Web")).toBeTruthy();
    expect(screen.getByText("Học viên báo")).toBeTruthy();

    expect(screen.getByText("3 thí sinh báo đã gặp")).toBeTruthy();

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

    expect(screen.getByText("Describe an energetic person you know")).toBeTruthy();
    expect(screen.getByText("Describe a quiet library you visited")).toBeTruthy();

    const draftTab = screen.getByRole("button", { name: "Bản nháp" });
    fireEvent.click(draftTab);

    expect(screen.getByText("Describe an energetic person you know")).toBeTruthy();
    expect(screen.queryByText("Describe a quiet library you visited")).toBeNull();

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

    const sourceSelect = screen.getByTestId("select-new-source");
    fireEvent.change(sourceSelect, { target: { value: "web" } });

    const titleInput = screen.getByPlaceholderText(/Describe an energetic person/);
    fireEvent.change(titleInput, { target: { value: "Topic from web" } });

    const submitButton = screen.getByRole("button", { name: "Tạo bản nháp" });
    fireEvent.click(submitButton);

    expect(
      screen.getByText(/Nguồn web bắt buộc có URL hợp lệ/),
    ).toBeTruthy();
  });

  it("filters topics case-insensitively by title search input", () => {
    render(<ForecastAdminScreen initialTopics={multiQuarterTopics} />);

    const searchInput = screen.getByPlaceholderText("Tìm kiếm theo tiêu đề...");
    fireEvent.change(searchInput, { target: { value: "QUIET LIBRARY" } });

    expect(screen.getByText("Describe a quiet library you visited")).toBeTruthy();
    expect(screen.queryByText("Describe an energetic person you know")).toBeNull();
    expect(screen.queryByText("Describe an old television show")).toBeNull();
    expect(screen.queryByText("Technology and social communication")).toBeNull();

    fireEvent.change(searchInput, { target: { value: "" } });
    expect(screen.getByText("Describe an energetic person you know")).toBeTruthy();
  });

  it("filters topics by Part (Tất cả Part, Part 1, Part 2, Part 3)", () => {
    render(<ForecastAdminScreen initialTopics={multiQuarterTopics} />);

    const partSelect = screen.getByTestId("select-part-filter") as unknown as HTMLSelectElement;
    expect(partSelect.value).toBe("all");

    fireEvent.change(partSelect, { target: { value: "1" } });
    expect(screen.getByText("Describe an old television show")).toBeTruthy();
    expect(screen.queryByText("Describe an energetic person you know")).toBeNull();
    expect(screen.queryByText("Technology and social communication")).toBeNull();

    fireEvent.change(partSelect, { target: { value: "3" } });
    expect(screen.getByText("Technology and social communication")).toBeTruthy();
    expect(screen.queryByText("Describe an old television show")).toBeNull();

    fireEvent.change(partSelect, { target: { value: "all" } });
    expect(screen.getByText("Describe an energetic person you know")).toBeTruthy();
    expect(screen.getByText("Technology and social communication")).toBeTruthy();
  });

  it("defaults to current calendar quarter when initialTopics is omitted and queries backend", async () => {
    const currentQ = getCurrentQuarter();
    render(<ForecastAdminScreen />);

    const quarterSelect = screen.getByTestId("select-quarter") as unknown as HTMLSelectElement;
    expect(quarterSelect.value).toBe(currentQ);

    await waitFor(() => {
      expect(listDraftsSpy).toHaveBeenCalledWith({ quarter: currentQ });
    });

    fireEvent.change(quarterSelect, { target: { value: "all" } });
    await waitFor(() => {
      expect(listDraftsSpy).toHaveBeenCalledWith({});
    });
  });

  it("renders dynamic quarters including distinct quarters from topics and filters by quarter", () => {
    render(<ForecastAdminScreen initialTopics={multiQuarterTopics} />);

    const quarterSelect = screen.getByTestId("select-quarter") as unknown as HTMLSelectElement;
    const optionValues = Array.from(quarterSelect.options).map((o) => o.value);
    const currentYear = new Date().getFullYear();

    expect(optionValues).toContain("all");
    expect(optionValues).toContain(`${currentYear - 1}-Q1`);
    expect(optionValues).toContain(`${currentYear + 1}-Q4`);
    expect(optionValues).toContain("2028-Q2");

    fireEvent.change(quarterSelect, { target: { value: "2028-Q2" } });
    expect(screen.getByText("Technology and social communication")).toBeTruthy();
    expect(screen.queryByText("Describe an energetic person you know")).toBeNull();

    fireEvent.change(quarterSelect, { target: { value: "all" } });
    expect(screen.getByText("Describe an energetic person you know")).toBeTruthy();
    expect(screen.getByText("Technology and social communication")).toBeTruthy();
  });

  it("supports filtering custom quarter and creating a draft with a future custom quarter", async () => {
    render(<ForecastAdminScreen initialTopics={multiQuarterTopics} />);

    // Custom quarter filter
    const quarterSelect = screen.getByTestId("select-quarter") as unknown as HTMLSelectElement;
    fireEvent.change(quarterSelect, { target: { value: "__custom__" } });
    const customInput = screen.getByTestId("input-custom-quarter");
    fireEvent.change(customInput, { target: { value: "2028-Q2" } });
    fireEvent.click(screen.getByTestId("btn-apply-custom-quarter"));

    expect(quarterSelect.value).toBe("2028-Q2");
    expect(screen.getByText("Technology and social communication")).toBeTruthy();

    // Create draft with custom future quarter 2029-Q1
    fireEvent.click(screen.getByRole("button", { name: /thêm bản nháp/i }));
    fireEvent.change(screen.getByPlaceholderText(/Describe an energetic person/), {
      target: { value: "Future city transportation" },
    });
    fireEvent.change(screen.getByTestId("input-new-quarter"), {
      target: { value: "2029-Q1" },
    });
    fireEvent.change(screen.getByTestId("select-new-part"), {
      target: { value: "3" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Tạo bản nháp" }));

    await waitFor(() => {
      expect(createDraftSpy).toHaveBeenCalledWith({
        title: "Future city transportation",
        quarter: "2029-Q1",
        part: 3,
        questions: [],
        sources: [
          {
            sourceType: "manual",
            sourceUrl: undefined,
            rawContent: undefined,
          },
        ],
      });
    });

    expect(await screen.findByText("Future city transportation")).toBeTruthy();
  });
});
