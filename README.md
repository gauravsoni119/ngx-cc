# NgxCc - Credit Card Validator for Angular Apps

ngx-cc provides set of components that can determine the card type(e.g visa, master card etc) and validate it by using [card-validator](https://www.npmjs.com/package/card-validator).
It can be used with or without angular material. Please look at the demo for more details.

# Features!

  - Validate card and show their respective icon 
  - Validate card date
  - Validate card CVV

# How to install

1. Import the `NgxCcModule` in the desired module. 

```js
import { NgModule } from '@angular/core';
import { NgxCcModule } from 'ngx-cc';
import { AppComponent } from './app.component';

@NgModule({
  imports: [NgxCcModule],
  declarations: [AppComponent],
  bootstrap: [AppComponent]
})
export class AppModule {
}
```


# Components
 **Selector**: ngx-cc
 
 **Description**: A component used to validate the card number and show the matched card type as user start typing.
 
 **Selector**: ngx-cc-date
 
 **Description**: A component used to validate the card date and format it if valid
 
  **Selector**: ngx-cc-cvv
  
 **Description**: A component used to validate the card security code.
 
 In order to override the **styles** on the component, you can pass a css class by using **styleClass** property on any of above component

 **Note:**  In order to use it without angular material, you need to set defaultStyles attribute on components.
