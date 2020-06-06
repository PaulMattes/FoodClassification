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

import {MatChipsModule} from '@angular/material/chips';

import { map, finalize, startWith, delay } from "rxjs/operators";
import { Observable } from "rxjs";
import { timingSafeEqual } from 'crypto';
import { Annotation } from '../annotaton';
import { BoundingBox } from '../bounding-box';
import { CsvService } from '../csv.service';
import { Tag } from '../tag';
import { Csvmlkit } from '../csvmlkit';
import { FormControl } from '@angular/forms';

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

  selectedTag = "Alle";

  public subfolder = '0';

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
  public lastTags: string[] = [];
  public annotations: Annotation[] = [];
  public tagList: Tag[] = [];
  public annotationsToShow: Annotation[] = [];
  public tagsLessTen: string[] = [];

  public blob: Blob;

  public uploadedFiles = 0;
  public uploadProgress = 0;
  public totalUploadFiles = 0;
  public counterVar = 0;

  public headElements = ['x1', 'x2', 'y1', 'y2', 'Bild', 'Tag']

  public boundingBox: CSVRecord;

  public rect: any;

  public drag = false;
  public firstImage = true;
  public boolForMLKIT = true;
  public firstSave = true;
  public booleanImageOrder = true;
  public booleanDelete = false;

  public contentHeight: number;

  @ViewChild("div1", { static: false}) div1: ElementRef;

  @ViewChild("layer1", { static: false }) layer1Canvas: ElementRef;
  private context: CanvasRenderingContext2D;
  private layer1CanvasElement: any;
  private isMouseDown: boolean;

  filePath = "";
  public filePathPrevious = "";
  fileList = [];

  index = 0;
  indexBild = 0;
  indexForBoundingBoxes = 0;
  testIndex = 0;

  ref: AngularFireStorageReference;
  task: AngularFireUploadTask;

  csvModel: CsvModelComponent;

  autoCompleteControl = new FormControl();
  public autoCompleteOptions: string[] = [];
  filteredOptions: Observable<string[]>;

  constructor(afStorage: AngularFireStorage, public dialog: MatDialog, private csvService: CsvService) {
    this.afStorage = afStorage;
  }

  ngOnInit(): void {
    this.boundingBox = new CSVRecord();
    
    this.autoCompleteOptions = [];
    this.autoCompleteOptions.push("Alle");
    this.autoCompleteOptions.push("Ohne Tag");
    this.filteredOptions = this.autoCompleteControl.valueChanges
      .pipe(
        startWith(''),
        map(value => {
          return this._filter(value);
        })
      );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.autoCompleteOptions.filter(option => option.toLowerCase().includes(filterValue));
  }

  ngAfterViewInit() {
      this.contentHeight = this.div1.nativeElement.offsetHeight;
  }

  printSomething() {
    console.log("hey");
  }

  /*#########################################################################################################
  BILDER LADEN PLUS DOWNLOADS
  #########################################################################################################*/

  //Funktion wird aufgerufen, wenn der "Bilder laden" Button gedrückt wird
  async loadImagesFromStorage() {
    this.index = 0;
    this.names = [];
    this.fileList = [];
    this.annotations = [];
    this.annotationsToShow = [];
    this.firstSave = true;
    this.afStorage.ref("/dataset/" + this.subfolder + "/images").listAll().subscribe(n => {
      n.items.forEach(async b => {
        this.names.push(b.name);

        let a: Annotation;
        a = new Annotation();

        a.bildName = b.name;
        a.added = false;
        a.filePath = "";
        a.deleted = false;
        a.boxes = [];

        this.annotations.push(a);
        this.annotationsToShow.push(a);
      });
      this.download(this.names[0]);
    });
  }

  //Lädt ein Bild herunter und speichert den Path in filePath
  async download(name: string) {
    this.afStorage.ref("/dataset/" + this.subfolder + "/images/" + name).getDownloadURL().subscribe(d => {
      this.filePath = d;
    });
  }

  async downloadPrevious(name: string) {
    this.afStorage.ref("/dataset/" + this.subfolder + "/images/" + name).getDownloadURL().subscribe(d => {
      this.filePathPrevious = d;
    });
  }

  //Lädt die CSV-Datei direkt von Firebase herunter
  downloadCSVfromMLKIT() {
    this.afStorage.ref("/dataset/" + this.subfolder + "/tmp.csv").getDownloadURL().subscribe(d => {
      this.uploadListenerCSVfromMLKIT(d);
    });
  }

  //sollte alle Bilder laden und die URLs abspeichern
  async downLoadImagesByURL() {
    console.log("Länge von names: " + this.annotations.length);
    for (var j = 0; j < this.annotations.length; j++){
      let url = await this.afStorage.ref("/dataset/" + this.subfolder + "/images/" + this.annotations[j].bildName).getDownloadURL().toPromise();

      this.annotations[j].filePath = url;
      
      console.log("i ist: " + j + " name: " + this.annotations[j].bildName + " url: " + url);
    }
  }

  //Methode welche die Bildergröße laden sollte (geht noch nicht)
  loadImageSize() {

    for(var i = 0; i < this.annotations.length /16; i++) {
      this.image = new Image();
      this.image.src = this.annotations[i].filePath;

      let parent = this;
      this.image.onload = function (event) {
        let  loadedImage = event.currentTarget;
        let width = loadedImage.width;
        let height = loadedImage.height;
        parent.annotations[parent.counterVar].width = width;
        parent.annotations[parent.counterVar].height = height;
        parent.counterVar++;
      }
    }
  }

  /*#########################################################################################################
  UPLOAD VON DATEN
  #########################################################################################################*/

  //nimmt Bilder vom lokalen PC entgegen - deprecated
  handleFiles(event) {
    if (event.target.files && event.target.files[0]) {

      this.fileList = [];

      for(var i = 0; i < event.target.files.length; i++) {
        this.fileList.push(event.target.files[i]);   
      }
    }  
  }

  //nimmt CSV-Datei entgegen, welche von ML KIT erzeugt wurde
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

  //gehört zu uploadCSVfromMLKIT
  getDataFromCSVMLKIT(csvRecordsArray: any, headerLength: number) {
    let csvArr = [];  
  
    for (let i = 1; i < csvRecordsArray.length; i++) {  
      let curruntRecord = (<string>csvRecordsArray[i]).split(',');  
      if (curruntRecord.length == headerLength) {  
        let csvMLkit: Csvmlkit = new Csvmlkit();
        csvMLkit.bildName = curruntRecord[1].trim().replace("gs://dataset_food_detection/images/", "");
        csvMLkit.essen = curruntRecord[2].trim();
        csvMLkit.x1 = parseFloat(curruntRecord[3].trim());  
        csvMLkit.y1 = parseFloat(curruntRecord[4].trim());  
        csvMLkit.x2 = parseFloat(curruntRecord[7].trim());  
        csvMLkit.y2 = parseFloat(curruntRecord[8].trim());
        let contained = false;
        for (let j = 0; j < csvArr.length; j++) {
          if (csvArr[j].bildName == csvMLkit.bildName && csvArr[j].essen == csvMLkit.essen && csvArr[j].x1 == csvMLkit.x1 && csvArr[j].y1 == csvMLkit.y1 && csvArr[j].x2 == csvMLkit.x2 && csvArr[j].y2 == csvMLkit.y2) {
            contained = true;
            break;
          }
        }
        if (!contained) csvArr.push(csvMLkit);  
      }  
    }  
    console.log("Länge: " + csvArr.length);
    return csvArr;   
  }

  //sollte CSV-Datei direkt von Firebase laden (geht noch nicht!)
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

  //Hochladen von Bildern auf den Firebase Storage
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

  //nimmt CSV-Datei vom lokalen PC entgegen
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

  //gehört zu uploadListenerCSV
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

  /*#########################################################################################################
  METHODEN ZUR VERARBEITUNG DER GELADENEN BILDER/DATEIEN
  #########################################################################################################*/

  deleteImage() {
    this.annotationsToShow[this.index - 1].deleted = true;
    this.afStorage.ref("/dataset/" + this.subfolder + "/images/" + this.annotationsToShow[this.index - 1].bildName).delete().toPromise();
    this.sortImages(this.index - 1);
    console.log("gelöscht");
  }

  setSelectedTag(tag: string) {
    this.selectedTag = tag;
    this.sortImages(0);
  }

  sortImages(ind: number) {

    this.index = ind;
    this.annotationsToShow = [];
    let tagTrue = false;
    this.firstSave = true;

    this.annotations.forEach(a => {
      if (a.deleted) {

      } else {
        tagTrue = false;
        if (this.selectedTag == "Alle") {
          this.annotationsToShow.push(a);
        } else if (this.selectedTag == "Ohne Tag") {
          if (a.boxes.length == 0){
            this.annotationsToShow.push(a);
          }
        } else {
          a.boxes.forEach(b => {
            if (b.essen == this.selectedTag) {
              tagTrue = true;
            }
          });
          if (tagTrue) {
            this.annotationsToShow.push(a);
          }
        }
      }  
    });

    this.download(this.annotationsToShow[0].bildName);
  }

  //nimmt die geladene CSV-Datei von ML KIT und löscht alle Bilder auf Firebase, welche nicht in der Datei vorkommen
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
        count++;
      }
      bool = false;
    });
    console.log("anzahl: " + count);
  }

  showTags() {
    this.tagList.forEach(t => {
      console.log("tag: " + t.tagName + " count: " + t.count);
    });
  }

  //Output Methode, welche Kontrollausgaben macht
  showAnnotationsSmall() {
    for (var k = 0; k < this.annotations.length/16; k++){
      console.log("width: " + this.annotations[k].width);
    }
  }

  //Output Methode, welche Bildnamen plus Breite und Höhe ausgibt
  showAnnotations() {
    this.annotationsToShow.forEach(a => {
      console.log("bildName: " + a.bildName + " box: " + a.boxes[0].essen);
    });
  }

  //Methode welche die bestehenden Bounding Boxen aus einer CSV-Datei zu der Annoationliste hinzufügen
  addBoxesToAnnotationsMLKIT() {
    let bool = false;

    for (let i = 0; i < this.annotations.length; i++) {
      for (let j = 0; j < this.csvFromMLKIT.length; j++) {
        if (this.csvFromMLKIT[j].bildName == this.annotations[i].bildName) {
          bool = true;

          let box: BoundingBox;
          box = new BoundingBox();

          box.essen = this.csvFromMLKIT[j].essen;
          box.x1 = this.csvFromMLKIT[j].x1;
          box.y1 = this.csvFromMLKIT[j].y1;
          box.x2 = this.csvFromMLKIT[j].x2;
          box.y2 = this.csvFromMLKIT[j].y2;

          //this.annotations[i].height = b.height;
          //this.annotations[i].width = b.width;

          this.annotations[i].boxes.push(box);

          this.addToTags(box.essen);
        }
      }
      if (bool) {
        this.addTagsForMLKIT(this.annotations[i]);
        this.annotations[i].added = true;
        bool = false;
      }
    }
    this.tagList.sort((a,b) => a.tagName.localeCompare(b.tagName));

    this.tagList.forEach(t => {
      this.autoCompleteOptions.push(t.tagName);
    });

  }

  //Methode welche die bestehenden Bounding Boxen aus einer CSV-Datei zu der Annoationliste hinzufügen
  addBoxesToAnnotations() {
    let bool = false;

    this.boolForMLKIT = false;

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
      console.log(t.tagName + " bild: " + t.count);
    });
  }

  //Methode, welche neue Annotationen hinzufügt
  addTagsForMLKIT(a: Annotation) {

    let tagCount = 10000;
    let tag = "";
    let bo = false;

    let tagObject: Tag;

    a.boxes.forEach(b => {
      bo = false;
      this.tagList.forEach(t => {
        if (t.tagName == b.essen) {
          bo = true;
          t.count++;
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
  }

  /*#########################################################################################################
  NÄCHSTES BILD AUFRUFEN + DAZUGEHÖRIGE METHODEN
  #########################################################################################################*/

  //Speichert Bounding Boxen in Annotation zurück
  saveBoundingBoxes() {

    let counter = 0;

    if (this.booleanImageOrder) {
      counter = this.index - 1;
    } else {
      counter = this.index + 1;
    }

    this.annotationsToShow[counter].boxes = [];

    this.boundingBoxes.forEach(b => {
      let box: BoundingBox;
      box = new BoundingBox();

      box.x1 = b.x1;
      box.y1 = b.y1;
      box.x2 = b.x2;
      box.y2 = b.y2;
      box.essen = b.essen;
      
      this.annotationsToShow[counter].boxes.push(box);
    });

    this.addTagsForMLKIT(this.annotationsToShow[counter]);
    this.annotationsToShow[counter].added = true;
  }

  //Wird aufgerufen, wenn der Button "nächstes Bild" gedürckt wird; Sichert die Bounding Boxen, wenn es nicht das erste Bild ist und schaut, ob es neue Bounding Boxen für das nächste Bild gibt
  nextImage() {
    
    console.log("index: " + this.index);

    if (!(this.firstSave)){
      this.saveBoundingBoxes();
    }

    this.boundingBoxes = [];

    if (!(this.annotationsToShow[this.index].deleted)){
      this.annotationsToShow[this.index].boxes.forEach(b => {
        let box: CSVRecord;
        box = new CSVRecord();
  
        this.boundingBoxes.push(box);
  
        this.boundingBoxes[this.boundingBoxes.length - 1].bildName = this.annotationsToShow[this.index].bildName;
        this.boundingBoxes[this.boundingBoxes.length - 1].essen = b.essen;
        this.boundingBoxes[this.boundingBoxes.length - 1].x1 = b.x1;
        this.boundingBoxes[this.boundingBoxes.length - 1].y1 = b.y1;
        this.boundingBoxes[this.boundingBoxes.length - 1].x2 = b.x2;
        this.boundingBoxes[this.boundingBoxes.length - 1].y2 = b.y2;
  
      });
    }

    this.image = new Image();
    if (this.booleanImageOrder) {
      this.image.src = this.filePath;
    } else {
      this.image.src = this.filePathPrevious;
      this.booleanImageOrder = true;
    }

    this.image.onload = () => {
      this.imgWidth = this.image.width;
      this.imgHeight = this.image.height;
      this.annotationsToShow[this.index - 1].height = this.imgHeight;
      this.annotationsToShow[this.index - 1].width = this.imgWidth;
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
      if (this.firstSave) {
        this.firstSave = false;
      }
    };

    this.index++;

    this.download(this.annotationsToShow[this.index].bildName);
    if (this.index - 2 > -1) {
      this.downloadPrevious(this.annotationsToShow[this.index - 2].bildName);
    }  

    //this.autoSaveBoundingBoxes();
  }

  //vorheriges Bild
  previousImage() {
    this.booleanImageOrder = false;
    this.index = this.index - 2;
    if (this.index <= 0) {
      this.index = 0;
      this.firstSave = true;
    } 
    this.nextImage();
  }

  //wieder zum Anfang der Bilder
  toStart() {
    this.index = 0;
    this.nextImage();
  }

  /*#########################################################################################################
  SICHERN DER CSV DATEN
  #########################################################################################################*/
  
  async deleteImageDuringSaving(b: string) {
    this.afStorage.ref("/dataset/" + this.subfolder + "/images/" + b).delete().toPromise();
  }

  //CSV-Datei in unserem Format erstellen und als "test.csv" speichern
  save() {
    this.getCSVfromAnnotation();
    const date = new Date().toJSON().slice(0, 19);
    this.exportToCsv("annotations-" + date + ".csv", this.newBoxes);
  }

  //holt die Infos für die CSV-Datei aus der Annotationliste
  getCSVfromAnnotation(){
    this.newBoxes = [];
    this.annotations.forEach(b => {
      if (b.deleted) {
        //this.deleteImageDuringSaving(b.bildName);
      } else {
        b.boxes.forEach(bo => {

          let box: CSVRecordMLKIT;
          box = new CSVRecordMLKIT();
  
          box.purpose = "";
          box.bildName = "gs://dataset_food_detection/images/" + b.bildName;
  
          box.essen = bo.essen;
          box.x1 = bo.x1;
          box.y1 = bo.y1;
          box.e1 = "";
          box.e2 = "";
          box.x2 = bo.x2;
          box.y2 = bo.y2;
          box.e3 = "";
          box.e4 = "";
  
          this.newBoxes.push(box);
        });
      }
    });
  }

  getTagsForMLKIT () {
    
  }

  //Erstellen einer CSV-Datei, welche in ML KIT benutzt werden kann
  saveForMLkit() {

    if (this.boolForMLKIT) {
      this.getCSVforMLKITfromAnnotation();
    } else {
      this.getCSVforMLKITfromAnnotationFromNormalCSV();
    }
    const date = new Date().toJSON().slice(0, 19);
    this.exportToCsv("annotations_mlkit_" + date + ".csv", this.csvMLkitBoxes);
  }

  getCSVforMLKITfromAnnotation(){

    let count = 0;

    this.tagList.forEach(t => {
      if (t.count < 10) {
        this.tagsLessTen.push(t.tagName);
        count++;
        console.log(t.tagName + " count: " + t.count);
      }
    });

    let bool = true;

    this.csvMLkitBoxes = [];
    this.annotations.forEach(b => {
      if (b.deleted) {
        //this.deleteImageDuringSaving(b.bildName);
      } else {
        bool = true;
        b.boxes.forEach(bo => {
          this.tagsLessTen.forEach(t => {
            if (t == bo.essen) {
              bool = false;
            }
          });
          if (bool) {
            let box: CSVRecordMLKIT;
            box = new CSVRecordMLKIT();
    
            box.purpose = "";
            box.bildName = "gs://dataset_food_detection/images/" + b.bildName;
    
            box.essen = bo.essen;
            box.x1 = bo.x1;
            box.y1 = bo.y1;
            box.e1 = "";
            box.e2 = "";
            box.x2 = bo.x2;
            box.y2 = bo.y2;
            box.e3 = "";
            box.e4 = "";
            this.csvMLkitBoxes.push(box);
          }
        });
      }
    });
  }

  //Holt Infos die gebraucht werden, um die CSV-Datei für ML KIT zu erstellen
  getCSVforMLKITfromAnnotationFromNormalCSV(){
    this.csvMLkitBoxes = [];
      this.annotations.forEach(b => {
        b.boxes.forEach(bo => {
          let box: CSVRecordMLKIT;
          box = new CSVRecordMLKIT();
  
          box.purpose = "";
          box.bildName = "gs://dataset_food_detection/images/" + b.bildName;
  
          box.essen = bo.essen;
          box.x1 = (bo.x1 / b.width);
          box.y1 = (bo.y1 / b.height);
          box.e1 = "";
          box.e2 = "";
          box.x2 = (bo.x2 / b.width);
          box.y2 = (bo.y2 / b.height);
          box.e3 = "";
          box.e4 = "";
          this.csvMLkitBoxes.push(box);
        });
    });
  }

  //speichert eine CSV-Datei welche vom Format ML KIT ist und auch aus dieser kommt
  saveForMLkitFromMLkit() {
    this.getFileForMLkit();
    this.exportToCsv("mlKitCSVfromMLKIT.csv", this.csvMLkitBoxes);
  }

  //holt sich die Infos von der CSV ML KIT Datei und speichert diese in eine neue
  getFileForMLkit(){

    this.csvMLkitBoxes = [];
    
    this.csvFromMLKIT.forEach(c => {
      let box: CSVRecordMLKIT;
      box = new CSVRecordMLKIT();

      box.purpose = "";
      box.bildName = "gs://dataset_food_detection/images/" + c.bildName;

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

  //###################################################################################
  //METHODEN FÜR BILDANZEIGE UND TAGS UND SPEICHERN VON CSV DATEIEN JEGLICHEN FORMATS
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

        parent.boundingBoxes[parent.boundingBoxes.length - 1].x1 = ((e.clientX - rect.left) / parent.scaleFactor) / parent.annotationsToShow[parent.index - 1].width;
        parent.boundingBoxes[parent.boundingBoxes.length - 1].y1 = ((e.clientY - rect.top) / parent.scaleFactor) / parent.annotationsToShow[parent.index - 1].height;
        parent.boundingBoxes[parent.boundingBoxes.length - 1].bildName = parent.annotationsToShow[parent.index - 1].bildName;
        parent.boundingBoxes[parent.boundingBoxes.length - 1].essen = "test";
      });

      this.layer1CanvasElement.addEventListener("mousemove", function(e) {
        if (!parent.isMouseDown) return;
        parent.context.clearRect(0, 0, parent.context.canvas.width, parent.context.canvas.height);
        parent.context.drawImage(parent.image, 0, 0, parent.displayImgWidth, parent.displayImgHeight);

        let rect = parent.layer1CanvasElement.getBoundingClientRect();

        parent.boundingBoxes[parent.boundingBoxes.length - 1].x2 = ((e.clientX - rect.left) / parent.scaleFactor) / parent.annotationsToShow[parent.index - 1].width;
        parent.boundingBoxes[parent.boundingBoxes.length - 1].y2 = ((e.clientY - rect.top) / parent.scaleFactor) / parent.annotationsToShow[parent.index - 1].height;
        parent.drawRect(parent.boundingBoxes[parent.boundingBoxes.length - 1]);
      });
  
      this.layer1CanvasElement.addEventListener("mouseup", function(e) {
        parent.isMouseDown = false;

        let rect = parent.layer1CanvasElement.getBoundingClientRect();

        parent.boundingBoxes[parent.boundingBoxes.length - 1].x2 = ((e.clientX - rect.left) / parent.scaleFactor) / parent.annotationsToShow[parent.index - 1].width;
        parent.boundingBoxes[parent.boundingBoxes.length - 1].y2 = ((e.clientY - rect.top) / parent.scaleFactor) / parent.annotationsToShow[parent.index - 1].height;
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
    this.context.rect(b.x1 * this.scaleFactor * this.annotationsToShow[this.index - 1].width, b.y1 * this.scaleFactor * this.annotationsToShow[this.index - 1].height,
                     (b.x2 - b.x1) * this.scaleFactor * this.annotationsToShow[this.index - 1].width, (b.y2 - b.y1) * this.scaleFactor * this.annotationsToShow[this.index - 1].height);
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
      width: '550px',
      height: '400px',
      data: { tag: '', tags: this.tags, lastTags: this.lastTags }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.boundingBoxes[this.boundingBoxes.length - 1].essen = result;
      this.addToTags(result);
    });
  }

  addToTags(tag: string) {
    if (!tag || tag.length == 0) return;
    // Add tag to list with all tags.
    let contains = false;
    this.tags.forEach(t => {
      if (t == tag) {
        contains = true;
      }
    });
    if (!contains) {
      this.tags.push(tag);
    }
    // Add tag to list with recently used tags.
    contains = false;
    this.lastTags.forEach(t => {
      if (t == tag) {
        contains = true;
      }
    });
    if (!contains) {
      this.lastTags.push(tag);
      if (this.lastTags.length > 10) {
        this.lastTags.splice(0,1);
      }
    }
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