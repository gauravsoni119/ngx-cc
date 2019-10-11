import {
  Component, HostBinding, Input, Injector, Optional,
  OnInit, OnDestroy, DoCheck, forwardRef,
  ViewEncapsulation, ElementRef
} from '@angular/core';
import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NG_VALIDATORS, NgControl, NgForm, FormGroupDirective, FormControl } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldControl } from '@angular/material/form-field';
import { Subject, Subscription } from 'rxjs';

import { NgxCcService } from './ngx-cc.service';
import { CardConfig } from './ngx-cc.model';
import { CardValidator } from './validators/ngx-cc.validator';
import { cardIcons } from './ngx-cc.icons';

@Component({
  selector: 'ngx-cc',
  template: `
      <div class="ngx-cc-container" [ngClass]="styleClass">
        <input *ngIf="!defaultStyles"
        ngxNumberOnly
        [ngxMaxLength]="maxNumberLimit"
        class="ngx-cc-input"
        type="text"
        [required]="required"
        [disabled]="disabled"
        [value]="cardNumber"
        (blur)="updateOnTouch()"
        (input)="updateIcon($event)" />

        <input *ngIf="defaultStyles"
        ngxNumberOnly
        [ngxMaxLength]="maxNumberLimit"
        class="ngx-cc-input-default"
        type="text"
        [placeholder]="placeholder"
        [required]="required"
        [disabled]="disabled"
        [value]="cardNumber"
        [ngStyle]="{'background-image': 'url(' + cardIcon + ')'}"
        (blur)="updateOnTouch()"
        (input)="updateIcon($event)" />
        <img *ngIf="!defaultStyles" class="ngx-cc-suffix" [src]="cardIcon" />
      </div>
      `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NgxCcComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useValue: CardValidator,
      multi: true
    },
    {
      provide: MatFormFieldControl,
      useExisting: forwardRef(() => NgxCcComponent),
      multi: true
    }
  ],
  styles: [
    `
    .ngx-cc-container {
      display: flex;
      position: relative;
    }
    .ngx-cc-input {
      border: none;
      background: none;
      padding: 0;
      outline: none;
      font: inherit;
      text-align: left;
    }
    .ngx-cc-input-default {
      background-position: 100%;
      background-repeat: no-repeat;
    }
    .ngx-cc-form-field div.mat-form-field-wrapper div.mat-form-field-flex {
      align-items: flex-end;
    }
    .ngx-cc-suffix {
      position: absolute;
      top: -1.5rem;
      right: 0;
    }
    `
  ],
  encapsulation: ViewEncapsulation.None
})
export class NgxCcComponent implements OnInit, OnDestroy, DoCheck, ControlValueAccessor, MatFormFieldControl<NgxCcComponent> {

  static nextId = 0;
  @Input() styleClass: string;
  @Input()
  get value() {
    return this._value;
  }
  set value(cardNumber) {
    this._value = cardNumber;
    this.onChange(cardNumber);
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
    const value = this.cardNumber.replace(/\s/g, '');
    return !(!!value);
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
  private _formSubmitSubscription: Subscription;
  ngControl: NgControl = null;
  focused = false;
  errorState = false;
  cardNumber = '';
  cardIcon = cardIcons.default;
  card: CardConfig;
  onChange: any;
  onTouched: any;
  stateChanges = new Subject<void>();
  maxNumberLimit: number;
  @HostBinding() id = `ngx-cc${NgxCcComponent.nextId}`;
  @HostBinding('attr.aria-describedby') describedBy = '';
  @HostBinding('class.floating')
  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  constructor(
    private injector: Injector,
    private elRef: ElementRef<HTMLElement>,
    private fm: FocusMonitor,
    @Optional() private parentForm: NgForm,
    @Optional() private parentFormGroup: FormGroupDirective,
    private defaultErrorStateMatcher: ErrorStateMatcher,
    private creditCardService: NgxCcService
  ) {
    const parent = this.parentFormGroup || this.parentForm;
    if (parent){
      this._formSubmitSubscription = parentFormGroup.ngSubmit.subscribe(() => {
        this.ngControl.control.markAsTouched();
      });
    }

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
      this.updateErrorState();
    }
  }

  writeValue(value: string) {
    this.cardNumber = value || '';
  }

  registerOnChange(fn: any) {
    this.onChange = fn;
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

  updateIcon(event: Event) {
    const value = (event.target as HTMLInputElement).value.replace(/\s/g, '');
    let cardType = 'default';
    this.onChange(value);
    this.ngControl.control.markAsDirty();
    this.card = this.creditCardService.getCardType(value);
    if (this.card) {
      this.maxNumberLimit = Math.max(...this.card.lengths);
      cardType = this.card.type;
    }
    this.cardNumber = this.creditCardService.prettyCardNumber(value, cardType);
    this.cardIcon = !value ? cardIcons.default : cardIcons[cardType];
  }

  updateOnTouch() {
    if (this.ngControl) {
      this.onTouched(this.ngControl.control.value);
      this.ngControl.control.markAsTouched();
    }
  }

  ngOnDestroy() {
    if (this._formSubmitSubscription) this._formSubmitSubscription.unsubscribe();
    this.fm.stopMonitoring(this.elRef.nativeElement);
    this.stateChanges.complete();
  }

  updateErrorState() {
    const oldState = this.errorState;
    const parent = this.parentFormGroup || this.parentForm;
    const matcher = this.defaultErrorStateMatcher;
    const control = this.ngControl ? this.ngControl.control as FormControl : null;
    const newState = matcher.isErrorState(control, parent);

    if (newState !== oldState) {
      this.errorState = newState;
      this.stateChanges.next();
    }
  }
}
