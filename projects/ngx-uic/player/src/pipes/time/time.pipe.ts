import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'ngxTime'
})
export class NgxTimePipe implements PipeTransform {
    transform(time: number): string {
        const hours = Math.trunc(time / 3600);
        time -= hours * 3600;
        const minutes = Math.trunc(time / 60);
        time -= minutes * 60;
        const seconds = Math.trunc(time);
        return (time < 0 ? '-' : '')
            + (hours ? String(Math.abs(hours)).padStart(2, '0') + ':' : '')
            + String(Math.abs(minutes)).padStart(2, '0') + ':'
            + String(Math.abs(seconds)).padStart(2, '0');
    }
}
