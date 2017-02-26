import { OnInit,
    OnChanges,
    Directive,
    Input,
    Output,
    EventEmitter,
    ElementRef,
    ViewContainerRef,
    ReflectiveInjector,
    ComponentFactoryResolver } from '@angular/core';

import { ColorPickerService } from './color-picker.service';
import { ColorPickerComponent } from './color-picker.component';

@Directive({
    selector: '[colorPicker]',
    host: {
        '(input)': 'changeInput($event.target.value)',
        '(click)': 'onClick()'
    }
})
export class ColorPickerDirective implements OnInit, OnChanges {
    @Input('colorPicker') colorPicker: string;
    @Output('colorPickerChange') colorPickerChange = new EventEmitter<string>(true);
    @Input('cpToggle') cpToggle: boolean;
    @Output('cpToggleChange') cpToggleChange = new EventEmitter<boolean>(true);
    @Input('cpPosition') cpPosition: string = 'right';
    @Input('cpPositionOffset') cpPositionOffset: string = '0%';
    @Input('cpPositionRelativeToArrow') cpPositionRelativeToArrow: boolean = false;
    @Input('cpOutputFormat') cpOutputFormat: string = 'hex';
    @Input('cpPresetLabel') cpPresetLabel: string = 'Preset colors';
    @Input('cpPresetColors') cpPresetColors: Array<string>;
    @Input('cpCancelButton') cpCancelButton: boolean = false;
    @Input('cpCancelButtonClass') cpCancelButtonClass: string = 'cp-cancel-button-class';
    @Input('cpCancelButtonText') cpCancelButtonText: string = 'Cancel';
    @Input('cpOKButton') cpOKButton: boolean = false;
    @Input('cpOKButtonClass') cpOKButtonClass: string = 'cp-ok-button-class';
    @Input('cpOKButtonText') cpOKButtonText: string = 'OK';
    @Input('cpFallbackColor') cpFallbackColor: string = '#fff';
    @Input('cpHeight') cpHeight: string = 'auto';
    @Input('cpWidth') cpWidth: string = '230px';
    @Input('cpIgnoredElements') cpIgnoredElements: any = [];
    @Input('cpDialogDisplay') cpDialogDisplay: string = 'popup';
    @Input('cpSaveClickOutside') cpSaveClickOutside: boolean = true;
    @Input('cpAlphaChannel') cpAlphaChannel: string = 'hex6';
    @Input('cpEmitByMove') cpEmitByMove: boolean = true;

    private dialog: any;
    private created: boolean;
    private ignoreChanges: boolean = false;

    constructor(private vcRef: ViewContainerRef, private el: ElementRef, private service: ColorPickerService, private cfr: ComponentFactoryResolver) {
            this.created = false;
    }

    ngOnChanges(changes: any): void {
        if (changes.cpToggle) {
            if (changes.cpToggle.currentValue) this.openDialog();
            if (!changes.cpToggle.currentValue && this.dialog) this.dialog.closeColorPicker();
        }
        if (changes.colorPicker) {
            if (this.dialog && !this.ignoreChanges) {
                if (this.cpDialogDisplay === 'inline') {
                    this.dialog.setInitialColor(changes.colorPicker.currentValue);
                }
                this.dialog.setColorFromString(changes.colorPicker.currentValue, false);

            }
            this.ignoreChanges = false;
        }
    }

    ngOnInit() {
        let hsva = this.service.stringToHsva(this.colorPicker);
        if (hsva === null) hsva = this.service.stringToHsva(this.colorPicker, true);
        if (hsva == null) {
            hsva = this.service.stringToHsva(this.cpFallbackColor);
        }
        this.colorPickerChange.emit(this.service.outputFormat(hsva, this.cpOutputFormat, this.cpAlphaChannel === 'hex8'));
    }

    onClick() {
        if (this.cpIgnoredElements.filter((item: any) => item === this.el.nativeElement).length === 0) {
            this.openDialog();
        }
    }

    openDialog() {
        if (!this.created) {
            this.created = true;
            const compFactory = this.cfr.resolveComponentFactory(ColorPickerComponent);
            const injector = ReflectiveInjector.fromResolvedProviders([], this.vcRef.parentInjector);
            const cmpRef = this.vcRef.createComponent(compFactory, 0, injector, []);
            cmpRef.instance.setDialog(this, this.el, this.colorPicker, this.cpPosition, this.cpPositionOffset,
                this.cpPositionRelativeToArrow, this.cpOutputFormat, this.cpPresetLabel, this.cpPresetColors,
                this.cpCancelButton, this.cpCancelButtonClass, this.cpCancelButtonText, this.cpOKButton,
                this.cpOKButtonClass, this.cpOKButtonText, this.cpHeight, this.cpWidth, this.cpIgnoredElements,
                this.cpDialogDisplay, this.cpSaveClickOutside, this.cpAlphaChannel, this.cpEmitByMove);
            this.dialog = cmpRef.instance;
        } else if (this.dialog) {
            this.dialog.openDialog(this.colorPicker);
        }
    }

    colorChanged(value: string, ignore: boolean = true) {
        this.ignoreChanges = ignore;
        this.colorPickerChange.emit(value)
    }

    changeInput(value: string) {
        this.dialog.setColorFromString(value, true);
    }

    toggle(value: boolean) {
        this.cpToggleChange.emit(value);
    }
}


@Directive({
    selector: '[text]',
    host: {
        '(input)': 'changeInput($event.target.value)'
    }
})
export class TextDirective {
    @Output('newValue') newValue = new EventEmitter<any>();
    @Input('text') text: any;
    @Input('rg') rg: number;

    changeInput(value: string) {
        if (this.rg === undefined) {
            this.newValue.emit(value);
        } else {
            let numeric = parseFloat(value)
            if (!isNaN(numeric) && numeric >= 0 && numeric <= this.rg) {
                this.newValue.emit({v: numeric, rg: this.rg});
            }
        }
    }
}

@Directive({
    selector: '[slider]',
    host: {
        '(mousedown)': 'start($event)',
        '(touchstart)': 'start($event)'
    }
})
export class SliderDirective {
    @Output('newValue') newValue = new EventEmitter<any>();
    @Input('slider') slider: string;
    @Input('rgX') rgX: number;
    @Input('rgY') rgY: number;
    private listenerMove: any;
    private listenerStop: any;

    constructor(private el: ElementRef) {
        this.listenerMove = (event: any) => {
            this.move(event)
        };
        this.listenerStop = () => {
            this.stop()
        };
    }

    setCursor(event: any) {
        let height = this.el.nativeElement.offsetHeight;
        let width = this.el.nativeElement.offsetWidth;
        let x = Math.max(0, Math.min(this.getX(event), width));
        let y = Math.max(0, Math.min(this.getY(event), height));

        if (this.rgX !== undefined && this.rgY !== undefined) {
            this.newValue.emit({s: x / width, v: (1 - y / height), rgX: this.rgX, rgY: this.rgY});
        } else if (this.rgX === undefined && this.rgY !== undefined) {//ready to use vertical sliders
            this.newValue.emit({v: y / height, rg: this.rgY});
        } else {
            this.newValue.emit({v: x / width, rg: this.rgX});
        }
    }

    move(event: any) {
        event.preventDefault();
        this.setCursor(event);
    }

    start(event: any) {
        this.setCursor(event);
        document.addEventListener('mousemove', this.listenerMove);
        document.addEventListener('touchmove', this.listenerMove);
        document.addEventListener('mouseup', this.listenerStop);
        document.addEventListener('touchend', this.listenerStop);
    }

    stop() {
        document.removeEventListener('mousemove', this.listenerMove);
        document.removeEventListener('touchmove', this.listenerMove);
        document.removeEventListener('mouseup', this.listenerStop);
        document.removeEventListener('touchend', this.listenerStop);
    }

    getX(event: any): number {
        return (event.pageX !== undefined ? event.pageX : event.touches[0].pageX) - this.el.nativeElement.getBoundingClientRect().left - window.pageXOffset;
    }

    getY(event: any): number {
        return (event.pageY !== undefined ? event.pageY : event.touches[0].pageY) - this.el.nativeElement.getBoundingClientRect().top - window.pageYOffset;
    }
}