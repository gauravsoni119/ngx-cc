import {
  Component, HostBinding, Input, Injector,
  OnInit, OnDestroy, DoCheck, forwardRef,
  ElementRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NG_VALIDATORS, NgControl, AbstractControl, ValidationErrors } from '@angular/forms';
import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { MatFormFieldControl } from '@angular/material/form-field';
import { Subject } from 'rxjs';
import validator from 'card-validator';

@Component({
  selector: 'ngx-cc-cvv',
  template: `
    <div class="ngx-cc-cvv-container" [ngClass]="styleClass">
      <input
        ngxNumberOnly
        [ngxMaxLength]="maxCvvLength"
        [ngClass]="{'ngx-cc-cvv-input': !defaultStyles}"
        type="text"
        [placeholder]="placeholder || ''"
        [required]="required"
        [disabled]="disabled"
        [value]="cardCvv"
        (blur)="updateOnTouch()"
        (input)="updateCvv($event)">
    </div>
  `,
  styles: [`
    .ngx-cc-cvv-input {
      border: none;
      background: none;
      padding: 0;
      outline: none;
      font: inherit;
      text-align: left;
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CcCvvComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => CcCvvComponent),
      multi: true
    },
    {
      provide: MatFormFieldControl,
      useExisting: forwardRef(() => CcCvvComponent),
      multi: true
    }
  ]
})
export class CcCvvComponent implements OnInit, OnDestroy, DoCheck, ControlValueAccessor, MatFormFieldControl<CcCvvComponent> {

  static nextId = 0;
  @Input() styleClass: string;
  @Input()
  get value() {
    return this._value;
  }
  set value(cardNumber) {
    this._value = cardNumber;
    this.onChanges(cardNumber);
    this.stateChanges.next();
  }

  @Input()
  get placeholder() {
    return this._placeholder;
  }
  set placeholder(placeholder: string) {
    this._placeholder = placeholder;
    this.stateChanges.next();
  }

  @Input()
  get empty() {
    return !(!!this.cardCvv);
  }

  @Input()
  get required() {
    return this._required;
  }
  set required(req: boolean) {
    this._required = coerceBooleanProperty(req);
    this.stateChanges.next();
  }

  @Input()
  get disabled() {
    if (this.ngControl && this.ngControl.disabled !== null) {
      return this.ngControl.disabled;
    }
    return this._disabled;
  }
  set disabled(dis: boolean) {
    this._disabled = coerceBooleanProperty(dis);
    this.stateChanges.next();
  }

  @Input()
  get defaultStyles() {
    return this._defaultStyles;
  }
  set defaultStyles(val: any) {
    this._defaultStyles = coerceBooleanProperty(val);
  }

  @Input('cvv-size')
  get cvvSize(): number {
    return this._cvvSize;
  }
  set cvvSize(value: number) {
    this._cvvSize = value;
    if (this.ngControl) {
      this.ngControl.control.updateValueAndValidity();
    }
  }

  // tslint:disable-next-line: variable-name
  private _value: any;
  // tslint:disable-next-line: variable-name
  private _placeholder: string;
  // tslint:disable-next-line: variable-name
  private _disabled = false;
  // tslint:disable-next-line: variable-name
  private _defaultStyles = false;
  // tslint:disable-next-line: variable-name
  private _required = false;
  // tslint:disable-next-line: variable-name
  private _cvvSize: number;
  ngControl: NgControl = null;
  focused = false;
  errorState = false;
  stateChanges = new Subject<void>();

  cardCvv = '';
  onChanges: any;
  onTouched: any;
  maxCvvLength = 4;

  @HostBinding() id = `ngx-cc${CcCvvComponent.nextId}`;
  @HostBinding('attr.aria-describedby') describedBy = '';
  @HostBinding('class.floating')
  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  constructor(
    private injector: Injector,
    private elRef: ElementRef<HTMLElement>,
    private fm: FocusMonitor
  ) {
    fm.monitor(elRef.nativeElement, true).subscribe(origin => {
      this.focused = !!origin;
      this.stateChanges.next();
    });
  }

  ngOnInit() {
    this.ngControl = this.injector.get(NgControl);
    if (this.ngControl !== null) {
      // Setting the value accessor directly (instead of using
      // the providers) to avoid running into a circular import.
      this.ngControl.valueAccessor = this;
    }
  }

  ngDoCheck() {
    if (this.ngControl) {
      this.errorState = this.ngControl.invalid && this.ngControl.touched;
      this.stateChanges.next();
    }
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const cvv = validator.cvv(control.value, this.cvvSize);
    return cvv.isValid ? null : { invalidCvv: true };
  }

  writeValue(val: string) {
    if (val) {
      this.cardCvv = val;
    }
  }

  registerOnChange(fn: any) {
    this.onChanges = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  setDescribedByIds(ids: string[]) {
    this.describedBy = ids.join(' ');
  }

  onContainerClick(event: MouseEvent) {
    if ((event.target as Element).tagName.toLowerCase() !== 'input') {
      this.elRef.nativeElement.querySelector('input').focus();
    }
  }

  updateCvv(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.cardCvv = value;
    this.onChanges(value);
    this.ngControl.control.markAsDirty();
  }

  updateOnTouch() {
    if (this.ngControl) {
      this.onTouched(this.ngControl.control.value);
      this.ngControl.control.markAsTouched();
    }
  }

  ngOnDestroy() {
    this.fm.stopMonitoring(this.elRef.nativeElement);
    this.stateChanges.complete();
  }

}
