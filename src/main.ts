import {
    MarkdownPostProcessorContext,
    MarkdownRenderChild,
    Plugin,
} from "obsidian";
import { APOCALYPSE } from "./apocalypse";
import { ParseError } from "./error";
import { GNOMEYLAND } from "./gnomeyland";
import { TextMapperParser } from "./parser";

export default class TextMapperPlugin extends Plugin {
    async onload() {
        console.log("Loading Obsidian TextMapper.");
        this.registerMarkdownCodeBlockProcessor(
            "text-mapper",
            this.processMarkdown.bind(this)
        );
    }

    async processMarkdown(
        source: string,
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext
    ): Promise<any> {
        try {
            const includes = await new IncludeResolver(this.app).resolveSources(source);

            let totalSource = source.split("\n");
            for (const include of includes) {
                totalSource = totalSource.concat(include.split("\n"));
            }

            ctx.addChild(new TextMapper(el, ctx.docId, totalSource));
        } catch (e) {
            console.log("text mapper error", e);
            ctx.addChild(new ParseError(el));
        }
    }

    onunload() {}
}

export class TextMapper extends MarkdownRenderChild {
    textMapperEl: HTMLDivElement;

    constructor(containerEl: HTMLElement, docId: string, source: string) {
        super(containerEl);
        this.textMapperEl = this.containerEl.createDiv({ cls: "textmapper" });

        const parser = new TextMapperParser(docId);
        parser.process(source);
        parser.svg(this.textMapperEl);
    }
}

class IncludeResolver {
    constructor(app: App) {
        this.app = app;
    }

    async resolveSources(originalSource: string) {
        const lines = originalSource.split("\n");
        const files = this.extractIncludes(lines);
        const includes = await this.resolveIncludes(files);

        return includes;
    }

    extractIncludes(lines: string[]) : string[] {
        const files: string[] = [];
        for (const line of lines) {
            if (line.startsWith("include")) {
                const file = line.split("include")[1].trim();
                files.push(file);
            }
        }

        return files;
    }

    async resolveIncludes(files: string[]) : string[] {
        const currentFile = this.app.workspace.getActiveFile();
        const result: string[] = [];

        for (const file of files) {
            const link = this.app.metadataCache.getFirstLinkpathDest(
              file, currentFile.path
            );

            let content = null;

            if (link == null) {
                switch(file) {
                    case "gnomeyland.txt":
                        content = GNOMEYLAND;
                        break;
                    case "apocalypse.txt":
                        content = APOCALYPSE;
                        break;
                }
            } else {
                content = await app.vault.read(link);
            }

            if (content == null) {
                console.warn(`could not include ${file}`);
                continue;
            }

            result.push(content);
        }

        return result;
    }
}
