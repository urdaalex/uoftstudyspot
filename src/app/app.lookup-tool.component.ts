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

const LOCAL_STORAGE_KEY_LAST_SELECTED_CAMPUS: string = "LOCAL_STORAGE_KEY_LAST_SELECTED_CAMPUS";

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
  ) {
    this.createForm();
    this.loading = new BehaviorSubject<boolean>(false);
  }

  createForm(): void {
    this.scheduleForm = this.fb.group({
      building: [null, Validators.required],
      date: 0,
      time: moment().hours(),
      showAllRooms: false,
      selectedCampus: localStorage.getItem(LOCAL_STORAGE_KEY_LAST_SELECTED_CAMPUS) || "UTSG",
    });
  }

  onSubmit(): void {
    if (this.scheduleForm.valid) {
      const formModel = this.scheduleForm.value;
      this.loading.next(true);
      this.selectedBuildingSchedule = null;
      this.angulartics2.eventTrack.next({ action: 'search', properties: { category: 'lookup-tool', label: formModel.selectedCampus + ":" + formModel.building } });
      this.aceService.getOptimizedRooms(formModel.building, moment().add(formModel.date, 'days').hours(formModel.time).format('YYYY-MM-DD::HH'), formModel.selectedCampus)
        .do(() => this.loading.next(false))
        .finally(() => this.loading.next(false))
        .subscribe(data => this.selectedBuildingSchedule = data);
      localStorage.setItem(LOCAL_STORAGE_KEY_LAST_SELECTED_CAMPUS, formModel.selectedCampus);
    }
  }

  ngOnInit(): void {
    //populate the initial buildings list
    this.aceService.getBuildings(this.scheduleForm.value.selectedCampus).subscribe(data => this.buildings = data);

    //get new buildings list when the campus is changed
    this.scheduleForm.get('selectedCampus')
      .valueChanges
      .subscribe(campus => {
        this.scheduleForm.patchValue({
          building: null,
        });

        this.selectedBuildingSchedule = null;

        this.aceService
          .getBuildings(campus)
          .subscribe(data => this.buildings = data);
      }
      );

    //auto submit the form when values change
    this.scheduleForm.valueChanges.subscribe(_ =>
      this.onSubmit());
  }

}
