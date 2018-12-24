import { Injectable } from '@angular/core';
import { Http, URLSearchParams } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { Building } from './app.building';
import { OptimizeResult } from './app.optimize-result';

@Injectable()
export class AceService {

  constructor(private http: Http) { }

  getBuildings(campus?: string): Observable<Building[]> {
    let params = new URLSearchParams();

    if (campus) {
      params.set('campus', campus);
    }

    return this.http
      .get(`http://uoftstudyspot.com/api/buildings`, { params: params })
      .map(response => response.json() as Building[]);
  }

  getOptimizedRooms(buildingCode: string, time?: string, campus?: string): Observable<OptimizeResult[]> {
    let params = new URLSearchParams();
    params.set('code', buildingCode);

    if (time) {
      params.set('time', time);
    }

    if (campus) {
      params.set('campus', campus);
    }

    return this.http
      .get(`http://uoftstudyspot.com/api/optimize`, { params: params })
      .map(response => response.json() as OptimizeResult[]);
  }
}
