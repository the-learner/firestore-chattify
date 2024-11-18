import {Component, inject} from '@angular/core';
import {AsyncPipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatSidenavModule} from '@angular/material/sidenav';
import { ActivatedRoute } from '@angular/router';
import {ChatService} from '../../services/chat.service';
import {MatCard, MatCardContent, MatCardSubtitle, MatCardTitle} from '@angular/material/card';
import {collection, doc, Firestore, getDoc, getDocs, limit, onSnapshot, query, where} from '@angular/fire/firestore';
import {Observable} from 'rxjs';

type Message = {
  uid: string,
  photo: string,

}
@Component({
  selector: 'app-chat-page',
  templateUrl: './job-chat-page.component.html',
  styleUrls: ['./job-chat-page.component.css'],
  standalone: true,
  imports: [AsyncPipe, FormsModule, MatIconModule, MatListModule, MatSidenavModule, MatCard, MatCardTitle, MatCardSubtitle, MatCardContent]
})
export class JobChatPageComponent {
  chatService = inject(ChatService);
  user = this.chatService.currentUser;
  jobId: string = '';
  jobInfo ?: any;
  messages: any[] = [];
  assessmentInfo?: any;
  text: string = "";
  assessmentId: string | undefined = "";
  firestore: Firestore = inject(Firestore);
  botUrl: string = "https://www.gstatic.com/images/branding/productlogos/waze/v8/192px.svg";
  userUrl = this.user ? this.user.photoURL : "https://www.gstatic.com/images/branding/productlogos/contacts_2022_round/v2/192px.svg";
  showPopup = false;
  insight: string = "Thank you for completing your HireMind assessment!  A recruiter will review your results and be in touch if your profile matches the job requirements.";
  constructor(private route: ActivatedRoute) {}

  async ngOnInit() {
    this.jobId = this.route.snapshot.params['job_id'];
    await this.loadJobInfo(this.jobId);
    console.log(this.jobInfo);
    await this.chatService.startAssessment(this.jobId);
    this.assessmentId = this.chatService.assessId;
    await this.listen(this.assessmentId);
    console.log(this.assessmentInfo);
    this.messages = this.assessmentInfo.assessment;
  }

  listen = async (assessmentId: string | undefined) => {
    if (assessmentId != undefined) {
      const unsub = onSnapshot(doc(this.firestore, "assessments", assessmentId), async (doc) => {
        if (doc.exists()) {
          this.assessmentInfo = doc.data();
          this.messages = doc.get("assessment");
          if (this.assessmentInfo['is_ans']) {
            await this.sendMessageBot();
          }
        }
      })
    }
  }

  async sendMessageBot() {
    const cur_q = this.assessmentInfo['cur_q']
    if (cur_q >= 3) {
      if (this.assessmentInfo['is_completed']) {
        console.log("Completed already... Fetching it..");
        // await this.getInsights(this.jobId);
        // console.log(this.insight);
        this.showPopup = true;
      }
      else {
        this.generatePromptText();
        await this.chatService.generateInsights(this.jobId, this.generatePromptText());
        this.assessmentInfo.is_completed = true;
        await this.chatService.saveTextMessage(this.assessmentId, this.assessmentInfo);
      }
    }
    else {
      this.messages.push({
        "text": this.chatService.questions.at(cur_q),
        "type": "bot"
      });
      this.assessmentInfo.assessment = this.messages;
      this.assessmentInfo.cur_q = cur_q + 1;
      this.assessmentInfo.is_ans = false;
      await this.chatService.saveTextMessage(this.assessmentId, this.assessmentInfo);
    }
  }

  async sendMessageUser() {
    console.log("Will send.. ", this.text);
    this.messages.push({
      "text": this.text,
      "type": "user"
    });
    this.assessmentInfo.assessment = this.messages;
    this.assessmentInfo.is_ans = true;
    await this.chatService.saveTextMessage(this.assessmentId, this.assessmentInfo);
    this.text = "";
  }

  generatePromptText() {
    let promptText = "";
    promptText = promptText.concat("Job Description: " + this.jobInfo.description +", ");
    this.messages.forEach(message => {
      if (message.type == "bot") {
        promptText = promptText.concat("Bot: " + message.text + " ");
      }
      if (message.type == "user") {
        promptText = promptText.concat("Candidate: " + message.text + " ");
      }
    })
    console.log("This prompt will go... " + promptText);
    return promptText;
  }

  loadJobInfo = async (jobId: string) => {
    const jobsRef = doc(this.firestore, "jobs", jobId);
    const jobs = await getDoc(jobsRef)
    this.jobInfo = jobs.data();
    console.log(this.jobInfo);
  }
}
