import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LookupToolComponent } from './app.lookup-tool.component'
import {AboutComponent} from './app.about.component'

const routes: Routes = [
    { path: 'lookup-tool', component: LookupToolComponent },
    { path: 'about', component: AboutComponent},
    {path: '', redirectTo: '/lookup-tool', pathMatch: 'full'}
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }