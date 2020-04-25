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

  public imgWidth: number;
  public imgHeight: number;
  public url: string;
  public image;

  public records: any[] = [];
  public boundingBoxes: any[] = [];
  public newBoxes: any[] = [];
  public csvMLkitBoxes: any[] = [];
  public images: string[] = [];
  public snaps: any[] = [];
  public names: string[] = [];
  public tags: string[] = [];

  public headElements = ['x1', 'x2', 'y1', 'y2', 'Bildname', 'Essensname']

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

  constructor(afStorage: AngularFireStorage, public dialog: MatDialog) {
    this.afStorage = afStorage;
  }

  ngOnInit(): void {
    this.initText = "voll";
    this.boundingBox = new CSVRecord();
    this.afStorage.ref("/images/").listAll().subscribe(n => {
      n.items.forEach(b => {
        this.names.push(b.name);
        this.download(this.names[0]);
        console.log(b.name);
      });
    });
  }

  ngAfterViewInit() {
    this.contentHeight = this.div1.nativeElement.offsetHeight;
  }

  async upload(event) {
    for (var i = 0; i < event.target.files.length; i++) {
      this.snaps[i] = this.afStorage.upload("/images/" + event.target.files[i].name, event.target.files[i]);
    }
  }

  download(name: string) {
    this.afStorage.ref("/images/" + name).getDownloadURL().subscribe(d => {
      this.filePath = d;
      console.log(d);
    });
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
    this.boundingBoxes.forEach(b => {
      let box: CSVRecord;
      box = new CSVRecord();

      box.bildName = b.bildName;
      box.x1 = b.x1;
      box.y1 = b.y1;
      box.x2 = b.x2;
      box.y2 = b.y2;
      box.essen = b.essen;
      
      this.newBoxes.push(box);
    });
    this.boundingBoxes.forEach(b => {
      let box: CSVRecordMLKIT;
      box = new CSVRecordMLKIT();

      box.purpose = "TRAIN";
      box.bildName = "gs://folderfoodown/" + b.bildName;
      box.essen = b.essen;
      box.x1 = (b.x1 / this.imgWidth);
      box.y1 = (b.y1 / this.imgHeight);
      box.e1 = "";
      box.e2 = "";
      box.x2 = (b.x2 / this.imgWidth);
      box.y2 = (b.y2 / this.imgHeight);
      box.e3 = "";
      box.e4 = "";

      this.csvMLkitBoxes.push(box);
    });
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

  nextImage() {

    this.indexText = "" + this.index;

    this.saveBoundingBoxes();
    
    this.boundingBoxes = [];

    this.records.forEach(b => {
      console.log(b.bildName);
      console.log(this.fileList[this.index]);
      if (b.bildName == this.fileList[this.index]) {
        let box: CSVRecord;
        box = new CSVRecord();

        this.boundingBoxes.push(box);

        this.boundingBoxes[this.boundingBoxes.length - 1].bildName = b.bildName;
        this.boundingBoxes[this.boundingBoxes.length - 1].essen = b.essen;
        this.boundingBoxes[this.boundingBoxes.length - 1].x1 = b.x1;
        this.boundingBoxes[this.boundingBoxes.length - 1].y1 = b.y1;
        this.boundingBoxes[this.boundingBoxes.length - 1].x2 = b.x2;
        this.boundingBoxes[this.boundingBoxes.length - 1].y2 = b.y2;

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
        this.showImage();
        if (this.firstImage) {
          this.firstImage = false;
        }
      };

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

  uploadListenerCSV(event) {
    this.name = "csvFile";

    let input = event.target;  
    let reader = new FileReader();  
    reader.readAsText(input.files[0]);  

    reader.onload = () => {  
      let csvData = reader.result;  
      let csvRecordsArray = (<string>csvData).split(/\r\n|\n/);  

      this.records = this.getDataRecordsArrayFromCSVFile(csvRecordsArray, 6);
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
        csvArr.push(csvRecord);  
      }  
    }  
    return csvArr;   
  }

  showImage() {
    this.layer1CanvasElement = this.layer1Canvas.nativeElement;
    this.context = this.layer1CanvasElement.getContext("2d");
    this.layer1CanvasElement.width = this.imgWidth;
    this.layer1CanvasElement.height = this.imgHeight;
    this.context.drawImage(this.image, 0, 0, this.imgWidth, this.imgHeight);

    let parent = this;

    if (this.firstImage) {
      this.layer1CanvasElement.addEventListener("mousedown", function(e) {
        parent.isMouseDown = true;
        let b: CSVRecord;
        b = new CSVRecord();
        parent.boundingBoxes.push(b);

        let rect = parent.layer1CanvasElement.getBoundingClientRect();

        parent.boundingBoxes[parent.boundingBoxes.length - 1].x1 = e.clientX - rect.left;
        parent.boundingBoxes[parent.boundingBoxes.length - 1].y1 = e.clientY - rect.top;
        parent.boundingBoxes[parent.boundingBoxes.length - 1].bildName = parent.name;
        parent.boundingBoxes[parent.boundingBoxes.length - 1].essen = "test";
      });

      this.layer1CanvasElement.addEventListener("mousemove", function(e) {
        if (!parent.isMouseDown) return;
        parent.context.clearRect(0, 0, parent.context.canvas.width, parent.context.canvas.height);
        parent.context.drawImage(parent.image, 0, 0, parent.imgWidth, parent.imgHeight);

        let rect = parent.layer1CanvasElement.getBoundingClientRect();

        parent.boundingBoxes[parent.boundingBoxes.length - 1].x2 = e.clientX - rect.left;
        parent.boundingBoxes[parent.boundingBoxes.length - 1].y2 = e.clientY - rect.top;
        parent.drawRect(parent.boundingBoxes[parent.boundingBoxes.length - 1]);
      });
  
      this.layer1CanvasElement.addEventListener("mouseup", function(e) {
        parent.isMouseDown = false;

        let rect = parent.layer1CanvasElement.getBoundingClientRect();

        parent.boundingBoxes[parent.boundingBoxes.length - 1].x2 = e.clientX - rect.left;
        parent.boundingBoxes[parent.boundingBoxes.length - 1].y2 = e.clientY - rect.top;
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
    this.context.rect(b.x1, b.y1, (b.x2 - b.x1), (b.y2 - b.y1));
    this.context.lineWidth = 2;
    this.context.strokeStyle = color;
    this.context.stroke();
  }

  redraw() {
    this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
    this.context.drawImage(this.image, 0, 0, this.imgWidth, this.imgHeight);
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

  save() {
    this.exportToCsv("test.csv", this.newBoxes);
  }

  saveForMLkit() {
    this.exportToCsv("mlKitCSV.csv", this.csvMLkitBoxes);
  }

  //###################################################################################

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

}