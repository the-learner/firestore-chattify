import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import {collection, DocumentData, Firestore, getDocs, limit, query, where} from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ChatService } from 'src/app/services/chat.service';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatSidenavModule} from '@angular/material/sidenav';
import {ActivatedRoute, Router} from '@angular/router';



@Component({
  selector: 'app-chat-page',
  templateUrl: './recruiter-jobs.component.html',
  styleUrls: ['./recruiter-jobs.component.css'],
  standalone: true,
  imports: [AsyncPipe, FormsModule, MatIconModule, MatListModule, MatSidenavModule]
})
export class RecruiterJobsComponent {

  chatService = inject(ChatService);
  user$ = this.chatService.user$;
  assessments?: Promise<Array<{
    candidateId: string;
    insight: string;
    candidateName: string;
    candidateEmail: string;
  }>>;
  firestore: Firestore = inject(Firestore);
  jobId: string = '';
  showPopup: boolean = false;
  insight: string = '';
  showNoAssessments: boolean = false;
  constructor(private router: Router, private route: ActivatedRoute) {
  }

  async ngOnInit() {
    this.jobId = this.route.snapshot.params['job_id'];
    this.assessments = this.chatService.loadAssessments(this.jobId);
    console.log("Loading jobs... ", this.assessments);
  }

  doSomething(val: {
    name: string;
    image: string;
  }) {
    console.log("Doing it!", val)
  }

  doSomethingElse(val: {
    candidateId: string;
    insight: string;
    candidateName: string;
    candidateEmail: string;
  }) {
    console.log("Doing something else!!", val);
    try {
      this.insight = val.insight.split("<body>")[1].split("</body>")[0];
    } catch (e) {
      this.insight = val.insight;
    }
    this.showPopup = true;
  }

  getInsights = async (jobId: string) => {
    const assessmentsRef = collection(this.firestore, "generations");
    const q = query(assessmentsRef, where("jobId", '==', jobId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      console.log("No insights found...");
      this.showNoAssessments = true;
    }
    querySnapshot.forEach(x => {
      console.log("Got these insights... ", x.data());
    })
  }
}
