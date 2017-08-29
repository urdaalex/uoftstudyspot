import {Room} from './app.room';

export class OptimizeResult {
    id: string;
    name: string;
    waitTime: number;
    freeTime: number;
    freeFrom: Date;
    freeUntil: Date;
}