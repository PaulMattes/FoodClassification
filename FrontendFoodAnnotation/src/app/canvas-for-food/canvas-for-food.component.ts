import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CSVRecord } from '../csv-record';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-canvas-for-food',
  templateUrl: './canvas-for-food.component.html',
  styleUrls: ['./canvas-for-food.component.css']
})
export class CanvasForFoodComponent implements OnInit {

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

  public boundingBox: CSVRecord;

  public rect: any;

  public drag = false;
  public firstImage = true;

  public contentHeight: number;

  @ViewChild("div1", { static: false}) div1: ElementRef;

  @ViewChild("layer1", { static: false }) layer1Canvas: ElementRef;
  private context: CanvasRenderingContext2D;
  private layer1CanvasElement: any;

  fileList = [];

  index = 0;
  indexBild = 0;
  indexForBoundingBoxes = 0;
  testIndex = 0;

  constructor() { }

  ngOnInit(): void {
    this.initText = "voll";
    this.boundingBox = new CSVRecord();
  }

  ngAfterViewInit() {
    this.contentHeight = this.div1.nativeElement.offsetHeight;
  }

  handleFiles(event) {
    if (event.target.files && event.target.files[0]) {

      this.fileList = [];

      for(var i = 0; i < event.target.files.length; i++) {
          this.fileList.push(event.target.files[i].name);   
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
  }


  delete(box: CSVRecord) {
    let i = 0;

    this.boundingBoxes.forEach(b => {
      if (box.essen == b.essen && box.x1 == b.x1 && box.y1 == b.y1) {
        this.boundingBoxes.splice(i,1);
      }
      i++;
    });
  }

  nextImage() {

    this.indexText = "" + this.index;

    this.saveBoundingBoxes();
    
    this.boundingBoxes = [];

    this.records.forEach(b => {
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

    if(this.fileList.length != 0){
      this.image = new Image();
      this.name = this.fileList[this.index];
      this.image.src = "assets/detection/" + this.fileList[this.index];
      this.image.onload = () => {
        this.imgWidth = this.image.width;
        this.imgHeight = this.image.height;
        this.showImage();
        if (this.firstImage) {
          this.firstImage = false;
        }
      };

      this.index++;
    }
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
        let b: CSVRecord;
        b = new CSVRecord();
        parent.boundingBoxes.push(b);

        let rect = parent.layer1CanvasElement.getBoundingClientRect();

        parent.boundingBoxes[parent.boundingBoxes.length - 1].x1 = e.clientX - rect.left;
        parent.boundingBoxes[parent.boundingBoxes.length - 1].y1 = e.clientY - rect.top;
        parent.boundingBoxes[parent.boundingBoxes.length - 1].bildName = parent.name;
        parent.boundingBoxes[parent.boundingBoxes.length - 1].essen = "essen";
      });
  
      this.layer1CanvasElement.addEventListener("mouseup", function(e) {

        let rect = parent.layer1CanvasElement.getBoundingClientRect();

        parent.boundingBoxes[parent.boundingBoxes.length - 1].x2 = e.clientX - rect.left;
        parent.boundingBoxes[parent.boundingBoxes.length - 1].y2 = e.clientY - rect.top;
        parent.indexBild++;
        parent.drawRect(parent.boundingBoxes[parent.boundingBoxes.length - 1]);
      });
    }
    
    this.boundingBoxes.forEach(b => {
      this.drawRect(b);
    });
  }

  drawRect(b: any, color = "black") {
    this.context.beginPath();
    this.context.rect(b.x1, b.y1, (b.x2 - b.x1), (b.y2 - b.y1));
    this.context.lineWidth = 10;
    this.context.strokeStyle = color;
    this.context.stroke();
  }


  save() {
    this.exportToCsv("test.csv", this.newBoxes);
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
