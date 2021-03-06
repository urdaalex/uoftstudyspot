import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { LookupToolComponent } from './app.lookup-tool.component';
import { AboutComponent } from './app.about.component';
import { AceService } from './app.ace.service';
import { TwelveHoursPipe } from './app.twelve-hours.pipe';
import { TruncatePipe } from './app.truncate.pipe';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MdSelectModule, MdProgressSpinnerModule, MdToolbarModule, MdTooltipModule, MdButtonModule, MdSlideToggleModule, MdRadioModule} from '@angular/material'

import { Angulartics2Module, Angulartics2GoogleAnalytics } from 'angulartics2';

@NgModule({
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MdSelectModule,
    MdProgressSpinnerModule,
    MdToolbarModule,
    MdTooltipModule,
    MdButtonModule,
    MdSlideToggleModule,
    MdRadioModule,
    Angulartics2Module.forRoot([Angulartics2GoogleAnalytics])
  ],
  declarations: [
    AppComponent,
    LookupToolComponent,
    AboutComponent,
    TwelveHoursPipe,
    TruncatePipe
  ],

  providers: [AceService],
  bootstrap: [AppComponent]
})
export class AppModule { }
