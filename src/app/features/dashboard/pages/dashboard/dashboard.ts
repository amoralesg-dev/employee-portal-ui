import { Component } from '@angular/core';

import {
  PageHeaderComponent,
  PageContentComponent
} from '@rassini/rassini-ui';

@Component({
  selector: 'app-dashboard',
  imports: [
    PageHeaderComponent,
    PageContentComponent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {

}
