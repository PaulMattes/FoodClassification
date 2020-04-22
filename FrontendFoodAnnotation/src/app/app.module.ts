import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CanvasForFoodComponent } from './canvas-for-food/canvas-for-food.component';
import { CsvModelComponent } from './csv-model/csv-model.component';

declare var require: any;

@NgModule({
  declarations: [
    AppComponent,
    CanvasForFoodComponent,
    CsvModelComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
