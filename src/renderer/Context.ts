import Color from "../utils/Color/Color";

type ColorType = Color | string;

class Context {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    defaultColor: string;

    /**
     * Initializes a new CanvasController.
     * @param {HTMLCanvasElement|string} canvas - The canvas element or its ID.
     */
    constructor(canvas?: HTMLCanvasElement) {
        if (!canvas) {
            this.canvas = this.makeCanvas();
        } else {
            this.canvas =
                typeof canvas === "string" ? document.getElementById(
                    canvas) as HTMLCanvasElement : canvas;
        }

        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.defaultColor = "rgba( 255, 255, 255, 1.0)";
    }

    makeCanvas(): HTMLCanvasElement {
        const canvas = document.createElement('canvas') as HTMLCanvasElement;
        canvas.id = "particle-canvas";
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const container = document.getElementById("canvas-container"
        ) as HTMLDivElement;
        container.appendChild(canvas);
        console.log("Canvas created and added to DOM...");
        return canvas;
    }

    /**
     * Clears the entire canvas.
     */
    clear(): void {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * Resizes the canvas and updates its internal dimensions.
     * @param {number} width - The new width of the canvas.
     * @param {number} height - The new height of the canvas.
     */
    resize(width: number, height: number): void {
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = width;
        this.height = height;
    }

    checkColor(color: ColorType): string {
        let result: string;
        if (color instanceof Color) {
            result = color.toString();
        } else if (typeof color === 'string') {
            result = color;
        } else {
            result = this.defaultColor;
        }
        return result;
    }

    // --- Drawing Primitives ---

    /**
     * Draws a filled rectangle.
     * @param {number} x - The x-coordinate of the top-left corner.
     * @param {number} y - The y-coordinate of the top-left corner.
     * @param {number} width - The width of the rectangle.
     * @param {number} height - The height of the rectangle.
     * @param {string} color - The fill color.
     */
    rect(x: number, y: number, width: number, height: number, color:
        ColorType) {
        this.defaultColor = "rgba(255,255,255,0.1)";
        this.ctx.fillStyle = this.checkColor(color);
        this.ctx.fillRect(x, y, width, height);
    }

    box(x: number, y: number, width: number, height: number, color:
        ColorType) {
        this.defaultColor = "rgba(255,255,255,0.1)";
        this.ctx.strokeStyle = this.checkColor(color);;
        this.ctx.strokeRect(x, y, width, height);
    }

    dashRect(x: number, y: number, width: number, height: number,
        color: ColorType) {
        this.defaultColor = "rgba(255,255,255,0.3)";
        this.ctx.strokeStyle = this.checkColor(color);
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(x, y, width, height);
        this.ctx.setLineDash([]);
    }

    glowRect(
        x: number,
        y: number,
        width: number,
        height: number,
        glowSize: number,
        glowColor: ColorType,
        color: ColorType
    ) {
        glowSize = glowSize || 10;
        glowColor = glowColor || "rgba(255, 169, 169, 0.5)";
        this.defaultColor = "rgba(255, 169, 169, 0.5)"
        this.saveState();
        this.ctx.shadowColor = this.checkColor(glowColor);
        this.ctx.shadowBlur = glowSize;
        this.rect(x, y, width, height, this.checkColor(color));
        //this.ctx.fillStyle = this.checkColor( color );
        //this.ctx.fillRect( x, y, width, height );
        this.restoreState();
    }

    point(x: number, y: number, weight: number, color: ColorType) {
        this.defaultColor = "rgb(255, 255, 255)";
        this.circle(x, y, weight / 2, this.checkColor(color));
    }

    /**
     * Draws a filled circle.
     * @param {number} x - The x-coordinate of the circle's center.
     * @param {number} y - The y-coordinate of the circle's center.
     * @param {number} radius - The radius of the circle.
     * @param {string} color - The fill color.
     */
    circle(x: number, y: number, radius: number, color: ColorType) {
        this.defaultColor = "rgba(255,255,255,0.1)";
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = this.checkColor(color);
        this.ctx.fill();
    }

    dashCircle(x: number, y: number, radius: number, color: ColorType) {
        this.defaultColor = "rgba(255,255,255,0.3)";
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.circle(x, y, radius, this.checkColor(color));
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    /**
     * Draws a line.
     * @param {number} x1 - The x-coordinate of the start point.
     * @param {number} y1 - The y-coordinate of the start point.
     * @param {number} x2 - The x-coordinate of the end point.
     * @param {number} y2 - The y-coordinate of the end point.
     * @param {string} color - The line color.
     * @param {number} [width=1] - The line width.
     */
    line(x1: number, y1: number, x2: number, y2: number, color:
        ColorType, width: number) {
        width = width || 1;
        this.defaultColor = "black";
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.strokeStyle = this.checkColor(color);
        this.ctx.lineWidth = width;
        this.ctx.stroke();
    }

    // --- State Management ---

    /**
     * Saves the current drawing state (color, transform, etc.).
     */
    saveState() {
        this.ctx.save();
    }

    /**
     * Restores the last saved drawing state.
     */
    restoreState() {
        this.ctx.restore();
    }

    // --- Transformation ---

    /**
     * Translates the canvas context.
     * @param {number} x - The amount to translate horizontally.
     * @param {number} y - The amount to translate vertically.
     */
    translate(x: number, y: number) {
        this.ctx.translate(x, y);
    }

    /**
     * Rotates the canvas context.
     * @param {number} angle - The rotation angle in radians.
     */
    rotate(angle: number) {
        this.ctx.rotate(angle);
    }

    /**
     * Scales the canvas context.
     * @param {number} x - The horizontal scaling factor.
     * @param {number} y - The vertical scaling factor.
     */
    scale(x: number, y: number) {
        this.ctx.scale(x, y);
    }

    // --- Text Rendering ---

    /**
     * Draws filled text.
     * @param {string} text - The text to draw.
     * @param {number} x - The x-coordinate of the text.
     * @param {number} y - The y-coordinate of the text.
     * @param {string} [font='16px Arial'] - The font style.
     * @param {string} [color='black'] - The fill color.
     * @param {string} [textAlign='left'] - The text alignment.
     */
    text(text: string, x: number, y: number, font: string, color:
        ColorType, textAlign: CanvasTextAlign) {
        font = font || "16px Arial";
        this.defaultColor = "black";
        textAlign = textAlign || "left";
        this.ctx.font = font;
        this.ctx.fillStyle = this.checkColor(color);
        this.ctx.textAlign = textAlign;
        this.ctx.fillText(text, x, y);
    }

    // --- Animation Loop ---

    /**
     * Starts an animation loop using requestAnimationFrame.
     * @param {function(number)} callback - The function to execute on each frame.
     */
    startAnimation(callback: (timestamp: number) => void) {
        const animate = (timestamp: number) => {
            callback(timestamp);
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }
}

export default Context;

