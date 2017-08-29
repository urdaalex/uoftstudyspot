import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'twelveHours' })
export class TwelveHoursPipe implements PipeTransform {
    transform(value: number): string {
        return (value % 12 || 12) + ':00 ' + ((value < 12) ? 'AM' : 'PM');
    }
}