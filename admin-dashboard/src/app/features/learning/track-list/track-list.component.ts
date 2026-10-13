import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LearningService, LearningTrack } from '../../../core/services/learning.service';
import { LearningSidebarComponent } from '../components/learning-sidebar/learning-sidebar.component';


@Component({
  selector: 'app-track-list',
  standalone: true,
  imports: [CommonModule, RouterLink, LearningSidebarComponent, FormsModule],
  templateUrl: './track-list.component.html',
  styleUrl: './track-list.component.scss'
})
export class TrackListComponent implements OnInit {
  tracks: LearningTrack[] = [];
  loading = true;
  currentDate: Date = new Date();
  
  searchQuery: string = '';
  selectedDifficulty: string = '';
  isSidebarOpen = false;

  constructor(private learningService: LearningService) {}

  get filteredTracks(): LearningTrack[] {
    return this.tracks.filter(track => {
      const matchesSearch = !this.searchQuery || 
        track.title.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
        (track.description && track.description.toLowerCase().includes(this.searchQuery.toLowerCase()));
      
      const matchesDifficulty = !this.selectedDifficulty || 
        (track.difficultyLevel && track.difficultyLevel.toUpperCase() === this.selectedDifficulty.toUpperCase());
        
      return matchesSearch && matchesDifficulty;
    });
  }

  ngOnInit(): void {
    setInterval(() => {
      this.currentDate = new Date();
    }, 60000);
    this.loadTracks();
  }

  loadTracks(): void {
    this.loading = true;
    this.learningService.getTracks().subscribe({
      next: (data) => {
        this.tracks = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getByDifficulty(level: string): number {
    return this.tracks.filter(t => t.difficultyLevel === level).length;
  }

  deleteTrack(id: number | undefined): void {
    if (!id) return;
    if (confirm('Are you sure you want to delete this track? All lessons and contents will be permanently deleted.')) {
      this.learningService.deleteTrack(id).subscribe({
        next: () => this.loadTracks(),
        error: (err) => alert('Failed to delete track: ' + (err.error?.message || 'Something went wrong. Please try again.'))
      });
    }
  }
}
