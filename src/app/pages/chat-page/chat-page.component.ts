import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { DocumentData } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ChatService } from 'src/app/services/chat.service';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatSidenavModule} from '@angular/material/sidenav';
import {Router} from '@angular/router';



@Component({
  selector: 'app-chat-page',
  templateUrl: './chat-page.component.html',
  styleUrls: ['./chat-page.component.css'],
  standalone: true,
  imports: [AsyncPipe, FormsModule, MatIconModule, MatListModule, MatSidenavModule]
})
export class ChatPageComponent {

  chatService = inject(ChatService);
  user$ = this.chatService.user$;
  groups!: Promise<Array<{
  name: string;
  image: string;
}>>
  jobs?: Promise<Array<{
    id: string;
    role: string;
    company: string;
    location: string;
  }>>;
  constructor(private router: Router) {
  }

  async ngOnInit() {
    this.groups = this.chatService.loadGroups();
    this.jobs = this.chatService.loadJobs();
    console.log("Loading jobs... ", this.jobs);
  }

  doSomething(val: {
    name: string;
    image: string;
  }) {
    console.log("Doing it!", val)
  }

  doSomethingElse(val: {
    id: string;
    role: string;
    company: string;
    location: string;
  }) {
    console.log("Doing something else!!", val);
    if (this.chatService.currentUser?.email == "nedstark.448450@gmail.com") {
      this.router.navigate(['assessments/' + val.id]);
    } else {
      this.router.navigate(['job-chat/' + val.id]);
    }
  }
}
