import { ItemView, Plugin } from "obsidian";

const VIEW_TYPE_AI_CHATBOT = "ai-chatbot-demo-view";

class AiChatbotView extends ItemView {
  getViewType(): string {
    return VIEW_TYPE_AI_CHATBOT;
  }

  getDisplayText(): string {
    return "AI Chatbot";
  }

  getIcon(): string {
    return "bot";
  }

  async onOpen(): Promise<void> {
    const container = this.contentEl;
    container.empty();
    container.addClass("ai-chatbot-demo");

    const header = container.createDiv({ cls: "ai-chatbot-demo__header" });
    header.createEl("h2", { text: "AI Chatbot" });
    header.createEl("p", {
      text: "This panel is reserved for the upcoming AI chatbot experience.",
    });

    const body = container.createDiv({ cls: "ai-chatbot-demo__body" });
    body.createEl("div", {
      cls: "ai-chatbot-demo__placeholder",
      text: "Right panel ready. Hook your AI messages here.",
    });
  }

  async onClose(): Promise<void> {
    this.contentEl.empty();
  }
}

export default class AiChatbotDemoPlugin extends Plugin {
  async onload(): Promise<void> {
    this.registerView(VIEW_TYPE_AI_CHATBOT, (leaf) => new AiChatbotView(leaf));

    this.addCommand({
      id: "open-ai-chatbot-panel",
      name: "Open AI chatbot panel (right)",
      callback: () => {
        void this.activateView();
      },
    });

    this.addRibbonIcon("bot", "Open AI chatbot panel", () => {
      void this.activateView();
    });
  }

  async onunload(): Promise<void> {
    this.app.workspace.getLeavesOfType(VIEW_TYPE_AI_CHATBOT).forEach((leaf) => {
      leaf.detach();
    });
  }

  private async activateView(): Promise<void> {
    const existingLeaf =
      this.app.workspace.getLeavesOfType(VIEW_TYPE_AI_CHATBOT)[0];
    const leaf = existingLeaf ?? this.app.workspace.getRightLeaf(true);
    if (!leaf) {
      return;
    }

    await leaf.setViewState({
      type: VIEW_TYPE_AI_CHATBOT,
      active: true,
    });

    this.app.workspace.revealLeaf(leaf);
  }
}
