import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'truncate' })
export class TruncatePipe implements PipeTransform {
    transform(value: string, length: number, end: string): string {
        if (isNaN(length))
            length = 10;

        if (end === undefined)
            end = "...";

        if (value.length <= length || value.length - end.length <= length) {
            return value;
        } else {
            return String(value).substring(0, length - end.length) + end;
        }
    }
}