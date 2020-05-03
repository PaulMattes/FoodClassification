import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CSVRecord } from '../csv-record';
import { CSVRecordMLKIT } from '../csv-record-mlkit';
import { FirebaseService } from '../firebase.service';
import { AngularFireUploadTask } from '@angular/fire/storage/task';
import { AngularFireStorageReference } from '@angular/fire/storage/ref';
import { AngularFireStorage } from '@angular/fire/storage';
import { CsvModelComponent } from '../csv-model/csv-model.component';
import { TagSelectionDialogComponent } from '../tag-selection-dialog/tag-selection-dialog.component';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {HttpResponse, HttpClientModule} from '@angular/common/http';
import {Http, ResponseContentType} from '@angular/http';

import { map, finalize, delay } from "rxjs/operators";
import { Observable } from "rxjs";
import { timingSafeEqual } from 'crypto';
import { Annotation } from '../annotaton';
import { BoundingBox } from '../bounding-box';
import { CsvService } from '../csv.service';
import { Tag } from '../tag';
import { Csvmlkit } from '../csvmlkit';

@Component({
  selector: 'app-canvas-for-food',
  templateUrl: './canvas-for-food.component.html',
  styleUrls: ['./canvas-for-food.component.css']
})
export class CanvasForFoodComponent implements OnInit {

  afStorage: AngularFireStorage;

  name = "Annotation";
  indexText = "index";
  initText = "leer";

  public subfolder = '1';

  public imgWidth: number;
  public imgHeight: number;
  public displayImgWidth: number;
  public displayImgHeight: number;
  public url: string;
  public image;
  public scaleFactor = 1.0;

  public records: any[] = [];
  public csvFromMLKIT: any[] = [];
  public boundingBoxes: any[] = [];
  public newBoxes: any[] = [];
  public csvMLkitBoxes: any[] = [];
  public images: string[] = [];
  public snaps: AngularFireUploadTask[] = [];
  public names: string[] = [];
  public tags: string[] = [];
  public annotations: Annotation[] = [];
  public tagList: Tag[] = [];

  public blob: Blob;

  public uploadedFiles = 0;
  public uploadProgress = 0;
  public totalUploadFiles = 0;

  public headElements = ['x1', 'x2', 'y1', 'y2', 'Bild', 'Tag']

  public boundingBox: CSVRecord;

  public rect: any;

  public drag = false;
  public firstImage = true;

  public contentHeight: number;

  @ViewChild("div1", { static: false}) div1: ElementRef;

  @ViewChild("layer1", { static: false }) layer1Canvas: ElementRef;
  private context: CanvasRenderingContext2D;
  private layer1CanvasElement: any;
  private isMouseDown: boolean;

  filePath = "";
  fileList = [];

  index = 0;
  indexBild = 0;
  indexForBoundingBoxes = 0;
  testIndex = 0;

  ref: AngularFireStorageReference;
  task: AngularFireUploadTask;

  csvModel: CsvModelComponent;

  constructor(afStorage: AngularFireStorage, public dialog: MatDialog, private csvService: CsvService) {
    this.afStorage = afStorage;
  }

  ngOnInit(): void {
    this.initText = "voll";
    this.boundingBox = new CSVRecord();
    //this.loadImagesFromStorage();
  }

  loadImagesFromStorage() {
    this.index = 0;
    this.names = [];
    this.fileList = [];
    this.afStorage.ref("/dataset/" + this.subfolder + "/images").listAll().subscribe(n => {
      n.items.forEach(b => {
        this.names.push(b.name);

        let a: Annotation;
        a = new Annotation();

        a.bildName = b.name;
        a.added = false;
        a.filePath = "";
        a.boxes = [];

        this.annotations.push(a);
      });
      this.download(this.names[0]);
    });
  }

  ngAfterViewInit() {
    this.contentHeight = this.div1.nativeElement.offsetHeight;
  }

  downloadCSVfromMLKIT() {
    this.afStorage.ref("/dataset/" + this.subfolder + "/tmp.csv").getDownloadURL().subscribe(d => {
      this.uploadListenerCSVfromMLKIT(d);
    });
  }

  uploadCSVfromMLKIT(event) {
    
    let input = event.target;  
    let reader = new FileReader();  
    reader.readAsText(input.files[0]);  

    reader.onload = () => {  
      let csvData = reader.result;  
      let csvRecordsArray = (<string>csvData).split(/\r\n|\n/);  

      this.csvFromMLKIT = this.getDataFromCSVMLKIT(csvRecordsArray, 11);
    }; 
  }

  getDataFromCSVMLKIT(csvRecordsArray: any, headerLength: number) {
    let csvArr = [];  
  
    for (let i = 1; i < csvRecordsArray.length; i++) {  
      let curruntRecord = (<string>csvRecordsArray[i]).split(',');  
      if (curruntRecord.length == headerLength) {  
        let csvMLkit: Csvmlkit = new Csvmlkit();
        csvMLkit.bildName = curruntRecord[1].trim().replace("gs://folderfoodown/", "");
        csvMLkit.essen = curruntRecord[2].trim();
        csvMLkit.x1 = parseFloat(curruntRecord[3].trim());  
        csvMLkit.y1 = parseFloat(curruntRecord[4].trim());  
        csvMLkit.x2 = parseFloat(curruntRecord[7].trim());  
        csvMLkit.y2 = parseFloat(curruntRecord[8].trim());
        csvArr.push(csvMLkit);  
      }  
    }  
    console.log("Länge: " + csvArr.length);
    return csvArr;   
  }

  uploadListenerCSVfromMLKIT(path: string) {
    let file: File;

    this.csvService.getCSVfile(path).subscribe(blob => (this.blob = blob));
    
    console.log(this.blob.size + " sdaöjkfhsdkjahf " + this.blob.type);

    let reader = new FileReader();  
    reader.readAsText(this.blob);  

    reader.onload = () => {  
      let csvData = reader.result;
      console.log(csvData);
      //let csvRecordsArray = (<string>csvData).split(/\r\n|\n/);  

      //this.records = this.getDataRecordsArrayFromCSVFile(csvRecordsArray, 6);
    };
  }

  async upload(event) {
    this.uploadedFiles = 0;
    this.totalUploadFiles = event.target.files.length;
    for (var i = 0; i < event.target.files.length; i++) {
      const path = "/dataset/" + this.subfolder + "/images/" + event.target.files[i].name;
      const ref = this.afStorage.ref(path);
      this.snaps[i] = this.afStorage.upload(path, event.target.files[i]);
      let url = (await this.snaps[i].snapshotChanges().toPromise()).downloadURL;
      this.uploadedFiles++;
      /*this.snaps[i].snapshotChanges().pipe(
        finalize(() => {
          const url = ref.getDownloadURL()
          url.subscribe(url => {
            if (url) {
              this.uploadedFiles++;
              if (this.uploadedFiles == this.totalUploadFiles) {
                this.loadImagesFromStorage();
              }
            }
          });
        })
      ).subscribe(url => {});*/
      
    }
  }

  async checkAndDelete() {
    let bool = false;
    let count = 0;
    let name = "";

    this.names.forEach(async n => {
      this.csvFromMLKIT.forEach(c =>{
        if (c.bildName == n) {
          bool = true;
        }
      });
      if (!bool) {
        await this.afStorage.ref("/dataset/" + this.subfolder + "/images/" + n).delete();
        count++;
      }
      bool = false;
    });
    console.log("anzahl: " + count);
    this.saveForMLkitFromMLkit();
  }

  async download(name: string) {
    this.afStorage.ref("/dataset/" + this.subfolder + "/images/" + name).getDownloadURL().subscribe(d => {
      this.filePath = d;
    });
  }

  async downLoadImagesByURL() {
    let i = 0;

    console.log("Länge von names: " + this.names.length);
    this.names.forEach(n => {
      this.afStorage.ref("/dataset/" + this.subfolder + "/images/" + n).getDownloadURL().subscribe(d => {
        this.annotations.forEach(a => {
          if (a.bildName == n) {
            this.annotations[i].filePath = d;
          }
        })
        i++;
      });
    });
  }

  showAnnotations() {
    this.annotations.forEach(a => {
      console.log("bildName: " + a.bildName + " width: " + a.width + " height: " + a.height);
    });
  }

  async loadImageSize() {
    for(var i = 0; i < this.annotations.length - 1; i++) {
      this.image = new Image();
      this.image.src = this.annotations[i].filePath;
      console.log("width: " + this.image.width);
      this.annotations[i].width = this.image.width;
      this.annotations[i].height = this.image.height;
    }
  }

  handleFiles(event) {
    if (event.target.files && event.target.files[0]) {

      this.fileList = [];

      for(var i = 0; i < event.target.files.length; i++) {
        this.fileList.push(event.target.files[i]);   
      }
    }  
  }

  saveBoundingBoxes() {

    this.annotations[this.index - 1].boxes = [];

    this.boundingBoxes.forEach(b => {
      let box: BoundingBox;
      box = new BoundingBox();

      box.x1 = b.x1;
      box.y1 = b.y1;
      box.x2 = b.x2;
      box.y2 = b.y2;
      box.essen = b.essen;
      //this.annotations[this.index - 1].height = b.height;
      //this.annotations[this.index - 1].width = b.width;
      
      this.annotations[this.index - 1].boxes.push(box);
    });

    this.addTagsForMLKIT(this.annotations[this.index - 1]);
    this.annotations[this.index - 1].added = true;
  }

  nextImage() {

    this.indexText = "" + this.index;
    
    if (!(this.firstImage)){
      this.saveBoundingBoxes();
    }

    this.boundingBoxes = [];

    this.records.forEach(b => {
      if (b.bildName == this.annotations[this.index].bildName) {
        let box: CSVRecord;
        box = new CSVRecord();

        this.boundingBoxes.push(box);

        this.boundingBoxes[this.boundingBoxes.length - 1].bildName = b.bildName;
        this.boundingBoxes[this.boundingBoxes.length - 1].essen = b.essen;
        this.boundingBoxes[this.boundingBoxes.length - 1].x1 = b.x1;
        this.boundingBoxes[this.boundingBoxes.length - 1].y1 = b.y1;
        this.boundingBoxes[this.boundingBoxes.length - 1].x2 = b.x2;
        this.boundingBoxes[this.boundingBoxes.length - 1].y2 = b.y2;
        this.boundingBoxes[this.boundingBoxes.length - 1].width = b.width;
        this.boundingBoxes[this.boundingBoxes.length - 1].height = b.height;

      }
    });

    //if(this.images.length != 0){
    this.image = new Image();
    this.name = this.names[this.index];
    this.image.src = this.filePath;
    this.initText = this.filePath;
    this.image.onload = () => {
      this.imgWidth = this.image.width;
      this.imgHeight = this.image.height;
      console.log("breite: " + this.imgWidth + " höhe: " + this.imgHeight);
      this.annotations[this.index - 1].height = this.imgHeight;
      this.annotations[this.index - 1].width = this.imgWidth;
      this.displayImgWidth = this.imgWidth;
      this.displayImgHeight = this.imgHeight;
      this.scaleFactor = 1.0;
      while (this.displayImgWidth > 1000 || this.displayImgHeight > 1000) {
        this.displayImgWidth = this.displayImgWidth / 2;
        this.displayImgHeight = this.displayImgHeight / 2;
        this.scaleFactor = this.scaleFactor / 2;
      }
      this.showImage();
      if (this.firstImage) {
        this.firstImage = false;
      }
    };

    //this.autoSaveBoundingBoxes();
    this.index++;

    this.download(this.names[this.index]);
    //}
  }

  previousImage() {
    this.index = this.index - 2;
    this.nextImage();
  }

  toStart() {
    this.index = 0;
    this.nextImage();
  }

  addBoxesToAnnotations() {
    let bool = false;

    console.log("länge: " + this.annotations.length + " Länge von csv: " + this.records.length);
    for (let i = 0; i < this.annotations.length; i++) {
      this.records.forEach(b => {
        if (b.bildName == this.annotations[i].bildName) {
          bool = true;

          let box: BoundingBox;
          box = new BoundingBox();

          box.essen = b.essen;
          box.x1 = b.x1;
          box.y1 = b.y1;
          box.x2 = b.x2;
          box.y2 = b.y2;

          this.annotations[i].height = b.height;
          this.annotations[i].width = b.width;

          this.annotations[i].boxes.push(box);
        }
      });
      if (bool) {
        this.addTagsForMLKIT(this.annotations[i]);
        this.annotations[i].added = true;
        bool = false;
      }
    }
    this.tagList.forEach(t => {
      console.log(t.tagName + " bild: " + t.bilder.length);
    });
  }

  addTagsForMLKIT(a: Annotation) {

    let tagCount = 10000;
    let tag = "";
    let bo = false;

    let tagObject: Tag;

    a.boxes.forEach(b => {
      this.tagList.forEach(t => {
        if (t.tagName == b.essen) {
          bo = true;
          if (t.bilder.length <= tagCount) {
            tagCount = t.bilder.length;
            tag = b.essen;
          }
        }
      });
      if (!bo) {
        tagObject = new Tag();

        tagObject.bilder = [];
        tagObject.tagName = b.essen;
        tagObject.test = 0;
        tagObject.validate = 0;
        tagObject.train = 0;
        tagObject.count = 0;

        tag = b.essen;

        this.tagList.push(tagObject);
      }
    });

    if (!a.added) {
      this.tagList.forEach(t => {
        if (t.tagName == tag) {
          console.log("added image to: " + t.tagName + " image: " + a.bildName);
          t.bilder.push(a.bildName);
        }
      });
    }
  }

  uploadListenerCSV(event) {
    
    let input = event.target;  
    let reader = new FileReader();  
    reader.readAsText(input.files[0]);  

    reader.onload = () => {  
      let csvData = reader.result;  
      let csvRecordsArray = (<string>csvData).split(/\r\n|\n/);  

      this.records = this.getDataRecordsArrayFromCSVFile(csvRecordsArray, 8);
    }; 
  }

  getDataRecordsArrayFromCSVFile(csvRecordsArray: any, headerLength: number) {
    let csvArr = [];  
  
    for (let i = 1; i < csvRecordsArray.length; i++) {  
      let curruntRecord = (<string>csvRecordsArray[i]).split(',');  
      if (curruntRecord.length == headerLength) {  
        let csvRecord: CSVRecord = new CSVRecord();  
        csvRecord.bildName = curruntRecord[0].trim();
        csvRecord.x1 = parseInt(curruntRecord[1].trim());  
        csvRecord.y1 = parseInt(curruntRecord[2].trim());  
        csvRecord.x2 = parseInt(curruntRecord[3].trim());  
        csvRecord.y2 = parseInt(curruntRecord[4].trim());  
        csvRecord.essen = curruntRecord[5].trim();
        csvRecord.height = parseInt(curruntRecord[6].trim());
        csvRecord.width = parseInt(curruntRecord[7].trim());
        csvArr.push(csvRecord);  
      }  
    }  
    return csvArr;   
  }

  save() {
    this.getCSVfromAnnotation();
    this.exportToCsv("test.csv", this.newBoxes);
  }

  getCSVfromAnnotation(){
    this.newBoxes = [];
    this.annotations.forEach(b => {
      b.boxes.forEach(bo => {

        let box: CSVRecord;
        box = new CSVRecord();

        box.bildName = b.bildName;
        box.x1 = bo.x1;
        box.y1 = bo.y1;
        box.x2 = bo.x2;
        box.y2 = bo.y2;
        box.essen = bo.essen;
        box.height = b.height;
        box.width = b.width;

        this.newBoxes.push(box);
      });
    });
  }

  saveForMLkit() {
    this.getCSVforMLKITfromAnnotation();
    this.exportToCsv("mlKitCSV.csv", this.csvMLkitBoxes);
  }

  getCSVforMLKITfromAnnotation(){

    this.csvMLkitBoxes = [];
    this.tagList.forEach(t => {
      this.annotations.forEach(b => {

        if (t.bilder[t.count] == b.bildName) {
          t.count++;

          b.boxes.forEach(bo => {
            //if (bo.essen == t.tagName) { //Reihenfolge könnte wichtig sein wegen test, validate und train bilder
              let box: CSVRecordMLKIT;
              box = new CSVRecordMLKIT();
      
              box.purpose = this.getPurpose(t);
              box.bildName = "gs://folderfoodown/" + b.bildName;
      
              box.essen = bo.essen;
              box.x1 = (bo.x1 / b.width);
              box.y1 = (bo.y1 / b.height);
              box.e1 = "";
              box.e2 = "";
              box.x2 = (bo.x2 / b.width);
              box.y2 = (bo.y2 / b.height);
              box.e3 = "";
              box.e4 = "";
        
              /*if (box.x1 < 0) box.x1 = 0;
              if (box.x1 > 1) box.x1 = 1;
              if (box.y1 < 0) box.y1 = 0;
              if (box.y1 > 1) box.y1 = 1;
              if (box.x2 < 0) box.x2 = 0;
              if (box.x2 > 1) box.x2 = 1;
              if (box.y2 < 0) box.y2 = 0;
              if (box.y2 > 1) box.y2 = 1;*/
              this.csvMLkitBoxes.push(box);
            //}
          });
        }
      });
    });
  }

  saveForMLkitFromMLkit() {
    this.getFileForMLkit();
    this.exportToCsv("mlKitCSVfromMLKIT.csv", this.csvMLkitBoxes);
  }

  getFileForMLkit(){

    this.csvMLkitBoxes = [];
    
    this.csvFromMLKIT.forEach(c => {
      let box: CSVRecordMLKIT;
      box = new CSVRecordMLKIT();

      box.purpose = "";
      box.bildName = "gs://folderfoodown/" + c.bildName;

      box.essen = c.essen;
      box.x1 = c.x1;
      box.y1 = c.y1;
      box.e1 = "";
      box.e2 = "";
      box.x2 = c.x2;
      box.y2 = c.y2;
      box.e3 = "";
      box.e4 = "";


      this.csvMLkitBoxes.push(box);
    });
  }

  getPurpose(t: Tag) {
    let purp = "";

    if (t.test < 0.1*t.bilder.length && t.validate >= t.test) {
      t.test++;
      purp = "TEST";
    } else if(t.validate < 0.1*t.bilder.length) {
      t.validate++;
      purp = "VALIDATE";
    } else {
      t.train++;
      purp = "TRAIN";
    }

    return purp;
  }

  //###################################################################################
  //###################################################################################

  showImage() {
    this.layer1CanvasElement = this.layer1Canvas.nativeElement;
    this.context = this.layer1CanvasElement.getContext("2d");
    this.layer1CanvasElement.width = this.displayImgWidth;
    this.layer1CanvasElement.height = this.displayImgHeight;
    this.context.drawImage(this.image, 0, 0, this.displayImgWidth, this.displayImgHeight);

    let parent = this;

    if (this.firstImage) {
      this.layer1CanvasElement.addEventListener("mousedown", function(e) {
        parent.isMouseDown = true;
        let b: CSVRecord;
        b = new CSVRecord();
        parent.boundingBoxes.push(b);

        let rect = parent.layer1CanvasElement.getBoundingClientRect();

        parent.boundingBoxes[parent.boundingBoxes.length - 1].x1 = (e.clientX - rect.left) / parent.scaleFactor;
        parent.boundingBoxes[parent.boundingBoxes.length - 1].y1 = (e.clientY - rect.top) / parent.scaleFactor;
        parent.boundingBoxes[parent.boundingBoxes.length - 1].bildName = parent.name;
        parent.boundingBoxes[parent.boundingBoxes.length - 1].essen = "test";
      });

      this.layer1CanvasElement.addEventListener("mousemove", function(e) {
        if (!parent.isMouseDown) return;
        parent.context.clearRect(0, 0, parent.context.canvas.width, parent.context.canvas.height);
        parent.context.drawImage(parent.image, 0, 0, parent.displayImgWidth, parent.displayImgHeight);

        let rect = parent.layer1CanvasElement.getBoundingClientRect();

        parent.boundingBoxes[parent.boundingBoxes.length - 1].x2 = (e.clientX - rect.left) / parent.scaleFactor;
        parent.boundingBoxes[parent.boundingBoxes.length - 1].y2 = (e.clientY - rect.top) / parent.scaleFactor;
        parent.drawRect(parent.boundingBoxes[parent.boundingBoxes.length - 1]);
      });
  
      this.layer1CanvasElement.addEventListener("mouseup", function(e) {
        parent.isMouseDown = false;

        let rect = parent.layer1CanvasElement.getBoundingClientRect();

        parent.boundingBoxes[parent.boundingBoxes.length - 1].x2 = (e.clientX - rect.left) / parent.scaleFactor;
        parent.boundingBoxes[parent.boundingBoxes.length - 1].y2 = (e.clientY - rect.top) / parent.scaleFactor;
        parent.indexBild++;

        parent.redraw();

        parent.openDialog();
      });
    }
    
    this.boundingBoxes.forEach(b => {
      this.drawRect(b);
    });
  }

  drawRect(b: any, color = "aqua") {
    this.context.beginPath();
    this.context.rect(b.x1 * this.scaleFactor, b.y1 * this.scaleFactor, (b.x2 - b.x1) * this.scaleFactor, (b.y2 - b.y1) * this.scaleFactor);
    this.context.lineWidth = 2;
    this.context.strokeStyle = color;
    this.context.stroke();
  }

  redraw() {
    this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
    this.context.drawImage(this.image, 0, 0, this.displayImgWidth, this.displayImgHeight);
    this.boundingBoxes.forEach(b => {
      this.drawRect(b);
    });
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(TagSelectionDialogComponent, {
      width: '500px',
      height: '400px',
      data: { tag: '', tags: this.tags }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      this.boundingBoxes[this.boundingBoxes.length - 1].essen = result;
      this.addToTags(result);
    });
  }

  addToTags(tag: string) {
    let contains = false;
    this.tags.forEach(t => {
      if (t == tag) {
        contains = true;
        return;
      }
    });
    if (!contains) this.tags.push(tag);
  }

  exportToCsv(filename: string, rows: object[]) {
    if (!rows || !rows.length) {
      return;
    }
    const separator = ',';
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      '\n' +
      rows.map(row => {
        return keys.map(k => {
          let cell = row[k] === null || row[k] === undefined ? '' : row[k];
          cell = cell instanceof Date
            ? cell.toLocaleString()
            : cell.toString().replace(/"/g, '""');
          if (cell.search(/("|,|\n)/g) >= 0) {
            cell = `"${cell}"`;
          }
          return cell;
        }).join(separator);
      }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
      navigator.msSaveBlob(blob, filename);
    } else {
      const link = document.createElement('a');
      if (link.download !== undefined) {
        // Browsers that support HTML5 download attribute
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  }

  autoSaveBoundingBoxes() {
    if (!this.newBoxes || !this.newBoxes.length) {
      return;
    }
    const separator = ',';
    const keys = Object.keys(this.newBoxes[0]);
    const csvContent =
      keys.join(separator) +
      '\n' +
      this.newBoxes.map(row => {
        return keys.map(k => {
          let cell = row[k] === null || row[k] === undefined ? '' : row[k];
          cell = cell instanceof Date
            ? cell.toLocaleString()
            : cell.toString().replace(/"/g, '""');
          if (cell.search(/("|,|\n)/g) >= 0) {
            cell = `"${cell}"`;
          }
          return cell;
        }).join(separator);
      }).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const path = "dataset/" + this.subfolder + "/tmp.csv";
    const ref = this.afStorage.ref(path);
    let task = this.afStorage.upload(path, blob);
    task.snapshotChanges()
    .pipe(
      finalize(() => {
        const url = ref.getDownloadURL();
        url.subscribe(url => {
          if (url) {
          }
        });
      })
    )
    .subscribe(url => {});
  }

  delete(box: CSVRecord) {
    let i = 0;

    this.boundingBoxes.forEach(b => {
      if (box.essen == b.essen && box.x1 == b.x1 && box.y1 == b.y1) {
        this.boundingBoxes.splice(i,1);
      }
      i++;
    });

    this.redraw();
  }

}