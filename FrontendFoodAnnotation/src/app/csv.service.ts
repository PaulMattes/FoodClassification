import { Injectable } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CsvService {

  constructor(
    private http: HttpClient
  ) { }

  getCSVfile(path: string): Observable<Blob> {
    return this.http.get<Blob>(path).pipe();
  }
}
