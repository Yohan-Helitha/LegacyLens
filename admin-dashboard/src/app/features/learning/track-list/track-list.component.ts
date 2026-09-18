import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LearningService, LearningTrack } from '../../../core/services/learning.service';

@Component({
  selector: 'app-track-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './track-list.component.html',
  styleUrl: './track-list.component.scss'
})
export class TrackListComponent implements OnInit {
  tracks: LearningTrack[] = [];

  constructor(private learningService: LearningService) {}

  ngOnInit(): void {
    this.learningService.getTracks().subscribe(data => {
      this.tracks = data;
    });
  }
}
