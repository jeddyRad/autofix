import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSearch, faCalendarAlt, faComments, faCreditCard, faArrowRight } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FontAwesomeModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  faSearch = faSearch;
  faCalendarAlt = faCalendarAlt;
  faComments = faComments;
  faCreditCard = faCreditCard;
  faArrowRight = faArrowRight;
}
