import { Component, OnInit, Inject } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatChipsModule} from '@angular/material/chips';


@Component({
  selector: 'app-tag-selection-dialog',
  templateUrl: './tag-selection-dialog.component.html',
  styleUrls: ['./tag-selection-dialog.component.css']
})
export class TagSelectionDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<TagSelectionDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
