import { BoundingBox } from './bounding-box';

export class Annotation {
    added: boolean;
    height: number;
    width: number;
    bildName: string;
    boxes: BoundingBox[];
    filePath: string;
}