import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CanvasForFoodComponent } from './canvas-for-food/canvas-for-food.component';


const routes: Routes = [
  { path: '', redirectTo: '/canvas', pathMatch: 'full'},
  { path: 'canvas', component: CanvasForFoodComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
