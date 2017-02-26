import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ColorPickerService } from './color-picker.service';
import { ColorPickerComponent } from './color-picker.component';
import { ColorPickerDirective, TextDirective, SliderDirective } from './color-picker.directive';

@NgModule({
  imports: [ CommonModule ],
  providers: [ ColorPickerService ],
  declarations: [ ColorPickerComponent, ColorPickerDirective, TextDirective, SliderDirective ],
  exports: [ ColorPickerDirective ],
  entryComponents: [ ColorPickerComponent ]
})
export class ColorPickerModule {}