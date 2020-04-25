import { Component, OnInit } from '@angular/core';
import { AngularFireUploadTask } from '@angular/fire/storage/task';
import { AngularFireStorageReference } from '@angular/fire/storage/ref';
import { AngularFireStorage } from '@angular/fire/storage';

@Component({
  selector: 'app-csv-model',
  templateUrl: './csv-model.component.html',
  styleUrls: ['./csv-model.component.css']
})
export class CsvModelComponent implements OnInit {

  ref: AngularFireStorageReference;
  task: AngularFireUploadTask[];
  snaps: any[] = [];
  names: string[];
  images: string[];
  
  constructor(private afStorage: AngularFireStorage) { } 

  ngOnInit(): void {
  }

  async upload(event) {
    for (var i = 0; i < event.target.files.length; i++) {
      this.snaps[i] = this.afStorage.upload("/images/" + event.target.files[i].name, event.target.files[i]);
    }
  }

  async download() {
    this.afStorage.ref("/images/").listAll().subscribe(n => {
      n.items.forEach(b => {
        this.names.push(b.name);
      });
    });
    this.afStorage.ref("/images/").getDownloadURL().subscribe(d => {
      this.images.push(d);
    });
  }

  public getImages() {
    return this.images;
  }

}
