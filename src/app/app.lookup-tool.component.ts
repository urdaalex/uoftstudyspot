import { Component, OnInit } from '@angular/core';
import { Building } from './app.building';
import { AceService } from './app.ace.service'
import { OptimizeResult } from './app.optimize-result';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Angulartics2 } from 'angulartics2';

import 'rxjs/add/operator/do';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/finally';

import moment from 'moment/src/moment';

@Component({
    selector: 'lookup-tool',
    templateUrl: './app.lookup-tool.html',
    styleUrls: ['./app.lookup-tool.css']
})
export class LookupToolComponent implements OnInit {
    hours: number[] = Array.from(new Array(24), (x, i) => i);
    dates: string[] = Array.from(new Array(7), (x, i) => moment().add(i, 'days').format('ddd, MMM DD'));
    buildings: Building[];
    selectedBuildingSchedule: OptimizeResult[];
    loading: Subject<boolean>;

    scheduleForm: FormGroup;

    constructor(
        private aceService: AceService,
        private fb: FormBuilder,
        private angulartics2: Angulartics2
    ) 
    {
        this.createForm();
        this.loading = new BehaviorSubject<boolean>(false);
    }

    createForm(): void {
        this.scheduleForm = this.fb.group({
            building: [null, Validators.required],
            date: 0,
            time: moment().hours(),
            showAllRooms: false
        });
    }

    onSubmit(): void {
        if (this.scheduleForm.valid) {
            const formModel = this.scheduleForm.value;
            this.loading.next(true);
            this.selectedBuildingSchedule = null;
            this.angulartics2.eventTrack.next({ action: 'search', properties: { category: 'lookup-tool', label: formModel.building} });
            this.aceService.getOptimizedRooms(formModel.building, moment().add(formModel.date, 'days').hours(formModel.time).format('YYYY-MM-DD::HH'))
                .do(() => this.loading.next(false))
                .finally(() => this.loading.next(false))
                .subscribe(data => this.selectedBuildingSchedule = data);
        }
    }

    ngOnInit(): void {
        this.aceService.getBuildings().subscribe(data => this.buildings = data);
        this.scheduleForm.valueChanges.subscribe(_ => this.onSubmit());
    }

}
