import puppeteer, {Browser, Page} from 'puppeteer';

export class BrowserManager {
  private browser: Promise<Browser> | null = null;
  private idleTimer: NodeJS.Timeout | null = null;
  private idleTimeoutMs: number;

  constructor(idleTimeoutMs: number = 30000) {
    this.idleTimeoutMs = idleTimeoutMs;
  }

  async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
    }
    this.resetIdleTimer();
    return this.browser;
  }

  private resetIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }
    this.idleTimer = setTimeout(() => this.closeBrowser(), this.idleTimeoutMs);
  }

  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      const browserInstance = await this.browser;
      await browserInstance.close();
      this.browser = null;
    }
  }

  async renderPDF(html: string, options: any): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page: Page = await browser.newPage();
    try {
      await page.setContent(html, {waitUntil: 'networkidle0'});
      const pdf = await page.pdf(options);
      return Buffer.from(pdf);
    } finally {
      await page.close();
      this.resetIdleTimer();
    }
  }
}
