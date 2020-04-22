import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  storage: AngularFireStorage;

  constructor(storage: AngularFireStorage) {
    this.storage = storage;
  }
}
