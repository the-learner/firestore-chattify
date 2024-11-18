import { inject, Injectable } from '@angular/core';
import {
  Auth,
  authState,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  user,
  getAuth,
  User,
} from '@angular/fire/auth';
import { map, switchMap, firstValueFrom, filter, Observable, Subscription } from 'rxjs';
import {
  doc,
  docData,
  DocumentReference,
  Firestore,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  deleteDoc,
  collectionData,
  Timestamp,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  DocumentData,
  FieldValue,
} from '@angular/fire/firestore';
import {
  Storage,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from '@angular/fire/storage';
import { getToken, Messaging, onMessage } from '@angular/fire/messaging';
import { Router } from '@angular/router';
import {formatDate} from '@angular/common';

type ChatMessage = {
  name: string | null,
  profilePicUrl: string | null,
  timestamp: FieldValue,
  uid: string | null,
  text?: string,
  imageUrl?: string
};

type JobInfo = {
  role: string,
  description: string,
  minimum_qualifications: string,
  preferred_qualifications: string,
  responsibilities: string
};


@Injectable({
  providedIn: 'root',
})
export class ChatService {
  firestore: Firestore = inject(Firestore);
  auth: Auth = inject(Auth);
  storage: Storage = inject(Storage);
  messaging: Messaging = inject(Messaging);
  router: Router = inject(Router);
  private provider = new GoogleAuthProvider();
  LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif?a';

  // observable that is updated when the auth state changes
  user$ = user(this.auth);
  currentUser: User | null = this.auth.currentUser;
  userSubscription: Subscription;
  assessId = "";
   assessments = {assessments: []}

  groups: Array<{
    id: string;
    name: string;
    image: string;
  }> = [];
   questions: string[] = [];
  jobsRef: DocumentData | undefined;
  jobs: Array<{
    id: string;
    role: string;
    company: string;
    location: string;
  }> = [];

  generations: Array<{
    candidateId: string;
    insight: string;
    candidateName: string;
    candidateEmail: string;
  }> = [];
  constructor() {
    this.userSubscription = this.user$.subscribe((aUser: User | null) => {
        this.currentUser = aUser;
    });
  }

  // Signs-in Friendly Chat.
  login() {
    signInWithPopup(this.auth, this.provider).then(async (result) => {
      const credential = GoogleAuthProvider.credentialFromResult(result);
        console.log("Found!");
        const user = doc(this.firestore, 'users', result.user.uid);
        const userData = {
          "name": result.user.displayName,
          "email": result.user.email,
          "email_verified": result.user.emailVerified,
          "created_at": result.user.metadata.creationTime,
          "last_login": result.user.metadata.lastSignInTime,
          "photo_url": result.user.photoURL,
          "type": result.user.email == "nedstark.448450@gmail.com" ? "recruiter" : "candidate"
        }
        await setDoc(user, userData);
      await this.router.navigate(['/', 'jobs']);
      return credential;
    })
  }

  // Logout of Friendly Chat.
  logout() {
    signOut(this.auth).then(() => {
      this.router.navigate(['/', 'login'])
      console.log('signed out');
    }).catch((error) => {
      console.log('sign out error: ' + error);
    })
  }

  // Saves a new message to Cloud Firestore.
  saveTextMessage = async (assessmentId: string | undefined, assessments: any) => {
    if (assessmentId != undefined) {
      const user = doc(this.firestore, 'assessments', assessmentId);
      await setDoc(user, assessments);
    }
  };

  loadJobs = async () => {
    const questionRef = collection(this.firestore, "jobs");
    console.log("Loading questions...");
    const q = query(questionRef);
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((d: any) => {
      this.jobs.push({
        'id': d.id,
        'role': d.data()['role'],
        'company': d.data()['company'],
        'location': 'Mountain View, CA, USA'
      });
    });
    return this.jobs;
  }

  loadQuestions= async () => {
    const questionRef = collection(this.firestore, "questions");
    console.log("Loading questions...");
    const q = query(questionRef);
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((d: any) => {
      this.questions.push(d.data()['value']);
    });
  }

  // Returns the groups a user is part of
  loadGroups = async () => {
    const groupsRef = collection(this.firestore, "groups");
    console.log("Loading groups...", this.currentUser?.uid);
    const q = query(groupsRef, where('members', 'array-contains', this.currentUser?.uid));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (d: any) => {
      console.log(d.id, " => ", d.data());
      if (d.data()['is_group']) {
        this.groups.push(
          {
            "id": d.id,
            "name": d.data()['name'],
            "image": d.data()['photo']
          }
        );
      } else {
        const otherUser = d.data()["members"].filter((member: any) => member.id != this.currentUser?.uid)[0];
          this.groups.push(
            {
              "id": d.id,
              "name": otherUser['name'],
              "image": otherUser['photo']
            }
          );
      }
    });
    return this.groups;
  }

  generateInsights = async (jobId: string, text: string) => {
    const assessmentsRef = collection(this.firestore, "generations");
    const docRef = await addDoc(assessmentsRef,
      {
        'candidateId': this.currentUser?.uid,
        'candidateName': this.currentUser?.displayName,
        'candidateEmail': this.currentUser?.email,
        'jobId': jobId,
        'prompt': text
      });
  }

  startAssessment = async (jobId: string) => {
    const assessmentsRef = collection(this.firestore, "assessments");
    const q = query(assessmentsRef, where('candidateId', '==', this.currentUser?.uid), where('jobId', '==', jobId), orderBy("started_at", "desc"), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      console.log("Empty, creating insights...");
      const docRef = await addDoc(assessmentsRef,
        {
          'candidateId': this.currentUser?.uid,
          'candidateName': this.currentUser?.displayName,
          'candidateEmail': this.currentUser?.email,
          'jobId': jobId,
          'assessment': [{
            "text": "Hello there " + this.currentUser?.displayName + "! I am Recruiter Bot from HireMind, and I will ask you a few questions, so let's get started!",
            "type": "bot"
          }],
          'started_at': Date.now(),
          'cur_q': 0,
          'is_ans': true
        });
      this.assessId = docRef.id;
    }
    else {
      querySnapshot.forEach(doc => {
        this.assessId = doc.id;
      })
    }
    await this.loadQuestions();
  };



  // Saves a new message containing an image in Firebase.
  // This first saves the image in Firebase storage.
  saveImageMessage = async (file: any) => {};

  async updateData(path: string, data: any) {}

  async deleteData(path: string) {}

  getDocData(path: string) {}

  getCollectionData(path: string) {}

  async uploadToStorage(
    path: string,
    input: HTMLInputElement,
    contentType: any
  ) {
    return null;
  }
  // Requests permissions to show notifications.
  requestNotificationsPermissions = async () => {};

  saveMessagingDeviceToken = async () => {};

  async loadAssessments(jobId: string) {
    const generationsRef = collection(this.firestore, "generations");
    const q = query(generationsRef, where("jobId", '==', jobId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      console.log("No insights found...");
      this.generations = [];
    }
    querySnapshot.forEach(x => {
      console.log("Got these insights... ", x.data());
      this.generations.push({
        candidateId: x.data()['candidateId'],
        insight: x.data()['response'],
        candidateName: x.data()['candidateName'],
        candidateEmail: x.data()['candidateEmail']
      })
    });
    return this.generations;
  }
}
