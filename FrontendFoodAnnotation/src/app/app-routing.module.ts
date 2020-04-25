import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CanvasForFoodComponent } from './canvas-for-food/canvas-for-food.component';
import { CsvModelComponent } from './csv-model/csv-model.component';


const routes: Routes = [
  { path: '', redirectTo: '/canvas', pathMatch: 'full'},
  { path: 'canvas', component: CanvasForFoodComponent },
  { path: 'upload', component: CsvModelComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
