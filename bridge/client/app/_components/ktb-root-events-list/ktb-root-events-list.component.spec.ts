import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { SequencesMock } from '../../_services/_mockData/sequences.mock';
import { of } from 'rxjs';
import { ApiService } from '../../_services/api.service';
import { ApiServiceMock } from '../../_services/api.service.mock';
import { KtbRootEventsListComponent } from './ktb-root-events-list.component';
import { KtbRootEventsListModule } from './ktb-root-events-list.module';

describe('KtbRootEventsListComponent', () => {
  let component: KtbRootEventsListComponent;
  let fixture: ComponentFixture<KtbRootEventsListComponent>;
  const projectName = 'sockshop';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [],
      imports: [KtbRootEventsListModule, HttpClientTestingModule, RouterTestingModule],
      providers: [
        {
          provide: ApiService,
          useClass: ApiServiceMock,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({}),
            params: of({ projectName }),
            queryParams: of({}),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(KtbRootEventsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create root-events-list component', () => {
    expect(component).toBeTruthy();
  });

  it('should select provided sequence', () => {
    // given
    const selectedSequenceIndex = 1;
    component.events = SequencesMock;
    component.selectedEvent = SequencesMock[selectedSequenceIndex];
    fixture.detectChanges();

    // then
    const selectedTile = getSequenceTile(selectedSequenceIndex);
    expect(selectedTile.getAttribute('class')).toContain('ktb-tile-selected');
  });

  it('should select sequence', () => {
    // given
    const selectedSequenceIndex = 5;
    const changeEvent = jest.spyOn(component.selectedEventChange, 'emit');
    component.events = SequencesMock;
    fixture.detectChanges();

    // when
    const targetSequence = getSequenceTile(selectedSequenceIndex);
    const eventData = { sequence: SequencesMock[selectedSequenceIndex], stage: undefined };
    targetSequence.click();
    fixture.detectChanges();

    // then
    expect(targetSequence.getAttribute('class')).toContain('ktb-tile-selected');
    expect(component.selectedEvent).toEqual(eventData.sequence);
    expect(changeEvent).toHaveBeenCalledWith(eventData);
  });

  it('should select sequence with stage', () => {
    // given
    const selectedSequenceIndex = 8;
    const changeEvent = jest.spyOn(component.selectedEventChange, 'emit');
    component.events = SequencesMock;
    fixture.detectChanges();

    // when
    const targetSequence = getSequenceTile(selectedSequenceIndex);
    const stageBadges = targetSequence.querySelectorAll('ktb-stage-badge');
    const targetStage = stageBadges[0] as HTMLElement;
    const stageName = targetStage.querySelector('dt-tag')?.textContent;
    targetStage.click();
    fixture.detectChanges();

    // then
    expect(stageBadges.length).toEqual(2);
    expect(targetSequence.getAttribute('class')).toContain('ktb-tile-selected');
    expect(changeEvent).toHaveBeenCalledWith({
      sequence: SequencesMock[selectedSequenceIndex],
      stage: stageName,
    });
  });

  it('should have a no specific class when a sequence is running', () => {
    // given
    prepareSequenceElement(false, false, false);

    // when
    const sequence = fixture.debugElement.queryAll(By.css('.ktb-selectable-tile'))[0];
    sequence.nativeElement.click();
    fixture.detectChanges();

    // then
    expect(sequence.classes['ktb-tile-selected']).toBe(true);
  });

  it('should have an error class when a sequence is finished and failed', () => {
    // given
    prepareSequenceElement(true, true, false);

    // when
    const sequence = fixture.debugElement.queryAll(By.css('.ktb-selectable-tile'))[0];
    fixture.detectChanges();

    // then
    expect(sequence.classes['ktb-tile-error']).toBe(true);
  });

  it('should have a success class when a sequence is finished and not failed', () => {
    // given
    prepareSequenceElement(true, false, false);

    // when
    const sequence = fixture.debugElement.queryAll(By.css('.ktb-selectable-tile'))[0];
    fixture.detectChanges();

    // then
    expect(sequence.classes['ktb-tile-success']).toBe(true);
  });

  it('should have a highlight class when a sequence has pending approvals', () => {
    // given
    prepareSequenceElement(false, false, true);

    // when
    const sequence = fixture.debugElement.queryAll(By.css('.ktb-selectable-tile'))[0];
    fixture.detectChanges();

    // then
    expect(sequence.classes['ktb-tile-highlight']).toBe(true);
  });

  function getSequenceTile(index: number): HTMLElement {
    return fixture.nativeElement.querySelector(
      `ktb-selectable-tile[uitestid="keptn-root-events-list-${SequencesMock[index].shkeptncontext}"]`
    );
  }

  function prepareSequenceElement(isFinished: boolean, isFaulty: boolean, hasPendingApproval: boolean): void {
    component.events = SequencesMock;
    jest.spyOn(component.events[0], 'isFinished').mockReturnValue(isFinished);
    jest.spyOn(component.events[0], 'isFaulty').mockReturnValue(isFaulty);
    jest.spyOn(component.events[0], 'hasPendingApproval').mockReturnValue(hasPendingApproval);
    fixture.detectChanges();
  }
});
