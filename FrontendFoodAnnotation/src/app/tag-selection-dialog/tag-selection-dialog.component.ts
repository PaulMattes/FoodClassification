import { Component, OnInit, Inject } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatChipsModule} from '@angular/material/chips';
import {FormControl} from '@angular/forms';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';


@Component({
  selector: 'app-tag-selection-dialog',
  templateUrl: './tag-selection-dialog.component.html',
  styleUrls: ['./tag-selection-dialog.component.css']
})
export class TagSelectionDialogComponent implements OnInit {

  myControl = new FormControl();
  options: string[];
  filteredOptions: Observable<string[]>;

  constructor(public dialogRef: MatDialogRef<TagSelectionDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.options = data.tags;
  }

  ngOnInit() {
    this.filteredOptions = this.myControl.valueChanges
      .pipe(
        startWith(''),
        map(value => {
          this.data.tag = value;
          return this._filter(value);
        })
      );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.options.filter(option => option.toLowerCase().includes(filterValue));
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
