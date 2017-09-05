import { Component } from '@angular/core';
import { Angulartics2GoogleAnalytics } from 'angulartics2';

//google analytics 
let ga: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
    title = 'app';
    constructor(angulartics2GoogleAnalytics: Angulartics2GoogleAnalytics) { }
    
}
