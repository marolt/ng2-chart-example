// import './polyfills.browser';
// import './rxjs.imports';
//
// declare var ENV: string;
//
// import { enableProdMode } from '@angular/core';
// import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
// import { bootloader } from '@angularclass/hmr';
// import { AppModule } from './app/app.module';
//
// if ('production' === ENV) {
//   enableProdMode();
// }
//
// export function main() {
//   return platformBrowserDynamic().bootstrapModule(AppModule)
//     .catch(err => console.log(err));
// }
//
// export function bootstrapDomReady() {
//   document.addEventListener('DOMContentLoaded', main);
// }
//
// // bootstrapDomReady();
//
// bootloader(main);



import './polyfills.browser';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
// import { environment } from './environments/environment';
import { AppModule } from './app/app.module';

// if (environment.production) {
//   enableProdMode();
// }

platformBrowserDynamic().bootstrapModule(AppModule);
