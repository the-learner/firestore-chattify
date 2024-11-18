import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecruiterJobsComponent } from './recruiter-jobs.component';

describe('ChatPageComponent', () => {
  let component: RecruiterJobsComponent;
  let fixture: ComponentFixture<RecruiterJobsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RecruiterJobsComponent]
    });
    fixture = TestBed.createComponent(RecruiterJobsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
