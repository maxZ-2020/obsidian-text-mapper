import { SVGElement } from "./constants";
import { Point, Orientation } from "./orientation";
import { NamespaceFunction, OBSIDIAN_LINK } from "./constants";

export class Region {
    x: number;
    y: number;
    types: string[];
    label: string;
    size: string;
    id: string;
    namespace: NamespaceFunction;

    constructor(namespace: NamespaceFunction) {
        this.types = [];
        this.namespace = namespace;
    }

    pixels(orientation: Orientation, addX: number, addY: number): number[] {
        const pix = orientation.pixels(new Point(this.x, this.y), addX, addY);
        return [pix.x, pix.y];
    }

    svg(svgEl: SVGElement, orientation: Orientation, types: string[]): void {
        const pix = orientation.pixels(new Point(this.x, this.y));
        for (const type of this.types) {
            if (!types.includes(type)) {
                continue;
            }
            const namespaced = this.namespace(type);
            svgEl.createSvg("use", {
                attr: {
                    x: pix.x.toFixed(1),
                    y: pix.y.toFixed(1),
                    href: `#${namespaced}`,
                },
            });
        }
    }

    svgCoordinates(
        svgEl: SVGElement,
        orientation: Orientation,
        textAttributes: any,
        coordinatesFormat: string
    ): void {
        const pix = orientation.pixels(
            new Point(this.x, this.y),
            0,
            -orientation.dy * orientation.labelOffset
        );

        const coordEl = svgEl.createSvg("text", {
            attr: {
                ...textAttributes,
                "text-anchor": "middle",
                x: pix.x.toFixed(1),
                y: pix.y.toFixed(1),
            },
        });

        const xStr = this.x.toString().padStart(2, "0");
        const yStr = this.y.toString().padStart(2, "0");

        const content = coordinatesFormat
            .replace("{X}", xStr)
            .replace("{Y}", yStr);

        coordEl.textContent = content;
    }

    svgRegion(
        svgEl: SVGElement,
        orientation: Orientation,
        attributes: any
    ): void {
        const points = orientation
            .hexCorners()
            .map((corner: Point) => {
                return orientation
                    .pixels(new Point(this.x, this.y), corner.x, corner.y)
                    .toString();
            })
            .join(" ");

        svgEl.createSvg("polygon", {
            attr: {
                ...attributes,
                id: this.namespace(this.id),
                points,
            },
        });
    }

    svgLabel(
        svgEl: SVGElement,
        orientation: Orientation,
        labelAttributes: any,
        glowAttributes: any
    ): void {
        if (this.label === undefined) {
            return;
        }
        const attributes = {
            ...labelAttributes,
        };

        // Computing the label and link
        const [linkContent, textContent] =
            this.computeLinkAndLabel(this.label);

        if (this.size !== undefined) {
            attributes["font-size"] = this.size;
        }
        const pix = orientation.pixels(
            new Point(this.x, this.y),
            0,
            orientation.dy * orientation.labelOffset
        );
        const gEl = svgEl.createSvg("g");

        const glowEl = gEl.createSvg("text", {
            attr: {
                "text-anchor": "middle",
                x: pix.x.toFixed(1),
                y: pix.y.toFixed(1),
                ...attributes,
                ...glowAttributes,
            },
        });
        glowEl.textContent = textContent;

        if (linkContent != null) {
            const labelLinkEl = gEl.createSvg("a", {
                attr: {
                    "data-tooltip-position": "top",
                    "aria-label": linkContent,
                    href: linkContent,
                    "data-href": linkContent,
                    class: "internal-link",
                    target: "_blank",
                    rel: "noopener",
                },
            });

            const labelEl = labelLinkEl.createSvg("text", {
                attr: {
                    "text-anchor": "middle",
                    x: pix.x.toFixed(1),
                    y: pix.y.toFixed(1),
                    ...attributes,
                },
            });

            labelEl.textContent = textContent;
        } else {
            const labelEl = gEl.createSvg("text", {
                attr: {
                    "text-anchor": "middle",
                    x: pix.x.toFixed(1),
                    y: pix.y.toFixed(1),
                    ...attributes,
                },
            });

            labelEl.textContent = textContent;
        }
    }

    computeLinkAndLabel(text: string): [string, string] {
        if (!OBSIDIAN_LINK.test(text)) {
            return [null, text];
        }

        const match = text.match(OBSIDIAN_LINK);
        const label = match[2];
        const link = match[1];

        if (label == null) {
            return [link, link]
        }

        return  [link, label];
    }
}
