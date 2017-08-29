import { Injectable } from '@angular/core';
import { Http, URLSearchParams } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { Building } from './app.building';
import { OptimizeResult } from './app.optimize-result';

@Injectable()
export class AceService {

    constructor(private http: Http) { }

    getBuildings(): Observable<Building[]> {
        return this.http
            .get(`http://localhost:4200/api/buildings`)
            .map(response => response.json() as Building[]);
    }

    getOptimizedRooms(buildingCode: string, time?: string): Observable<OptimizeResult[]> {
        let params = new URLSearchParams();
        params.set('code', buildingCode);

        if (time) {
            params.set('time', time);
        }

        return this.http
            .get(`http://localhost:4200/api/optimize`, { params: params })
            .map(response => response.json() as OptimizeResult[]);
    }
}
